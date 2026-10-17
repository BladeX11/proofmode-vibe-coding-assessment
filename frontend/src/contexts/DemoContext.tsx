import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";

export type PatchState = "idle" | "pending" | "rejected" | "applied";
export type TestState = "not-run" | "passed" | "failed";

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
interface AssessmentSessionCredentials {
  sessionId: string;
  accessToken: string;
}

export type AssistantMode = "Explain" | "Plan" | "Suggest code" | "Explain a change" | "Suggest a test";

export const starterCode = `export function formatDuration(seconds: number): string {\n  // TODO: format a duration for the activity feed\n  return "";\n}`;
export const flawedPatch = `export function formatDuration(seconds: number): string {\n  if (seconds < 60) return \`${"${Math.round(seconds / 60)}"} min\`;\n  const minutes = Math.floor(seconds / 60);\n  return \`${"${minutes}"} min\`;\n}`;
export const correctedCode = `export function formatDuration(seconds: number): string {\n  const safeSeconds = Math.max(0, Math.floor(seconds));\n  if (safeSeconds < 60) return \`${"${safeSeconds}"} sec\`;\n  const minutes = Math.floor(safeSeconds / 60);\n  const remainder = safeSeconds % 60;\n  return remainder === 0 ? \`${"${minutes}"} min\` : \`${"${minutes}"} min ${"${remainder}"} sec\`;\n}`;

export interface EvidenceItem { id: string; title: string; kind: "prompt" | "diff" | "test" | "explanation"; detail: string }
interface Message { role: "candidate" | "assistant"; text: string }
interface DemoState {
  code: string;
  assessmentSession: AssessmentSessionCredentials | null;
  patch: PatchState;
  tests: TestState;
  executionResult: ExecutionResult | null;
  runningTests: boolean;
  submitted: boolean;
  note: string;
  messages: Message[];
  evidence: EvidenceItem[];
}
interface DemoContextValue extends DemoState {
  setCode: (value: string) => void;
  setNote: (value: string) => void;
  ask: (mode: AssistantMode, prompt?: string) => void;
  rejectPatch: () => void;
  applyPatch: () => void;
  runTests: () => Promise<void>;
  submit: () => Promise<void>;
  reset: () => void;
}

const baseEvidence: EvidenceItem[] = [
  { id: "EV-01", title: "Candidate prompt", kind: "prompt", detail: "“Can you suggest a duration formatter? I’ll check the minute boundary before applying it.”" },
  { id: "EV-02", title: "AI patch review", kind: "diff", detail: "The first suggestion rounded the duration into minutes, which would label 59 seconds as 1 minute. The candidate rejected that patch and wrote a floor-based implementation." },
  { id: "EV-03", title: "Boundary test run", kind: "test", detail: "No test execution recorded yet. Results will appear here after the candidate runs the sandbox tests." },
  { id: "EV-04", title: "Candidate explanation", kind: "explanation", detail: "“Rounding crosses the minute boundary too early. I used floor for whole minutes and kept the remainder for the seconds.”" },
];
const freshState = (): DemoState => ({ code: starterCode, assessmentSession: null, patch: "idle", tests: "not-run", executionResult: null, runningTests: false, submitted: false, note: "", messages: [], evidence: baseEvidence });
const storageKey = "proofmode-demo-v2";
function loadState(): DemoState {
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (stored) return { ...freshState(), ...JSON.parse(stored) } as DemoState;
  } catch { /* Storage may be unavailable; the seeded demo still works. */ }
  return freshState();
}

const DemoContext = createContext<DemoContextValue | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const { mutateAsync: startAssessmentSession } = trpc.assessment.startSession.useMutation();
  const { mutateAsync: saveAssessmentSubmission } = trpc.assessment.saveSubmission.useMutation();
  const { mutateAsync: executeSavedTests } = trpc.assessment.runSavedSubmission.useMutation();
  const { mutateAsync: finishAssessmentSession } = trpc.assessment.submitSession.useMutation();
  const runGeneration = useRef(0);
  const [state, setState] = useState<DemoState>(loadState);
  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* non-persistent fallback */ }
  }, [state]);
  const actions = useMemo<DemoContextValue>(() => ({
    ...state,
    setCode: (code) => {
      runGeneration.current += 1;
      setState((s) => ({
        ...s,
        code,
        tests: "not-run",
        executionResult: null,
        runningTests: false,
      }));
    },
    setNote: (note) => setState((s) => ({ ...s, note })),
    ask: (mode, prompt) => {
      const text = prompt?.trim() || `${mode}: help me check the minute boundary in formatDuration.`;
      const reply = mode === "Suggest code"
        ? "I drafted a formatter. Review the visible diff before deciding whether to use it—the rounding at 59 seconds deserves a closer look."
        : mode === "Suggest a test"
          ? "Try 0, 59, 60, and 125 seconds. The 59 → 60 boundary is the most useful edge case here."
          : mode === "Plan"
            ? "Plan: normalize negative values, separate whole minutes from the remainder, then verify values on both sides of 60."
            : mode === "Explain a change"
              ? "The suggested version rounds up to a minute. That can turn 59 seconds into ‘1 min’ before a full minute has elapsed."
              : "The task asks for whole-second durations. Keep the boundary behavior explicit, especially just below 60 seconds.";
      setState((s) => ({ ...s, patch: mode === "Suggest code" ? "pending" : s.patch, messages: [...s.messages, { role: "candidate", text }, { role: "assistant", text: reply }] }));
    },
    rejectPatch: () => setState((s) => ({
      ...s,
      patch: "rejected",
      tests: "not-run",
      executionResult: null,
    })),
    applyPatch: () => {
      runGeneration.current += 1;
      setState((s) => ({
        ...s,
        code: flawedPatch,
        patch: "applied",
        tests: "not-run",
        executionResult: null,
        runningTests: false,
      }));
    },
    runTests: async () => {
      const runId = ++runGeneration.current;
      const submittedCode = state.code;

      setState((s) => ({
        ...s,
        tests: "not-run",
        executionResult: null,
        runningTests: true,
      }));

      try {
        let session = state.assessmentSession;

        if (!session) {
          const created = await startAssessmentSession({
            assessmentSlug: "format-duration",
            assessmentVersion: 1,
          });

          session = {
            sessionId: created.sessionId,
            accessToken: created.accessToken,
          };

          if (runGeneration.current !== runId) return;
          setState((s) => ({ ...s, assessmentSession: session }));
        }

        const submission = await saveAssessmentSubmission({
          sessionId: session.sessionId,
          accessToken: session.accessToken,
          sourceCode: submittedCode,
        });

        if (runGeneration.current !== runId) return;

        const result = await executeSavedTests({
          sessionId: session.sessionId,
          submissionId: submission.submissionId,
          accessToken: session.accessToken,
        });

        // Ignore stale responses if the candidate edited or reset the task.
        if (runGeneration.current !== runId) return;

        const caseDetails = result.cases.map((item) => {
          const actual = item.actual === undefined
            ? "no output"
            : JSON.stringify(item.actual);
          const error = item.error ? ` (${item.error})` : "";

          return `${item.input}s: expected ${JSON.stringify(item.expected)}, actual ${actual} — ${item.passed ? "PASS" : "FAIL"}${error}`;
        }).join("; ");

        const testEvidence: EvidenceItem = {
          id: "EV-03",
          title: result.status === "error" ? "Sandbox execution error" : "Actual sandbox test run",
          kind: "test",
          detail: `${result.passed}/${result.total} tests passed in ${result.durationMs} ms. ${caseDetails || "No per-case results returned."}${result.message ? ` Message: ${result.message}` : ""}`,
        };

        setState((s) => ({
          ...s,
          tests: result.status === "passed" ? "passed" : "failed",
          executionResult: result,
          runningTests: false,
          evidence: s.evidence.map((item) =>
            item.id === "EV-03" ? testEvidence : item
          ),
        }));
      } catch (error) {
        if (runGeneration.current !== runId) return;

        const message = error instanceof Error ? error.message : String(error);
        const result: ExecutionResult = {
          status: "error",
          passed: 0,
          total: 5,
          cases: [],
          durationMs: 0,
          message,
        };

        const testEvidence: EvidenceItem = {
          id: "EV-03",
          title: "Sandbox execution error",
          kind: "test",
          detail: `The test request failed. No test results were verified. ${message}`,
        };

        setState((s) => ({
          ...s,
          tests: "failed",
          executionResult: result,
          runningTests: false,
          evidence: s.evidence.map((item) =>
            item.id === "EV-03" ? testEvidence : item
          ),
        }));
      }
    },
    submit: async () => {
      if (state.submitted) return;

      let session = state.assessmentSession;
      const submittedCode = state.code;

      setState((s) => ({
        ...s,
        runningTests: true,
        executionResult: null,
        tests: "not-run",
      }));

      try {
        if (!session) {
          const created = await startAssessmentSession({
            assessmentSlug: "format-duration",
            assessmentVersion: 1,
          });

          session = {
            sessionId: created.sessionId,
            accessToken: created.accessToken,
          };

          setState((s) => ({ ...s, assessmentSession: session }));
        }

        // Persist the exact code snapshot that is being submitted.
        const submission = await saveAssessmentSubmission({
          sessionId: session.sessionId,
          accessToken: session.accessToken,
          sourceCode: submittedCode,
        });

        // Execute that saved snapshot, not unsaved browser editor contents.
        const result = await executeSavedTests({
          sessionId: session.sessionId,
          submissionId: submission.submissionId,
          accessToken: session.accessToken,
        });

        const caseDetails = result.cases.map((item) => {
          const actual = item.actual === undefined
            ? "no output"
            : JSON.stringify(item.actual);
          const error = item.error ? ` (${item.error})` : "";

          return `${item.input}s: expected ${JSON.stringify(item.expected)}, actual ${actual} — ${item.passed ? "PASS" : "FAIL"}${error}`;
        }).join("; ");

        const testEvidence: EvidenceItem = {
          id: "EV-03",
          title: result.status === "error"
            ? "Sandbox execution error"
            : "Final submission test run",
          kind: "test",
          detail: `${result.passed}/${result.total} tests passed in ${result.durationMs} ms. ${caseDetails || "No per-case results returned."}${result.message ? ` Message: ${result.message}` : ""}`,
        };

        setState((s) => ({
          ...s,
          assessmentSession: session,
          tests: result.status === "passed" ? "passed" : "failed",
          executionResult: result,
          runningTests: false,
          evidence: s.evidence.map((item) =>
            item.id === "EV-03" ? testEvidence : item
          ),
        }));

        // Finalize only after the final submission's execution is persisted.
        await finishAssessmentSession({
          sessionId: session.sessionId,
          accessToken: session.accessToken,
        });

        setState((s) => ({
          ...s,
          assessmentSession: session,
          submitted: true,
          runningTests: false,
        }));
      } catch (error) {
        setState((s) => ({ ...s, runningTests: false }));
        throw error;
      }
    },
    reset: () => {
      runGeneration.current += 1;
      setState(freshState());
    },
  }), [state, startAssessmentSession, saveAssessmentSubmission, executeSavedTests, finishAssessmentSession]);
  return <DemoContext.Provider value={actions}>{children}</DemoContext.Provider>;
}
export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used inside DemoProvider");
  return value;
}
