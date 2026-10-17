import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Play, ShieldCheck, X } from "lucide-react";
import { ActionButton, StatusBadge } from "@/components/proofmode/ui";
import { correctedCode, flawedPatch, starterCode, useDemo } from "@/contexts/DemoContext";

const originalLines = starterCode.split("\n");
const patchLines = flawedPatch.split("\n");
// Unified diff of starter -> suggestion. The flaw is the Math.round line.
const FLAW_LINE = 1;
type DiffRow = { kind: "ctx" | "del" | "add" | "flag"; no: number; text: string };
const diffRows: DiffRow[] = [
  { kind: "ctx", no: 1, text: patchLines[0] },
  ...originalLines.slice(1, -1).map((text, i): DiffRow => ({ kind: "del", no: i + 2, text })),
  ...patchLines.slice(1, -1).map((text, i): DiffRow => ({ kind: i + 1 === FLAW_LINE ? "flag" : "add", no: i + 2, text })),
  { kind: "ctx", no: patchLines.length, text: patchLines[patchLines.length - 1] },
];
const addedCount = diffRows.filter((r) => r.kind === "add" || r.kind === "flag").length;
const removedCount = diffRows.filter((r) => r.kind === "del").length;
const SIGN = { ctx: " ", del: "−", add: "+", flag: "+" } as const;

export default function PatchReview() {
  const { patch, applyPatch, rejectPatch, setCode, runTests, executionResult, runningTests } = useDemo();
  const [candidateCorrection, setCandidateCorrection] = useState(correctedCode);
  const [showCorrection, setShowCorrection] = useState(false);
  const isRejected = patch === "rejected";
  const testLine = runningTests ? "Running tests…" : executionResult ? `${executionResult.passed} of ${executionResult.total} tests passed` : "Tests not run";
  return <main className="pm-page">
    <div className="pm-topline">
      <Link href="/assessment" className="pm-back"><ArrowLeft size={15} aria-hidden="true" /> Back to workspace</Link>
      <StatusBadge tone={isRejected ? "red" : "magenta"}>{isRejected ? "Suggestion rejected" : "Needs your decision"}</StatusBadge>
    </div>
    <header className="pm-pagehead">
      <span className="pm-label">The assistant suggests a change</span>
      <h1 className="pm-h1">Read the diff, then decide.</h1>
      <p className="pm-prose pm-muted">Nothing is applied until you choose. This suggestion has an edge-case flaw. See if you can find it before you read the note below.</p>
    </header>
    <div className="pm-review-explain">
      <span className="pm-label">What the change does</span>
      <p className="pm-prose">It turns seconds into minutes with <code className="pm-evref">Math.round</code>. <span className="pm-mark">At 59 seconds that rounds up and returns “1 min”</span> before a full minute has passed. Try a value just below 60 and one at 60 before you accept it.</p>
    </div>
    <section aria-label="Code diff" style={{ display: "grid", gap: "var(--pm-s2)" }}>
      <div className="pm-diffhead">
        <span className="pm-micro">src/formatDuration.ts</span>
        <span className="pm-diffstat" aria-label={`${addedCount} lines added, ${removedCount} removed`}><span className="pm-add">+{addedCount}</span><span className="pm-del">−{removedCount}</span></span>
      </div>
      <div className="pm-diff" role="group" aria-label="Suggested change, unified diff">
        {diffRows.map((row, i) => <div key={i} className={`pm-diff-line${row.kind === "add" ? " pm-diff-add" : row.kind === "del" ? " pm-diff-del" : row.kind === "flag" ? " pm-diff-add pm-diff-flag" : ""}`}><i>{row.no}</i><i aria-hidden="true">{SIGN[row.kind]}</i><span>{row.text}</span></div>)}
      </div>
      <p className="pm-diffnote"><CircleAlert size={15} aria-hidden="true" style={{ flex: "none", marginTop: 2 }} /> <span>Marked line: <code>Math.round(seconds / 60)</code> gives “1 min” for 59 seconds.</span></p>
    </section>
    {isRejected && <p className="pm-alert"><Check size={15} aria-hidden="true" style={{ flex: "none", marginTop: 2 }} /> <span><strong>Suggestion rejected.</strong> Your code is unchanged. Write your own fix below, then run the tests.</span></p>}
    <div className="pm-actions">
      <span className="pm-micro" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ShieldCheck size={15} aria-hidden="true" /> Your code changes only when you choose an action.</span>
      <div className="pm-actions-group">{!isRejected && <>
        <ActionButton variant="secondary" onClick={rejectPatch}><X size={16} aria-hidden="true" /> Reject suggestion</ActionButton>
        <ActionButton onClick={applyPatch}><Check size={16} aria-hidden="true" /> Apply change</ActionButton>
      </>}</div>
    </div>
    <section className="pm-correct" aria-labelledby="correct-heading">
      <h2 className="pm-h2" id="correct-heading">Write your own fix</h2>
      <p className="pm-prose pm-muted" style={{ margin: 0 }}>Rejecting keeps your code as it was. Edit a fix here, save it to the workspace, then run the tests. For this demo the box starts with a sample fix so the flow is quick to show.</p>
      <label className="pm-label" htmlFor="candidate-correction">Your correction (TypeScript)</label>
      <textarea id="candidate-correction" className="pm-field" value={candidateCorrection} onChange={(e) => setCandidateCorrection(e.target.value)} spellCheck={false} wrap="off" />
      <div className="pm-correct-controls">
        <ActionButton variant="secondary" onClick={() => { setCode(candidateCorrection); setShowCorrection(true); }}><Check size={16} aria-hidden="true" /> Save my correction</ActionButton>
        <ActionButton variant="quiet" onClick={() => { void runTests(); }} disabled={runningTests}><Play size={15} aria-hidden="true" /> Run tests</ActionButton>
        <span className="pm-label" role="status" style={{ color: executionResult?.status === "passed" ? "var(--pm-pass)" : undefined }}>{testLine}</span>
      </div>
      {showCorrection && <p className="pm-alert"><Check size={15} aria-hidden="true" style={{ flex: "none", marginTop: 2 }} /> <span>Saved to the workspace. <Link href="/assessment" style={{ textDecoration: "underline" }}>Return to the editor</Link></span></p>}
    </section>
    <div className="pm-actions"><span className="pm-micro">Review, correct, then verify.</span><Link href="/assessment" className="pm-btn pm-btn-quiet">Back to workspace <ArrowRight size={15} aria-hidden="true" /></Link></div>
  </main>;
}
