import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ArrowUpRight, Check, CircleHelp, FileText, Sparkles, Target, Trophy } from "lucide-react";
import { ActionButton, Eyebrow, EvidenceDialog, EvidenceLink, Panel, StatusBadge } from "@/components/proofmode/ui";
import { trpc } from "@/lib/trpc";
import { useDemo, type EvidenceItem, type ExecutionResult } from "@/contexts/DemoContext";

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
  return <main className="app-page page-shell results-page">
    <div className="results-top"><Link href="/assessment" className="back-link">← Back to task</Link><StatusBadge tone="cyan">CANDIDATE VIEW</StatusBadge></div>
    {reportQuery.data && <p className="report-source" role="status">Report loaded from saved session · {reportQuery.data.session.status}</p>}
    {assessmentSession && reportQuery.isError && <p className="report-load-error" role="alert">The saved report could not be loaded from the server. Showing the current browser session data instead.</p>}
    <header className="results-hero"><div className="results-icon"><Trophy size={21} /></div><div><Eyebrow>ASSESSMENT COMPLETE / TS-014</Eyebrow><h1>Your process showed.</h1><p>{submitted ? "You finished this task and can review the signals you made visible." : "Here’s a seeded preview of the feedback this task can produce."} One task is a starting point—not a verdict.</p></div><div className="result-outcome">
        <span>EXECUTION OUTCOME</span>
        <strong className={executionResult?.status === "passed" ? "outcome-pass" : "outcome-seeded"}>
          {!executionResult ? "Not run" :
            executionResult.status === "passed" ? "Checks passed" :
            executionResult.status === "failed" ? "Checks failed" :
            executionResult.status === "timeout" ? "Timed out" : "Execution error"}
        </strong>
        <small>{executionResult
          ? `${executionResult.passed} / ${executionResult.total} cases · ${executionResult.durationMs} ms`
          : "No verified test results yet"}</small>
      </div></header>
    <div className="results-layout"><div className="results-main">
      <Panel className="result-section">
        <div className="result-section-head">
          <div>
            <Eyebrow color={executionResult?.status === "passed" ? "green" : "cyan"}>
              {executionResult ? "01 / VERIFIED EXECUTION" : "01 / EXECUTION EVIDENCE"}
            </Eyebrow>
            <h2>{!executionResult
              ? "No execution evidence yet."
              : executionResult.status === "passed"
                ? "All defined cases passed."
                : "Execution needs review."}</h2>
          </div>
          <span className={`section-mark ${executionResult?.status === "passed" ? "green-mark" : "cyan-mark"}`}>
            {executionResult?.status === "passed" ? <Check size={16} /> : <Target size={16} />}
          </span>
        </div>
        {!executionResult ? (
          <div className="finding-row">
            <div className="finding-copy">
              <h3>Awaiting the first run</h3>
              <p>Nothing is marked as passed until the isolated test runner executes the current source.</p>
            </div>
            <div className="skill-chip">NOT RUN</div>
          </div>
        ) : (
          <>
            <div className="finding-row">
              <div className="finding-copy">
                <h3>Actual sandbox outcome</h3>
                <p>
                  The sandbox returned {executionResult.passed} passing result(s) out of {executionResult.total}
                  in {executionResult.durationMs} ms. These are predefined boundary checks, not evidence
                  that the candidate authored the test cases.
                </p>
              </div>
              <div className={`skill-chip ${executionResult.status === "passed" ? "skill-strong" : ""}`}>
                {executionResult.status === "passed" ? "ALL PASS" :
                  executionResult.status === "failed" ? "FAILURES" :
                  executionResult.status === "timeout" ? "TIMEOUT" : "ERROR"}
              </div>
              {verifiedEvidence[0] && (
                <EvidenceLink item={verifiedEvidence[0]} onOpen={setActiveEvidence} compact />
              )}
            </div>
            <div className="finding-row">
              <div className="finding-copy">
                <h3>Per-case results</h3>
                <p>{executionResult.cases.length
                  ? executionResult.cases.map((item) =>
                      `${item.input}s: ${item.passed ? "matched" : "did not match"} expected output`
                    ).join(" · ")
                  : executionResult.message || "No per-case output was returned."}</p>
              </div>
              <div className="skill-chip">
                {executionResult.cases.filter((item) => item.passed).length} / {executionResult.total} MATCHED
              </div>
            </div>
          </>
        )}
      </Panel>
      <Panel className="result-section practice-section"><div className="result-section-head"><div><Eyebrow color="cyan">02 / WHAT TO PRACTICE</Eyebrow><h2>One small next step.</h2></div><span className="section-mark cyan-mark"><Target size={16} /></span></div><div className="practice-card"><div className="practice-orb"><Sparkles size={18} /></div><div className="practice-content"><span className="practice-tag">OPTIONAL · 8 MIN</span><h3>Make the boundary table-driven.</h3><p>Try a few inputs around 60 seconds, including negative and non-integer values. Write down the expected output before you run each test.</p><button type="button" className="practice-action" onClick={() => setSaved(!saved)}>{saved ? "Added to your practice list" : "Save for later"} {saved ? <Check size={14} /> : <ArrowUpRight size={14} />}</button></div></div></Panel>
      <Panel className="result-section not-observed-section"><div className="result-section-head"><div><Eyebrow color="magenta">03 / WHAT WE COULD NOT OBSERVE</Eyebrow><h2>Not observed is not zero.</h2></div><span className="section-mark muted-mark"><CircleHelp size={16} /></span></div><div className="not-observed-row"><div><span className="not-observed-title">Collaboration across a team</span><p>This solo task offered no fair opportunity to observe it.</p></div><span className="not-observed-value">NOT OBSERVED</span></div></Panel>
      <Panel className="context-panel"><div className="context-title"><FileText size={17} /><div><h2>Your context note</h2><p>Optional. Shared separately from assessed findings.</p></div></div><label className="sr-only" htmlFor="context-note">Add context for the reviewer</label><textarea id="context-note" placeholder="Anything you'd like a human reviewer to know about your approach?" value={note} onChange={(e) => setNote(e.target.value)} /><div className="context-foot"><span>Not included in the skill findings.</span><span>Saved in this demo session</span></div></Panel>
    </div><aside className="results-aside"><Panel className="skill-summary"><Eyebrow>SKILL SNAPSHOT</Eyebrow><h2>Evidence bands</h2><p>Signals from one task only. Not a hiring score.</p><div className="skill-band"><div><span>Code correctness</span>
        <b>{executionResult
          ? executionResult.status === "passed" ? "Passed" :
            executionResult.status === "failed" ? "Failed" :
            executionResult.status === "timeout" ? "Timed out" : "Execution error"
          : "Not run"}</b></div><div className="band-track"><span style={{ width: executionResult && executionResult.total > 0 ? `${(executionResult.passed / executionResult.total) * 100}%` : "0%" }} /></div><small>{executionResult ? `${executionResult.passed} of ${executionResult.total} cases passed · ${executionResult.durationMs} ms` : "No verified test run yet"}</small></div><div className="skill-band cyan-band"><div><span>Patch review action</span>
        <b>{patch === "rejected" ? "Rejected" :
          patch === "applied" ? "Applied" :
          patch === "pending" ? "Awaiting review" : "Not observed"}</b></div><small>{patch === "rejected" || patch === "applied" ? "Action recorded; decision quality is not automatically scored." : "No review decision has been recorded."}</small></div><div className="skill-band muted-band"><div><span>Team collaboration</span><b>Not observed</b></div><small>No fair opportunity in this task.</small></div><div className="score-separator" /><div className="evidence-overview"><span><FileText size={14} /> Evidence records</span><b>{verifiedEvidence.length.toString().padStart(2, "0")} linked</b></div>{verifiedEvidence.map((item) => <EvidenceLink key={item.id} item={item} onOpen={setActiveEvidence} />)}</Panel><div className="results-disclaimer">This report reflects one task and does not determine hiring outcomes.</div><Link href="/reviewer" className="reviewer-link-card"><span><Eyebrow color="cyan">HUMAN REVIEW</Eyebrow><strong>Open reviewer report</strong><small>See what a recruiter can inspect.</small></span><ArrowRight size={17} /></Link></aside></div>
    <div className="results-footer"><span>PROOFMODE / CANDIDATE FEEDBACK</span><Link href="/reviewer" className="button button-secondary">View reviewer report <ArrowRight size={14} /></Link></div>
    <EvidenceDialog item={activeEvidence} onClose={() => setActiveEvidence(null)} />
  </main>;
}
