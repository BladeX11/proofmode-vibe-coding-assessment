import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { runFormatDurationTests } from "./execution";

const MAX_CONCURRENT_TEST_RUNS = 2;
const MAX_TESTS_PER_MINUTE = 8;
const TEST_RATE_WINDOW_MS = 60_000;
const testRateWindows = new Map<string, { count: number; resetAt: number }>();
let activeTestRuns = 0;


export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  assessment: router({
    runTests: publicProcedure
      .input(z.object({ source: z.string().max(20_000) }))
      .mutation(async ({ ctx, input }) => {
        const now = Date.now();
        const clientId =
          ctx.req.ip || ctx.req.socket.remoteAddress || "unknown";

        let rateWindow = testRateWindows.get(clientId);
        if (!rateWindow || now >= rateWindow.resetAt) {
          rateWindow = {
            count: 0,
            resetAt: now + TEST_RATE_WINDOW_MS,
          };
          testRateWindows.set(clientId, rateWindow);
        }

        if (rateWindow.count >= MAX_TESTS_PER_MINUTE) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Test limit reached. Try again in a minute.",
          });
        }
        rateWindow.count += 1;

        for (const [key, entry] of testRateWindows) {
          if (entry.resetAt <= now) testRateWindows.delete(key);
        }

        if (activeTestRuns >= MAX_CONCURRENT_TEST_RUNS) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "The execution queue is busy. Try again shortly.",
          });
        }

        activeTestRuns += 1;
        try {
          return await runFormatDurationTests(input.source);
        } finally {
          activeTestRuns -= 1;
        }
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
