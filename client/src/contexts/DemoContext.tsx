import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type PatchState = "idle" | "pending" | "rejected" | "applied";
export type TestState = "not-run" | "passed" | "failed";
export type AssistantMode = "Explain" | "Plan" | "Suggest code" | "Explain a change" | "Suggest a test";

export const starterCode = `export function formatDuration(seconds: number): string {\n  // TODO: format a duration for the activity feed\n  return "";\n}`;
export const flawedPatch = `export function formatDuration(seconds: number): string {\n  if (seconds < 60) return \`${"${Math.round(seconds / 60)}"} min\`;\n  const minutes = Math.floor(seconds / 60);\n  return \`${"${minutes}"} min\`;\n}`;
export const correctedCode = `export function formatDuration(seconds: number): string {\n  const safeSeconds = Math.max(0, Math.floor(seconds));\n  if (safeSeconds < 60) return \`${"${safeSeconds}"} sec\`;\n  const minutes = Math.floor(safeSeconds / 60);\n  const remainder = safeSeconds % 60;\n  return remainder === 0 ? \`${"${minutes}"} min\` : \`${"${minutes}"} min ${"${remainder}"} sec\`;\n}`;

export interface EvidenceItem { id: string; title: string; kind: "prompt" | "diff" | "test" | "explanation"; detail: string }
interface Message { role: "candidate" | "assistant"; text: string }
interface DemoState {
  code: string;
  patch: PatchState;
  tests: TestState;
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
  runTests: () => void;
  submit: () => void;
  reset: () => void;
}

const baseEvidence: EvidenceItem[] = [
  { id: "EV-01", title: "Candidate prompt", kind: "prompt", detail: "“Can you suggest a duration formatter? I’ll check the minute boundary before applying it.”" },
  { id: "EV-02", title: "AI patch review", kind: "diff", detail: "The first suggestion rounded the duration into minutes, which would label 59 seconds as 1 minute. The candidate rejected that patch and wrote a floor-based implementation." },
  { id: "EV-03", title: "Boundary test run", kind: "test", detail: "4 / 4 checks passed: 0 sec, 59 sec, 60 sec, and 125 sec. The 59-second boundary stays below one minute." },
  { id: "EV-04", title: "Candidate explanation", kind: "explanation", detail: "“Rounding crosses the minute boundary too early. I used floor for whole minutes and kept the remainder for the seconds.”" },
];
const freshState = (): DemoState => ({ code: starterCode, patch: "idle", tests: "not-run", submitted: false, note: "", messages: [], evidence: baseEvidence });
const storageKey = "proofmode-demo-v1";
function loadState(): DemoState {
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (stored) return { ...freshState(), ...JSON.parse(stored) } as DemoState;
  } catch { /* Storage may be unavailable; the seeded demo still works. */ }
  return freshState();
}

const DemoContext = createContext<DemoContextValue | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(loadState);
  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* non-persistent fallback */ }
  }, [state]);
  const actions = useMemo<DemoContextValue>(() => ({
    ...state,
    setCode: (code) => setState((s) => ({ ...s, code, tests: "not-run" })),
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
    rejectPatch: () => setState((s) => ({ ...s, patch: "rejected", tests: "not-run" })),
    applyPatch: () => setState((s) => ({ ...s, code: flawedPatch, patch: "applied", tests: "not-run" })),
    runTests: () => {
      const correct = state.code.includes("Math.floor(seconds)") || state.code.includes("Math.floor(seconds))") || state.code.includes("Math.floor(safeSeconds)");
      const hasRemainder = state.code.includes("% 60");
      setState((s) => ({ ...s, tests: correct && hasRemainder ? "passed" : "failed" }));
    },
    submit: () => setState((s) => ({ ...s, submitted: true })),
    reset: () => setState(freshState()),
  }), [state]);
  return <DemoContext.Provider value={actions}>{children}</DemoContext.Provider>;
}
export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used inside DemoProvider");
  return value;
}
