import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, CircleHelp, X } from "lucide-react";
import { ActionButton, EvidenceDialog, EvidenceLink, Panel } from "@/components/proofmode/ui";
import { trpc } from "@/lib/trpc";
import { useDemo, type EvidenceItem, type ExecutionResult } from "@/contexts/DemoContext";

const STATUS_WORD = { passed: "Passed", failed: "Failed", timeout: "Timed out", error: "Execution error" } as const;

export default function Results() {
  const {
    note,
    setNote,
    evidence,
    executionResult: localExecutionResult,
    patch,
    submitted,
    assessmentSession,
  } = useDemo();

  const [activeEvidence, setActiveEvidence] = useState<EvidenceItem | null>(null);
  const [saved, setSaved] = useState(false);

  const reportQuery = trpc.assessment.getSessionReport.useQuery(
    assessmentSession ?? { sessionId: "", accessToken: "" },
    { enabled: Boolean(assessmentSession), retry: false },
  );

  const persistedExecution = reportQuery.data?.execution;

  const persistedExecutionResult: ExecutionResult | null = persistedExecution
    ? {
        status: persistedExecution.status,
        passed: persistedExecution.passed,
        total: persistedExecution.total,
        durationMs: persistedExecution.durationMs,
        message: persistedExecution.message,
        cases: persistedExecution.cases.map((item) => ({
          input: item.input,
          expected: item.expected,
          actual: item.actual,
          passed: item.passed,
          error: item.error,
        })),
      }
    : null;

  // Prefer persisted server data once it has loaded.
  const executionResult = reportQuery.data
    ? persistedExecutionResult
    : localExecutionResult;

  const persistedEvidence: EvidenceItem | null = persistedExecution
    ? {
        id: "EV-03",
        title: persistedExecution.status === "error"
          ? "Sandbox execution error"
          : "Persisted sandbox test run",
        kind: "test",
        detail: `${persistedExecution.passed}/${persistedExecution.total} tests passed in ${persistedExecution.durationMs} ms. ${persistedExecution.cases.map((item) => `${item.input}s: expected ${JSON.stringify(item.expected)}, actual ${item.actual === undefined ? "no output" : JSON.stringify(item.actual)} — ${item.passed ? "PASS" : "FAIL"}${item.error ? ` (${item.error})` : ""}`).join("; ") || "No per-case results returned."}${persistedExecution.message ? ` Message: ${persistedExecution.message}` : ""}`,
      }
    : null;

  const verifiedEvidence = reportQuery.data
    ? persistedEvidence ? [persistedEvidence] : []
    : localExecutionResult
      ? evidence.filter((item) => item.id === "EV-03")
      : [];

  const didNotFinish = executionResult?.status === "error" || executionResult?.status === "timeout";
  const headline = !executionResult
    ? "No test run yet"
    : didNotFinish
      ? "The test run did not finish"
      : executionResult.status === "passed"
        ? `All ${executionResult.total} checks passed`
        : `${executionResult.passed} of ${executionResult.total} checks passed`;
  const patchWord = patch === "rejected" ? "Rejected" : patch === "applied" ? "Applied" : patch === "pending" ? "Awaiting your decision" : null;

  return <main className="pm-page">
    <div className="pm-topline pm-no-print"><Link href="/assessment" className="pm-back"><ArrowLeft size={15} aria-hidden="true" /> Back to the task</Link><span className="pm-micro">Candidate view</span></div>
    {reportQuery.data && <p className="pm-micro" role="status">Loaded from your saved session ({reportQuery.data.session.status}).</p>}
    {assessmentSession && reportQuery.isError && <p className="pm-ws-error" role="alert">The saved report could not be loaded from the server. Showing this browser session instead.</p>}
    <header className="pm-pagehead">
      <span className="pm-label">Task TS-014 · formatDuration</span>
      <h1 className="pm-h1">{submitted ? "Here’s what your session shows" : "A preview of your feedback"}</h1>
      <p className="pm-prose pm-muted">{submitted ? "You finished the task. These are the signals your work made visible." : "This is the feedback the task can produce once you submit."} One task is a starting point, not a verdict.</p>
    </header>

    <div className="pm-results">
      <div className="pm-results-main">
        <Panel>
          <span className="pm-label">1 · Your test run</span>
          <h2 className="pm-h2" style={{ margin: "var(--pm-s1) 0 var(--pm-s3)", color: executionResult?.status === "passed" ? "var(--pm-pass)" : undefined }}>{headline}</h2>
          {!executionResult && <p className="pm-prose pm-muted" style={{ margin: 0 }}>Nothing counts as passed until the isolated test runner has run your current code.</p>}
          {didNotFinish && <p className="pm-prose pm-muted" style={{ margin: 0 }}>The sandbox could not complete the run, so no checks were verified. This says nothing about your code. Run the tests again from the workspace.</p>}
          {executionResult && !didNotFinish && <>
            <div className="pm-scroll-x"><table className="pm-table">
              <thead><tr><th scope="col">Input</th><th scope="col">Expected</th><th scope="col">Actual</th><th scope="col">Result</th></tr></thead>
              <tbody>{executionResult.cases.map((item) => <tr key={`${item.input}-${item.expected}`}>
                <td className="pm-num"><code>{item.input}s</code></td>
                <td><code>{JSON.stringify(item.expected)}</code></td>
                <td><code>{item.actual === undefined ? "no output" : JSON.stringify(item.actual)}</code>{item.error && <div className="pm-micro">{item.error}</div>}</td>
                <td>{item.passed ? <span className="pm-badge pm-badge-pass"><Check size={13} aria-hidden="true" />Pass</span> : <span className="pm-badge pm-badge-fail"><X size={13} aria-hidden="true" />Fail</span>}</td>
              </tr>)}</tbody>
            </table></div>
            <p className="pm-micro" style={{ margin: "var(--pm-s3) 0 0" }}>These are fixed checks supplied by the system. They don’t show that you wrote the tests. Run time {executionResult.durationMs} ms.</p>
          </>}
          {verifiedEvidence[0] && <div style={{ marginTop: "var(--pm-s3)" }}><EvidenceLink item={verifiedEvidence[0]} onOpen={setActiveEvidence} compact /></div>}
        </Panel>

        <Panel>
          <span className="pm-label">2 · One thing to practise</span>
          <h2 className="pm-h2" style={{ margin: "var(--pm-s1) 0 var(--pm-s3)" }}>Make the boundary table-driven</h2>
          <div className="pm-practice">
            <p className="pm-micro">Optional · about 8 minutes · the same suggestion for everyone in this demo</p>
            <p className="pm-prose">Try a few inputs around 60 seconds, including negative and non-integer values. Write down the output you expect before you run each test.</p>
            <ActionButton variant="secondary" onClick={() => setSaved(!saved)}>{saved ? <><Check size={16} aria-hidden="true" /> Saved to your practice list</> : "Save for later"}</ActionButton>
          </div>
        </Panel>

        <Panel>
          <span className="pm-label">3 · What we couldn’t observe</span>
          <h2 className="pm-h2" style={{ margin: "var(--pm-s1) 0 var(--pm-s3)" }}>Not observed is not zero</h2>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--pm-s3)" }}>
            <p className="pm-prose" style={{ margin: 0 }}><strong>Working with a team.</strong> This was a solo task, so it gave no fair chance to show it.</p>
            <span className="pm-na"><CircleHelp size={13} aria-hidden="true" /> Not observed</span>
          </div>
        </Panel>

        <Panel>
          <h2 className="pm-h3">Your note for the reviewer</h2>
          <p className="pm-micro" style={{ margin: "var(--pm-s1) 0 var(--pm-s3)" }}>Optional. It’s shown separately from the findings and kept in this browser tab.</p>
          <label className="sr-only" htmlFor="context-note">Add context for the reviewer</label>
          <textarea id="context-note" className="pm-field" rows={4} placeholder="Anything you’d like a person reviewing this to know about your approach?" value={note} onChange={(e) => setNote(e.target.value)} />
        </Panel>
      </div>

      <aside className="pm-results-aside" aria-label="Summary">
        <Panel>
          <h2 className="pm-h3">Summary</h2>
          <p className="pm-micro" style={{ margin: "var(--pm-s1) 0 var(--pm-s2)" }}>Signals from one task. Not a hiring score.</p>
          <div className="pm-snap"><span className="pm-label">Code correctness</span><p><strong>{executionResult ? (didNotFinish ? "Not verified" : STATUS_WORD[executionResult.status]) : "Not run"}</strong></p>{executionResult && !didNotFinish && <p className="pm-micro">{executionResult.passed} of {executionResult.total} checks</p>}</div>
          <div className="pm-snap"><span className="pm-label">Patch review</span>{patchWord ? <p><strong>{patchWord}</strong></p> : <span className="pm-na"><CircleHelp size={13} aria-hidden="true" /> Not observed</span>}{patchWord && <p className="pm-micro">The action is recorded. How well you judged it is not scored.</p>}</div>
          <div className="pm-snap"><span className="pm-label">Team collaboration</span><span className="pm-na"><CircleHelp size={13} aria-hidden="true" /> Not observed</span></div>
          <div className="pm-snap"><span className="pm-label">Evidence records</span><p><strong>{verifiedEvidence.length} linked</strong></p>{verifiedEvidence.map((item) => <EvidenceLink key={item.id} item={item} onOpen={setActiveEvidence} />)}</div>
        </Panel>
        <p className="pm-micro" style={{ margin: 0 }}>This report reflects one task and doesn’t decide a hiring outcome.</p>
        <Link href="/reviewer" className="pm-btn pm-btn-secondary pm-no-print">See the reviewer’s view <ArrowRight size={16} aria-hidden="true" /></Link>
      </aside>
    </div>
    <EvidenceDialog item={activeEvidence} onClose={() => setActiveEvidence(null)} />
  </main>;
}
