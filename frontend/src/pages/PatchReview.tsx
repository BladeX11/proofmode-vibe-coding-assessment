import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Code2, CornerDownRight, Eye, GitCompareArrows, Play, ShieldCheck, X } from "lucide-react";
import { ActionButton, Eyebrow, StatusBadge } from "@/components/proofmode/ui";
import { correctedCode, flawedPatch, useDemo } from "@/contexts/DemoContext";

const original = `export function formatDuration(seconds: number): string {\n  // TODO: format a duration\n  return "";\n}`;
export default function PatchReview() {
  const { patch, applyPatch, rejectPatch, code, setCode, runTests, tests } = useDemo();
  const [candidateCorrection, setCandidateCorrection] = useState(correctedCode);
  const [showCorrection, setShowCorrection] = useState(false);
  const isRejected = patch === "rejected";
  return <main className="app-page page-shell review-page">
    <div className="review-topline"><Link href="/assessment" className="back-link"><ArrowLeft size={15} /> Back to workspace</Link><StatusBadge tone={isRejected ? "red" : "magenta"}>{isRejected ? "SUGGESTION REJECTED" : "AI PATCH / REVIEW REQUIRED"}</StatusBadge></div>
    <div className="review-heading"><div><Eyebrow color="magenta">AI ASSISTANT / PROPOSED CHANGE</Eyebrow><h1>Read the diff.<br/><span>Then decide.</span></h1><p>Nothing is applied until you choose. This suggestion has a subtle edge-case flaw—can you spot it?</p></div><div className="review-meta"><span><GitCompareArrows size={15} /> 1 file changed</span><span className="diff-plus">+ 4</span><span className="diff-minus">− 2</span></div></div>
    <div className="review-explanation"><div className="explanation-icon"><Eye size={17} /></div><div><Eyebrow color="cyan">PLAIN-LANGUAGE EXPLANATION</Eyebrow><p>The suggestion converts seconds to minutes using <code>Math.round</code>. At <strong>59 seconds</strong>, it rounds up and returns “1 min” too early. Compare the output just below and at the 60-second boundary before accepting.</p></div></div>
    <div className="diff-grid"><section className="diff-card diff-before"><div className="diff-card-head"><span><Code2 size={14} /> ORIGINAL</span><span className="file-path">src/formatDuration.ts</span></div><pre aria-label="Original code"><code>{original.split("\n").map((line, i) => <span key={i} className={`diff-line${i === 2 ? " unchanged" : ""}`}><i>{String(i + 1).padStart(2, "0")}</i>{line}</span>)}</code></pre></section>
      <section className="diff-card diff-after"><div className="diff-card-head"><span><Code2 size={14} /> AI SUGGESTION</span><span className="file-path">src/formatDuration.ts</span></div><pre aria-label="AI proposed code diff"><code>{flawedPatch.split("\n").map((line, i) => <span key={i} className={`diff-line ${i === 1 ? "diff-added" : i === 2 ? "diff-added diff-warning" : i === 3 ? "diff-added" : ""}`}><i>{i === 0 ? " " : "+"}</i>{line}</span>)}</code></pre><div className="inline-warning"><CircleAlert size={13} /> <span>Potential boundary issue: 59 seconds → 1 min</span></div></section></div>
    {isRejected && <div className="rejected-feedback"><Check size={16} /><span><strong>Suggestion rejected.</strong> The original code is unchanged. Add your own correction below, then run the boundary tests.</span></div>}
    <div className="review-actions"><div className="review-action-note"><ShieldCheck size={15} /> Your code changes only when you choose an action.</div><div className="review-button-group">{!isRejected && <><ActionButton variant="secondary" onClick={rejectPatch}><X size={15} /> Reject suggestion</ActionButton><ActionButton onClick={applyPatch}><Check size={15} /> Apply change</ActionButton></>}</div></div>
    <section className="correction-panel"><div className="correction-head"><div><Eyebrow color="green">YOUR MOVE</Eyebrow><h2>Correct it your way.</h2><p>Rejecting keeps your code intact. Edit a fix here, then explicitly save it to the workspace.</p></div><span className="correction-index">01 <i>/</i> 02</span></div>
      <label htmlFor="candidate-correction">Candidate correction <span>TypeScript</span></label><textarea id="candidate-correction" value={candidateCorrection} onChange={(e) => setCandidateCorrection(e.target.value)} spellCheck={false} />
      <div className="correction-controls"><ActionButton variant="secondary" onClick={() => { setCode(candidateCorrection); setShowCorrection(true); }}><Check size={14} /> Save my correction</ActionButton><ActionButton variant="quiet" onClick={runTests}><Play size={14} /> Run boundary tests</ActionButton><span className={`correction-test${tests === "passed" ? " passed" : tests === "failed" ? " failed" : ""}`}>{tests === "passed" ? <><Check size={13} /> 4 / 4 passed</> : tests === "failed" ? <><CircleAlert size={13} /> Review failing case</> : "Tests not run"}</span></div>
      {showCorrection && <p className="correction-saved"><Check size={13} /> Your correction is saved in the workspace. <Link href="/assessment">Return to editor <CornerDownRight size={13} /></Link></p>}
    </section>
    <div className="review-next"><span>Review → correct → verify.</span><Link href="/assessment" className="text-link">Return to workspace <ArrowRight size={14} /></Link></div>
  </main>;
}
