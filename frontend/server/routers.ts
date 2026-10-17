import { COOKIE_NAME } from "@shared/const";
import { desc, eq, sql } from "drizzle-orm";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { runFormatDurationTests } from "./execution";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getDb } from "./db";
import {
  assessmentSessions,
  codeSubmissions,
  executionRuns,
  executionCaseResults,
} from "../drizzle/schema";

const MAX_CONCURRENT_TEST_RUNS = 2;
const MAX_TESTS_PER_MINUTE = 8;
const TEST_RATE_WINDOW_MS = 60_000;
const testRateWindows = new Map<string, { count: number; resetAt: number }>();
let activeTestRuns = 0;


const sessionCreationWindows = new Map<
  string,
  { count: number; resetAt: number }
>();

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
    startSession: publicProcedure
      .input(z.object({
        assessmentSlug: z.string().regex(/^[a-z0-9-]{1,128}$/),
        assessmentVersion: z.number().int().positive().max(1000),
      }))
      .mutation(async ({ ctx, input }) => {
        const now = Date.now();
        const clientId =
          ctx.req.ip || ctx.req.socket.remoteAddress || "unknown";

        for (const [key, entry] of sessionCreationWindows) {
          if (entry.resetAt <= now) sessionCreationWindows.delete(key);
        }

        let window = sessionCreationWindows.get(clientId);
        if (!window || now >= window.resetAt) {
          window = { count: 0, resetAt: now + 60_000 };
          sessionCreationWindows.set(clientId, window);
        }

        if (window.count >= 10) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Session creation limit reached. Try again in a minute.",
          });
        }
        window.count += 1;

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Assessment database is unavailable.",
          });
        }

        const sessionId = randomUUID();
        const accessToken = randomBytes(32).toString("base64url");
        const accessTokenHash = createHash("sha256")
          .update(accessToken)
          .digest("hex");
        const createdAt = new Date();

        try {
          await db.insert(assessmentSessions).values({
            id: sessionId,
            assessmentSlug: input.assessmentSlug,
            assessmentVersion: input.assessmentVersion,
            status: "in_progress",
            accessTokenHash,
            createdAt,
          });
        } catch (error) {
          console.error("[Assessment] Session creation failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not create assessment session.",
          });
        }

        return {
          sessionId,
          accessToken,
          assessmentSlug: input.assessmentSlug,
          assessmentVersion: input.assessmentVersion,
          status: "in_progress" as const,
          createdAt: createdAt.toISOString(),
        };
      }),
    saveSubmission: publicProcedure
      .input(z.object({
        sessionId: z.string().uuid(),
        accessToken: z.string().min(32).max(128),
        sourceCode: z.string().min(1).max(20_000),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Assessment database is unavailable.",
          });
        }

        const suppliedHash = createHash("sha256")
          .update(input.accessToken)
          .digest("hex");

        const sourceCodeSha256 = createHash("sha256")
          .update(input.sourceCode, "utf8")
          .digest("hex");

        try {
          return await db.transaction(async (tx) => {
            // Serialize submission version allocation for this session.
            await tx.execute(sql`
              SELECT id
              FROM assessment_sessions
              WHERE id = ${input.sessionId}
              FOR UPDATE
            `);

            const sessions = await tx
              .select({
                id: assessmentSessions.id,
                accessTokenHash: assessmentSessions.accessTokenHash,
                status: assessmentSessions.status,
              })
              .from(assessmentSessions)
              .where(eq(assessmentSessions.id, input.sessionId))
              .limit(1);

            const session = sessions[0];
            if (
              !session ||
              !timingSafeEqual(
                Buffer.from(session.accessTokenHash, "hex"),
                Buffer.from(suppliedHash, "hex"),
              )
            ) {
              throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Assessment session or access token is invalid.",
              });
            }

            if (session.status !== "in_progress") {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This assessment session is no longer accepting submissions.",
              });
            }

            const latest = await tx
              .select({ version: codeSubmissions.submissionVersion })
              .from(codeSubmissions)
              .where(eq(codeSubmissions.sessionId, input.sessionId))
              .orderBy(desc(codeSubmissions.submissionVersion))
              .limit(1);

            const submissionVersion = (latest[0]?.version ?? 0) + 1;
            const submissionId = randomUUID();
            const createdAt = new Date();

            await tx.insert(codeSubmissions).values({
              id: submissionId,
              sessionId: input.sessionId,
              sourceCode: input.sourceCode,
              sourceCodeSha256,
              language: "typescript",
              submissionVersion,
              createdAt,
            });

            return {
              submissionId,
              sessionId: input.sessionId,
              submissionVersion,
              sourceCodeSha256,
              language: "typescript" as const,
              createdAt: createdAt.toISOString(),
            };
          });
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("[Assessment] Submission save failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not save the code submission.",
          });
        }
      }),
    runSavedSubmission: publicProcedure
      .input(z.object({
        sessionId: z.string().uuid(),
        submissionId: z.string().uuid(),
        accessToken: z.string().min(32).max(128),
      }))
      .mutation(async ({ ctx, input }) => {
        const now = Date.now();
        const clientId =
          ctx.req.ip || ctx.req.socket.remoteAddress || "unknown";

        // Share the existing execution rate limit and concurrency cap.
        let rateWindow = testRateWindows.get(clientId);
        if (!rateWindow || now >= rateWindow.resetAt) {
          rateWindow = { count: 0, resetAt: now + TEST_RATE_WINDOW_MS };
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

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Assessment database is unavailable.",
          });
        }

        const suppliedHash = createHash("sha256")
          .update(input.accessToken)
          .digest("hex");

        const sessions = await db
          .select({
            id: assessmentSessions.id,
            status: assessmentSessions.status,
            accessTokenHash: assessmentSessions.accessTokenHash,
          })
          .from(assessmentSessions)
          .where(eq(assessmentSessions.id, input.sessionId))
          .limit(1);

        const session = sessions[0];
        const storedHash = session
          ? Buffer.from(session.accessTokenHash, "utf8")
          : Buffer.alloc(0);
        const tokenHashBuffer = Buffer.from(suppliedHash, "utf8");

        if (
          !session ||
          storedHash.length !== tokenHashBuffer.length ||
          !timingSafeEqual(storedHash, tokenHashBuffer)
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Assessment session or access token is invalid.",
          });
        }

        if (session.status !== "in_progress") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This assessment session is no longer accepting executions.",
          });
        }

        const submissions = await db
          .select({
            id: codeSubmissions.id,
            sessionId: codeSubmissions.sessionId,
            sourceCode: codeSubmissions.sourceCode,
            sourceCodeSha256: codeSubmissions.sourceCodeSha256,
          })
          .from(codeSubmissions)
          .where(eq(codeSubmissions.id, input.submissionId))
          .limit(1);

        const submission = submissions[0];

        if (!submission || submission.sessionId !== session.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Submission was not found for this assessment session.",
          });
        }

        const actualSourceHash = createHash("sha256")
          .update(submission.sourceCode, "utf8")
          .digest("hex");

        if (actualSourceHash !== submission.sourceCodeSha256) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Stored submission integrity check failed.",
          });
        }

        activeTestRuns += 1;
        try {
          let result: Awaited<ReturnType<typeof runFormatDurationTests>>;

          try {
            // Execute the exact source snapshot retrieved from the database.
            result = await runFormatDurationTests(submission.sourceCode);
          } catch (error) {
            console.error("[Assessment] Sandbox execution failed:", error);
            result = {
              status: "error",
              passed: 0,
              total: 5,
              cases: [],
              durationMs: 0,
              message: "Sandbox execution failed unexpectedly.",
            };
          }

          const runId = randomUUID();
          const createdAt = new Date();

          // Store the run and all case results atomically.
          await db.transaction(async (tx) => {
            await tx.insert(executionRuns).values({
              id: runId,
              sessionId: session.id,
              submissionId: submission.id,
              status: result.status,
              passedCases: result.passed,
              totalCases: result.total,
              durationMs: result.durationMs,
              runnerVersion: "proofmode-ts-runner-v1",
              sandboxImage: "node:24-alpine",
              errorSummary: result.message ?? null,
              createdAt,
            });

            if (result.cases.length > 0) {
              await tx.insert(executionCaseResults).values(
                result.cases.map((item, index) => ({
                  id: randomUUID(),
                  executionRunId: runId,
                  caseIndex: index + 1,
                  inputValue: JSON.stringify(item.input),
                  expectedOutput: item.expected,
                  actualOutput: item.actual ?? null,
                  passed: item.passed,
                  errorDetails: item.error ?? null,
                })),
              );
            }
          });

          return {
            executionRunId: runId,
            sessionId: session.id,
            submissionId: submission.id,
            status: result.status,
            passed: result.passed,
            total: result.total,
            durationMs: result.durationMs,
            cases: result.cases,
            message: result.message,
            createdAt: createdAt.toISOString(),
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("[Assessment] Execution persistence failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not persist the execution results.",
          });
        } finally {
          activeTestRuns -= 1;
        }
      }),
    getSessionReport: publicProcedure
      .input(
        z.object({
          sessionId: z.string().uuid(),
          accessToken: z.string().min(32).max(128),
        }),
      )
      .query(async ({ input }) => {
        const db = await getDb();

        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection is unavailable.",
          });
        }

        const [session] = await db
          .select({
            id: assessmentSessions.id,
            assessmentSlug: assessmentSessions.assessmentSlug,
            assessmentVersion: assessmentSessions.assessmentVersion,
            status: assessmentSessions.status,
            accessTokenHash: assessmentSessions.accessTokenHash,
            createdAt: assessmentSessions.createdAt,
            submittedAt: assessmentSessions.submittedAt,
          })
          .from(assessmentSessions)
          .where(eq(assessmentSessions.id, input.sessionId))
          .limit(1);

        if (!session) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Assessment session was not found.",
          });
        }

        const providedHash = createHash("sha256")
          .update(input.accessToken)
          .digest();
        const storedHash = Buffer.from(session.accessTokenHash, "hex");

        if (
          providedHash.length !== storedHash.length ||
          !timingSafeEqual(providedHash, storedHash)
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid assessment access token.",
          });
        }

        const [submission] = await db
          .select({
            id: codeSubmissions.id,
            submissionVersion: codeSubmissions.submissionVersion,
            sourceCodeSha256: codeSubmissions.sourceCodeSha256,
            language: codeSubmissions.language,
            createdAt: codeSubmissions.createdAt,
          })
          .from(codeSubmissions)
          .where(eq(codeSubmissions.sessionId, session.id))
          .orderBy(desc(codeSubmissions.submissionVersion))
          .limit(1);

        let executionReport = null;

        if (submission) {
          const [run] = await db
            .select({
              id: executionRuns.id,
              submissionId: executionRuns.submissionId,
              status: executionRuns.status,
              passedCases: executionRuns.passedCases,
              totalCases: executionRuns.totalCases,
              durationMs: executionRuns.durationMs,
              errorSummary: executionRuns.errorSummary,
              runnerVersion: executionRuns.runnerVersion,
              sandboxImage: executionRuns.sandboxImage,
              createdAt: executionRuns.createdAt,
            })
            .from(executionRuns)
            .where(eq(executionRuns.submissionId, submission.id))
            .orderBy(desc(executionRuns.createdAt))
            .limit(1);

          if (run) {
            const caseRows = await db
              .select({
                caseIndex: executionCaseResults.caseIndex,
                inputValue: executionCaseResults.inputValue,
                expectedOutput: executionCaseResults.expectedOutput,
                actualOutput: executionCaseResults.actualOutput,
                passed: executionCaseResults.passed,
                errorDetails: executionCaseResults.errorDetails,
              })
              .from(executionCaseResults)
              .where(eq(executionCaseResults.executionRunId, run.id))
              .orderBy(executionCaseResults.caseIndex);

            executionReport = {
              executionRunId: run.id,
              submissionId: run.submissionId,
              status: run.status,
              passed: run.passedCases,
              total: run.totalCases,
              durationMs: run.durationMs,
              message: run.errorSummary ?? undefined,
              runnerVersion: run.runnerVersion,
              sandboxImage: run.sandboxImage,
              createdAt: run.createdAt.toISOString(),
              cases: caseRows.map((item) => ({
                caseIndex: item.caseIndex,
                input: Number(JSON.parse(item.inputValue)),
                expected: item.expectedOutput,
                actual: item.actualOutput ?? undefined,
                passed: item.passed,
                error: item.errorDetails ?? undefined,
              })),
            };
          }
        }

        return {
          session: {
            sessionId: session.id,
            assessmentSlug: session.assessmentSlug,
            assessmentVersion: session.assessmentVersion,
            status: session.status,
            createdAt: session.createdAt.toISOString(),
            submittedAt: session.submittedAt?.toISOString() ?? null,
          },
          submission: submission
            ? {
                submissionId: submission.id,
                submissionVersion: submission.submissionVersion,
                sourceCodeSha256: submission.sourceCodeSha256,
                language: submission.language,
                createdAt: submission.createdAt.toISOString(),
              }
            : null,
          execution: executionReport,
        };
      }),
    submitSession: publicProcedure
      .input(
        z.object({
          sessionId: z.string().uuid(),
          accessToken: z.string().min(32).max(128),
        }),
      )
      .mutation(async ({ input }) => {
        const db = await getDb();

        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection is unavailable.",
          });
        }

        return db.transaction(async (tx) => {
          const [session] = await tx
            .select({
              id: assessmentSessions.id,
              status: assessmentSessions.status,
              accessTokenHash: assessmentSessions.accessTokenHash,
              submittedAt: assessmentSessions.submittedAt,
            })
            .from(assessmentSessions)
            .where(eq(assessmentSessions.id, input.sessionId))
            .limit(1)
            .for("update");

          if (!session) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Assessment session was not found.",
            });
          }

          const providedHash = createHash("sha256")
            .update(input.accessToken)
            .digest();
          const storedHash = Buffer.from(session.accessTokenHash, "hex");

          if (
            providedHash.length !== storedHash.length ||
            !timingSafeEqual(providedHash, storedHash)
          ) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Invalid assessment access token.",
            });
          }

          if (session.status === "submitted") {
            return {
              sessionId: session.id,
              status: "submitted" as const,
              submittedAt: session.submittedAt?.toISOString() ?? null,
            };
          }

          if (session.status !== "in_progress") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "This assessment session can no longer be submitted.",
            });
          }

          const submittedAt = new Date();

          await tx
            .update(assessmentSessions)
            .set({
              status: "submitted",
              submittedAt,
              updatedAt: submittedAt,
            })
            .where(eq(assessmentSessions.id, session.id));

          return {
            sessionId: session.id,
            status: "submitted" as const,
            submittedAt: submittedAt.toISOString(),
          };
        });
      }),
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
