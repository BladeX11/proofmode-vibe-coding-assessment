import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowUpRight, Check, CircleHelp, Printer, X } from "lucide-react";
import { EvidenceDialog, EvidenceLink, Panel, StatusBadge } from "@/components/proofmode/ui";
import { trpc } from "@/lib/trpc";
import { useDemo, type EvidenceItem, type ExecutionResult } from "@/contexts/DemoContext";

type Verdict = { word: string; cls: "pass" | "fail" | "pending" | "neutral" | "na" };
const EXECUTION_WORD = { passed: "Passed", failed: "Failed", timeout: "Timed out", error: "Execution error" } as const;

function VerdictChip({ verdict }: { verdict: Verdict }) {
  if (verdict.cls === "na") return <span className="pm-na"><CircleHelp size={13} aria-hidden="true" /> {verdict.word}</span>;
  const Icon = verdict.cls === "pass" ? Check : verdict.cls === "fail" ? X : null;
  return <span className={`pm-badge pm-badge-${verdict.cls}`}>{Icon && <Icon size={13} aria-hidden="true" />}{verdict.word}</span>;
}

function Finding({ title, verdict, body, caveat, evidence, onOpen }: { title: string; verdict: Verdict; body: string; caveat?: string; evidence?: EvidenceItem | null; onOpen: (item: EvidenceItem) => void }) {
  return <article className="pm-finding">
    <div className="pm-finding-name"><b>{title}</b><VerdictChip verdict={verdict} /></div>
    <div style={{ display: "grid", gap: 6 }}><p className="pm-prose">{body}</p>{caveat && <p className="pm-micro">{caveat}</p>}</div>
    {evidence ? <EvidenceLink item={evidence} onOpen={onOpen} compact /> : <span />}
  </article>;
}

export default function Reviewer() {
  const { evidence, note, assessmentSession, executionResult: localExecutionResult, patch } = useDemo();
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

  const executionVerdict: Verdict = execution
    ? { word: EXECUTION_WORD[execution.status], cls: execution.status === "passed" ? "pass" : "fail" }
    : { word: "Not observed", cls: "na" };
  const patchVerdict: Verdict = patch === "rejected" ? { word: "Rejected", cls: "neutral" }
    : patch === "applied" ? { word: "Applied", cls: "neutral" }
    : patch === "pending" ? { word: "Pending review", cls: "pending" }
    : { word: "Not observed", cls: "na" };

  return <main className="pm-page">
    <div className="pm-topline pm-no-print">
      <Link href="/results" className="pm-back"><ArrowLeft size={15} aria-hidden="true" /> Candidate report</Link>
      <StatusBadge tone="muted">Reviewer view</StatusBadge>
    </div>
    {reportQuery.data && <p className="pm-micro" role="status">Loaded from the saved session ({reportQuery.data.session.status}).</p>}
    {assessmentSession && reportQuery.isError && <p className="pm-ws-error" role="alert">The saved report could not be loaded. Anything shown here comes from this browser session.</p>}
    <header className="pm-pagehead pm-headrow">
      <div style={{ display: "grid", gap: "var(--pm-s3)" }}>
        <span className="pm-label">Reviewer report · Task TS-014</span>
        <h1 className="pm-h1">What this session shows</h1>
        <p className="pm-prose pm-muted">One task, with each finding tied to the record behind it.</p>
      </div>
      <button className="pm-btn pm-btn-secondary pm-no-print" onClick={() => window.print()} type="button"><Printer size={16} aria-hidden="true" /> Print summary</button>
    </header>
    <div className="pm-notice">
      <strong>Evidence from this task only. Human review required.</strong>
      <p className="pm-muted">This is not a hiring decision or a ranking. Read it alongside everything else you know about the candidate.</p>
    </div>
    <div className="pm-summary">
      <Panel className="pm-stat"><span className="pm-label">Sample candidate (not a real person)</span><h2>Alex Morgan</h2><p className="pm-muted">TypeScript · Task TS-014</p></Panel>
      <Panel className="pm-stat"><span className="pm-label">Task outcome</span><h2 style={{ color: execution?.status === "passed" ? "var(--pm-pass)" : undefined }}>{execution ? `${execution.passed} of ${execution.total} checks passed` : reportQuery.isLoading ? "Loading saved report" : "No execution recorded"}</h2><p className="pm-muted">formatDuration · fixed sandbox checks</p></Panel>
    </div>

    <section className="pm-section" aria-labelledby="sec-correctness">
      <div className="pm-section-title"><span className="pm-micro">01</span><h2 className="pm-h2" id="sec-correctness">Code correctness</h2><span className="pm-micro">The result</span></div>
      <Finding title="Boundary checks" verdict={executionVerdict} onOpen={setActiveEvidence} evidence={testEvidence}
        body={!execution
          ? "No verified execution result is available for this report."
          : execution.status === "error" || execution.status === "timeout"
            ? `The sandbox run did not finish (${EXECUTION_WORD[execution.status].toLowerCase()}), so no checks were verified. This says nothing about the candidate’s code.`
            : `The sandbox recorded ${execution.passed} passing result(s) out of ${execution.total} fixed checks in ${execution.durationMs} ms. ${execution.status === "passed" ? "All recorded checks passed." : "The implementation needs a closer look at the failed checks."}`}
        caveat={execution ? "These checks are provided by the system. They do not show who wrote the tests." : undefined} />
    </section>

    <section className="pm-section" aria-labelledby="sec-process">
      <div className="pm-section-title"><span className="pm-micro">02</span><h2 className="pm-h2" id="sec-process">Process signals</h2><span className="pm-micro">What was observed</span></div>
      <Finding title="Patch review" verdict={patchVerdict} onOpen={setActiveEvidence} evidence={patchEvidence}
        body={patch === "rejected"
          ? "The candidate rejected the suggested patch. The action alone does not say how well they judged it."
          : patch === "applied"
            ? "The candidate applied the suggested patch. Whether that was sound shows in the test results, not in the action."
            : patch === "pending"
              ? "A suggestion is waiting for the candidate’s decision. No review outcome is recorded."
              : "No patch review decision is recorded for this session."} />
      <Finding title="Execution verification" verdict={execution ? { word: "Observed", cls: "neutral" } : { word: "Not observed", cls: "na" }} onOpen={setActiveEvidence} evidence={testEvidence}
        body={!execution
          ? "No saved test run is available to inspect."
          : execution.status === "error" || execution.status === "timeout"
            ? "A sandbox run was attempted but did not finish, so there is no result to inspect."
            : `A sandbox run is recorded with ${execution.passed} of ${execution.total} fixed checks passing. This does not show that the candidate chose those test inputs.`} />
      <Finding title="Team collaboration" verdict={{ word: "Not observed", cls: "na" }} onOpen={setActiveEvidence}
        body="This is a solo task, so it gave no fair chance to observe collaboration. Nothing is inferred." />
    </section>

    <div className="pm-two">
      <Panel>
        <h2 className="pm-h3">Recorded signals</h2>
        <ul className="pm-list" style={{ marginTop: "var(--pm-s3)" }}>
          <li>{execution ? `Sandbox run recorded: ${execution.passed} of ${execution.total} fixed checks passed.` : "No verified sandbox run is available."}</li>
          <li>{patch === "rejected" ? "Patch rejection recorded." : patch === "applied" ? "Patch application recorded." : patch === "pending" ? "A patch suggestion is still waiting for review." : "No patch review decision recorded."}</li>
        </ul>
      </Panel>
      <Panel>
        <h2 className="pm-h3">Questions you could ask</h2>
        <p className="pm-micro" style={{ margin: "var(--pm-s1) 0 var(--pm-s3)" }}>Written for this sample task. They are not generated from the session.</p>
        <ol className="pm-list">
          <li>How would you extend this helper for hours and days?</li>
          <li>What would you change if the input could be fractional?</li>
          <li>How do you decide when an AI suggestion is worth keeping?</li>
        </ol>
      </Panel>
    </div>

    {note.trim() && <Panel><span className="pm-label">Candidate’s own note · shared separately from the findings</span><p className="pm-prose" style={{ margin: "var(--pm-s2) 0 0" }}>{note}</p></Panel>}
    <div className="pm-foot pm-no-print"><span className="pm-micro">ProofMode evidence report · Task TS-014 · Hackathon prototype, not a hiring decision system</span><Link href="/assessment" className="pm-btn pm-btn-quiet">Return to the demo <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
    <EvidenceDialog item={activeEvidence} onClose={() => setActiveEvidence(null)} />
  </main>;
}
