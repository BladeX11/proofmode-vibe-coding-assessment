import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowUpRight, Check, CircleHelp, CircleX, FileCheck2, MessageSquareText, UserRound, UsersRound } from "lucide-react";
import { Eyebrow, EvidenceDialog, EvidenceLink, Panel, StatusBadge } from "@/components/proofmode/ui";
import { trpc } from "@/lib/trpc";
import { useDemo, type EvidenceItem, type ExecutionResult } from "@/contexts/DemoContext";

export default function Reviewer() {
  const {
    evidence,
    note,
    assessmentSession,
    executionResult: localExecutionResult,
    patch,
  } = useDemo();

  const [activeEvidence, setActiveEvidence] = useState<EvidenceItem | null>(null);

  const reportQuery = trpc.assessment.getSessionReport.useQuery(
    assessmentSession ?? { sessionId: "", accessToken: "" },
    { enabled: Boolean(assessmentSession), retry: false },
  );

  const persistedExecution = reportQuery.data?.execution ?? null;
  const execution: ExecutionResult | null = reportQuery.data
    ? persistedExecution
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
      : null
    : localExecutionResult;

  const testEvidence: EvidenceItem | null = persistedExecution
    ? {
        id: "EV-03",
        title: "Persisted sandbox test run",
        kind: "test",
        detail: `${persistedExecution.passed}/${persistedExecution.total} predefined tests passed in ${persistedExecution.durationMs} ms. ${persistedExecution.cases.map((item) => `${item.input}s: expected ${JSON.stringify(item.expected)}, actual ${item.actual === undefined ? "no output" : JSON.stringify(item.actual)} — ${item.passed ? "PASS" : "FAIL"}${item.error ? ` (${item.error})` : ""}`).join("; ") || "No per-case results recorded."}${persistedExecution.message ? ` Message: ${persistedExecution.message}` : ""}`,
      }
    : !reportQuery.data && localExecutionResult
      ? evidence.find((item) => item.id === "EV-03") ?? null
      : null;

  const patchEvidence: EvidenceItem | null = patch === "idle"
    ? null
    : {
        id: "EV-02",
        title: "Patch review action",
        kind: "diff",
        detail: patch === "rejected"
          ? "The candidate rejected the suggested patch in the current demo session."
          : patch === "applied"
            ? "The candidate applied the suggested patch in the current demo session."
            : "A suggested patch is awaiting the candidate's review.",
      };
  return <main className="app-page page-shell reviewer-page">
    <div className="reviewer-utility"><Link href="/results" className="back-link"><ArrowLeft size={15} /> Candidate report</Link><div><StatusBadge tone="cyan">EVIDENCE REVIEW</StatusBadge><span className="report-ref">REPORT / PM—014—A</span></div></div>
    {reportQuery.data && <p className="report-source" role="status">Reviewer data loaded from saved session · {reportQuery.data.session.status}</p>}
    {assessmentSession && reportQuery.isError && <p className="report-load-error" role="alert">The saved report could not be loaded. Any displayed local data is from this browser session.</p>}
    <header className="reviewer-header"><div><Eyebrow color="cyan">PROOFMODE / REVIEWER BRIEF</Eyebrow><h1>Evidence, in context.</h1><p>A focused view of one task, with every signal linked to its source.</p></div><button className="export-button" onClick={() => window.print()} type="button"><FileCheck2 size={15} /> Print summary</button></header>
    <div className="reviewer-note"><span className="reviewer-note-icon"><UserRound size={17} /></span><p><strong>Evidence from this task only. Human review required.</strong><br/>This report is not a hiring decision or candidate ranking. Interpret findings alongside other relevant information.</p></div>
    <div className="report-summary"><Panel className="candidate-card"><div className="candidate-avatar">A</div><div><Eyebrow>CANDIDATE / DEMO PROFILE</Eyebrow><h2>Alex Morgan</h2><p>TypeScript · Coding task TS-014</p></div><span className="candidate-date">15 OCT 2026</span></Panel><Panel className="task-outcome-card"><div><Eyebrow>TASK OUTCOME</Eyebrow><h2 className={execution?.status === "passed" ? "outcome-pass" : "outcome-seeded"}>{execution ? `${execution.passed} / ${execution.total} passed` : reportQuery.isLoading ? "Loading saved report" : "No execution recorded"}</h2><p>formatDuration · predefined sandbox checks</p></div><span className={`outcome-icon ${
        execution?.status === "passed"
          ? "outcome-icon-pass"
          : execution
            ? "outcome-icon-fail"
            : "outcome-icon-pending"
      }`}>
        {execution?.status === "passed"
          ? <Check size={19} />
          : execution
            ? <CircleX size={19} />
            : <CircleHelp size={19} />}
      </span></Panel></div>
    <section className="report-section correctness-section">
      <div className="report-section-title">
        <span className="report-section-index">01</span>
        <div><Eyebrow>OUTPUT QUALITY</Eyebrow><h2>Code correctness</h2></div>
        <span className="report-section-caption">THE RESULT</span>
      </div>
      <div className="report-findings">
        <article className="report-finding">
          <div className="finding-score">
            <span className={`score-dot ${execution?.status === "passed" ? "green" : "muted"}`} />
            <div>
              <b>Boundary checks</b>
              <small>Outcome · {execution
                ? execution.status === "passed" ? "Passed"
                  : execution.status === "failed" ? "Failed"
                  : execution.status === "timeout" ? "Timed out" : "Execution error"
                : "Not observed"}</small>
            </div>
          </div>
          <div className="finding-description">
            <p>{execution
              ? `The sandbox recorded ${execution.passed} passing result(s) out of ${execution.total} predefined checks in ${execution.durationMs} ms. ${execution.status === "passed" ? "All recorded checks passed." : "The implementation needs review against the failed or incomplete checks."}`
              : "No verified execution result is available for this report."}</p>
            <span className="confidence">
              {execution
                ? "Runner evidence · These system-provided checks do not establish who authored the tests."
                : "No verified execution evidence"}
            </span>
          </div>
          {testEvidence && <EvidenceLink item={testEvidence} onOpen={setActiveEvidence} compact />}
        </article>
      </div>
    </section>
    <section className="report-section process-section">
      <div className="report-section-title">
        <span className="report-section-index cyan-index">02</span>
        <div><Eyebrow color="cyan">DECISION QUALITY</Eyebrow><h2>Process signals</h2></div>
        <span className="report-section-caption">WHAT WAS OBSERVED</span>
      </div>
      <div className="report-findings">
        <article className="report-finding">
          <div className="finding-score">
            <span className={`score-dot ${patch === "idle" ? "muted" : "cyan"}`} />
            <div>
              <b>Patch review</b>
              <small>Signal · {patch === "rejected" ? "Rejected" : patch === "applied" ? "Applied" : patch === "pending" ? "Pending review" : "Not observed"}</small>
            </div>
          </div>
          <div className="finding-description">
            <p>{patch === "rejected"
              ? "A patch rejection is recorded in the current demo session; decision quality is not inferred from the action alone."
              : patch === "applied"
                ? "A patch application is recorded in the current demo session; correctness must be judged from execution evidence."
                : patch === "pending"
                  ? "A patch suggestion is awaiting review. No final review decision is recorded."
                  : "No patch review decision is recorded for this session."}</p>
          </div>
          {patchEvidence && <EvidenceLink item={patchEvidence} onOpen={setActiveEvidence} compact />}
        </article>
        <article className="report-finding">
          <div className="finding-score">
            <span className={`score-dot ${execution ? "cyan" : "muted"}`} />
            <div>
              <b>Execution verification</b>
              <small>Signal · {execution ? "Observed" : "Not observed"}</small>
            </div>
          </div>
          <div className="finding-description">
            <p>{execution
              ? `A sandbox run is recorded with ${execution.passed}/${execution.total} predefined checks passing. This does not establish that the candidate selected those test inputs.`
              : "No persisted execution run is available to inspect."}</p>
          </div>
          {testEvidence && <EvidenceLink item={testEvidence} onOpen={setActiveEvidence} compact />}
        </article>
        <article className="report-finding not-observed-finding">
          <div className="finding-score">
            <span className="score-dot muted" />
            <div><b>Team collaboration</b><small>Skill band · Not observed</small></div>
          </div>
          <div className="finding-description">
            <p>This individual task provided no fair opportunity to observe collaboration. No inference is made.</p>
          </div>
          <span className="not-observed-value">NOT OBSERVED</span>
        </article>
      </div>
    </section>
    <div className="reviewer-bottom-grid">
      <Panel className="strengths-panel">
        <div className="reviewer-card-heading"><UsersRound size={16} /><Eyebrow color="green">RECORDED SIGNALS</Eyebrow></div>
        <ul>
          <li><Check size={13} /> {execution
            ? `Sandbox execution recorded: ${execution.passed}/${execution.total} predefined checks passed.`
            : "No verified sandbox execution is currently available."}</li>
          <li><Check size={13} /> {patch === "rejected"
            ? "Patch rejection recorded in this demo session."
            : patch === "applied"
              ? "Patch application recorded in this demo session."
              : patch === "pending"
                ? "Patch suggestion remains awaiting review."
                : "No patch review decision recorded."}</li>
        </ul>
      </Panel>
      <Panel className="questions-panel">
        <div className="reviewer-card-heading"><MessageSquareText size={16} /><Eyebrow color="magenta">SUGGESTED FOLLOW-UP</Eyebrow></div>
        <ol>
          <li>How would you extend this helper for hours and days?</li>
          <li>What would you change if the input could be fractional?</li>
          <li>How do you decide when an AI suggestion is worth keeping?</li>
        </ol>
      </Panel>
    </div>
    {note.trim() && <Panel className="candidate-context-report"><div><Eyebrow>CANDIDATE CONTEXT NOTE</Eyebrow><span>Shared separately from assessed findings</span></div><p>{note}</p></Panel>}
    <footer className="reviewer-footer"><span>PROOFMODE / EVIDENCE REPORT · TASK TS-014</span><Link href="/assessment" className="text-link">Return to demo <ArrowUpRight size={14} /></Link></footer>
    <EvidenceDialog item={activeEvidence} onClose={() => setActiveEvidence(null)} />
  </main>;
}
