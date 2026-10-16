import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { transform } from "esbuild";

export interface ExecutionCase {
  input: number;
  expected: string;
  actual?: string;
  passed: boolean;
  error?: string;
}

export interface ExecutionResult {
  status: "passed" | "failed" | "error" | "timeout";
  passed: number;
  total: number;
  cases: ExecutionCase[];
  durationMs: number;
  message?: string;
}

const TEST_CASES = [
  { input: 0, expected: "0 sec" },
  { input: 59, expected: "59 sec" },
  { input: 60, expected: "1 min" },
  { input: 125, expected: "2 min 5 sec" },
  { input: -5, expected: "0 sec" },
] as const;

const DOCKER_BIN = process.env.PROOFMODE_DOCKER_BIN || "/usr/bin/docker";
const IMAGE = "node:24-alpine";
const TIMEOUT_MS = 8_000;
const MAX_OUTPUT_BYTES = 64 * 1024;
const RESULT_MARKER = "__PROOFMODE_RESULT__";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function failure(
  status: ExecutionResult["status"],
  message: string,
  durationMs = 0,
): ExecutionResult {
  return {
    status,
    passed: 0,
    total: TEST_CASES.length,
    cases: [],
    durationMs,
    message,
  };
}

export async function runFormatDurationTests(
  source: string,
): Promise<ExecutionResult> {
  const startedAt = Date.now();

  if (typeof source !== "string" || source.trim().length === 0) {
    return failure("error", "Submit a TypeScript implementation.");
  }

  if (source.length > 20_000) {
    return failure("error", "Source exceeds the 20,000-character limit.");
  }

  let compiledSource: string;

  try {
    const compiled = await transform(source, {
      loader: "ts",
      format: "cjs",
      target: "node20",
    });
    compiledSource = compiled.code;
  } catch (error) {
    return failure(
      "error",
      `TypeScript compilation failed: ${errorMessage(error)}`,
      Date.now() - startedAt,
    );
  }

  // The candidate runs in a separate Node process inside the container.
  // The trusted driver collects and checks the candidate's actual outputs.
  const candidateBootstrap = String.raw`
const safeWrite = require("node:fs").writeSync;
const safeStringify = JSON.stringify.bind(JSON);
const source = Buffer.from(process.argv[1], "base64").toString("utf8");
const input = Number(process.argv[2]);

try {
  const candidateModule = { exports: {} };

  new Function(
    "exports", "module", "require", "__filename", "__dirname", source
  )(
    candidateModule.exports,
    candidateModule,
    require,
    "/tmp/submission.cjs",
    "/tmp"
  );

  const fn = candidateModule.exports.formatDuration;

  if (typeof fn !== "function") {
    throw new Error("Expected a named export: formatDuration(seconds).");
  }

  const value = fn(input);
  const printable =
    typeof value === "string"
      ? value
      : value === undefined
        ? "undefined"
        : String(value);

  safeWrite(
    1,
    "__PROOFMODE_VALUE__" +
      safeStringify({ value: printable, type: typeof value }) +
      "\n"
  );
  process.exit(0);
} catch (error) {
  safeWrite(
    1,
    "__PROOFMODE_ERROR__" +
      safeStringify({
        error: String(error && error.message ? error.message : error)
      }) +
      "\n"
  );
  process.exit(1);
}
`;

  const driverScript = String.raw`
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");

const safeStringify = JSON.stringify.bind(JSON);
const safeWrite = fs.writeSync.bind(fs);
const source = ${JSON.stringify(compiledSource)};
const sourceBase64 = Buffer.from(source, "utf8").toString("base64");
const bootstrap = ${JSON.stringify(candidateBootstrap)};
const testCases = ${JSON.stringify(TEST_CASES)};
const results = [];
let timedOut = false;

for (const testCase of testCases) {
  const child = spawnSync(
    process.execPath,
    ["-e", bootstrap, sourceBase64, String(testCase.input)],
    {
      cwd: "/tmp",
      encoding: "utf8",
      timeout: 1200,
      maxBuffer: 8192,
      env: {
        PATH: "/usr/local/bin:/usr/bin:/bin",
        NODE_ENV: "production"
      }
    }
  );

  const output = child.stdout || "";
  const valueIndex = output.lastIndexOf("__PROOFMODE_VALUE__");
  const errorIndex = output.lastIndexOf("__PROOFMODE_ERROR__");

  if (child.error && child.error.code === "ETIMEDOUT") {
    timedOut = true;
    results.push({
      input: testCase.input,
      expected: testCase.expected,
      passed: false,
      error: "Test execution timed out."
    });
    continue;
  }

  if (errorIndex > valueIndex) {
    const line = output.slice(errorIndex + "__PROOFMODE_ERROR__".length)
      .split(/\r?\n/, 1)[0];

    try {
      results.push({
        input: testCase.input,
        expected: testCase.expected,
        passed: false,
        error: JSON.parse(line).error
      });
    } catch {
      results.push({
        input: testCase.input,
        expected: testCase.expected,
        passed: false,
        error: "Candidate execution failed."
      });
    }
    continue;
  }

  if (valueIndex < 0) {
    results.push({
      input: testCase.input,
      expected: testCase.expected,
      passed: false,
      error: child.error
        ? String(child.error.message)
        : "No valid result returned by candidate."
    });
    continue;
  }

  try {
    const line = output.slice(valueIndex + "__PROOFMODE_VALUE__".length)
      .split(/\r?\n/, 1)[0];
    const result = JSON.parse(line);
    const passed =
      child.status === 0 &&
      result.type === "string" &&
      result.value === testCase.expected;

    results.push({
      input: testCase.input,
      expected: testCase.expected,
      actual: String(result.value),
      passed
    });
  } catch {
    results.push({
      input: testCase.input,
      expected: testCase.expected,
      passed: false,
      error: "Could not parse candidate result."
    });
  }
}

safeWrite(
  1,
  "${RESULT_MARKER}" +
    safeStringify({ cases: results, timedOut }) +
    "\n"
);
`;

  const containerName = `proofmode-run-${randomUUID()}`;
  const dockerArgs = [
    "run",
    "--rm",
    "--pull=never",
    "--name",
    containerName,
    "-i",
    "--network",
    "none",
    "--read-only",
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,nodev,size=16m",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--memory=128m",
    "--cpus=0.5",
    "--pids-limit=64",
    "--user=1000:1000",
    IMAGE,
    "node",
    "-",
  ];

  return new Promise<ExecutionResult>((resolve) => {
    const child = spawn(DOCKER_BIN, dockerArgs, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let outputBytes = 0;
    let timedOut = false;
    let outputExceeded = false;
    let settled = false;
    let graceTimer: NodeJS.Timeout | undefined;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      stopContainer();
      graceTimer = setTimeout(() => child.kill("SIGKILL"), 500);
      graceTimer.unref();
    }, TIMEOUT_MS);

    const finish = (result: ExecutionResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (graceTimer) clearTimeout(graceTimer);
      resolve({
        ...result,
        durationMs: Date.now() - startedAt,
      });
    };

    const stopContainer = () => {
      const cleanup = spawn(DOCKER_BIN, ["rm", "--force", containerName], {
        stdio: "ignore",
      });
      cleanup.on("error", () => {});
      cleanup.unref();
    };

    child.stdout.on("data", (chunk: Buffer) => {
      outputBytes += chunk.length;
      if (outputBytes > MAX_OUTPUT_BYTES) {
        outputExceeded = true;
        child.kill("SIGTERM");
        stopContainer();
        return;
      }
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      outputBytes += chunk.length;
      if (outputBytes > MAX_OUTPUT_BYTES) {
        outputExceeded = true;
        child.kill("SIGTERM");
        stopContainer();
        return;
      }
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      finish(failure("error", `Could not launch Docker: ${error.message}`));
    });

    child.on("close", (exitCode) => {
      if (timedOut) {
        finish(failure("timeout", "Execution exceeded the time limit."));
        return;
      }

      if (outputExceeded) {
        finish(failure("error", "Execution output exceeded 64 KB."));
        return;
      }

      if (exitCode !== 0) {
        finish(
          failure(
            "error",
            `Sandbox exited with code ${exitCode}. ${stderr.slice(-3000)}`,
          ),
        );
        return;
      }

      const markerIndex = stdout.lastIndexOf(RESULT_MARKER);
      if (markerIndex < 0) {
        finish(
          failure(
            "error",
            `Sandbox returned no test results. ${stderr.slice(-1000)}`,
          ),
        );
        return;
      }

      try {
        const jsonLine = stdout
          .slice(markerIndex + RESULT_MARKER.length)
          .split(/\r?\n/, 1)[0];
        const payload = JSON.parse(jsonLine) as {
          cases: ExecutionCase[];
          timedOut: boolean;
        };

        if (
          !Array.isArray(payload.cases) ||
          payload.cases.length !== TEST_CASES.length
        ) {
          finish(failure("error", "Sandbox returned an invalid result set."));
          return;
        }

        const passed = payload.cases.filter((item) => item.passed).length;
        const status = payload.timedOut
          ? "timeout"
          : passed === TEST_CASES.length
            ? "passed"
            : "failed";

        finish({
          status,
          passed,
          total: TEST_CASES.length,
          cases: payload.cases,
          durationMs: Date.now() - startedAt,
          ...(payload.timedOut ? { message: "A test exceeded its time limit." } : {}),
        });
      } catch (error) {
        finish(
          failure("error", `Invalid sandbox response: ${errorMessage(error)}`),
        );
      }
    });

    child.stdin.on("error", () => {});
    child.stdin.end(driverScript);
  });
}
