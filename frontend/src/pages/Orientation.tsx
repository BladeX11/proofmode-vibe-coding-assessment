import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Clock3, Bot, TerminalSquare } from "lucide-react";
import { Panel, StatusBadge } from "@/components/proofmode/ui";

export default function Orientation() {
  return <main className="pm-page">
    <div className="pm-topline"><Link className="pm-back" href="/"><ArrowLeft size={15} aria-hidden="true" /> Back to ProofMode</Link><StatusBadge tone="muted">Orientation, not scored</StatusBadge></div>
    <header className="pm-pagehead">
      <span className="pm-label">Before you start</span>
      <h1 className="pm-h1">Read the task, then begin when you’re ready</h1>
      <p className="pm-prose pm-muted">A few minutes to see the task, your tools, and what this session keeps.</p>
    </header>
    <div className="pm-results">
      <div className="pm-results-main">
        <Panel>
          <span className="pm-label">Your task · TS-014</span>
          <h2 className="pm-h2" style={{ margin: "var(--pm-s1) 0 var(--pm-s3)" }}>Format a duration for an activity feed</h2>
          <p className="pm-prose" style={{ margin: "0 0 var(--pm-s4)" }}>Write a small <code className="pm-evref">formatDuration</code> helper that returns short, clear durations. Be ready to say how you checked the tricky boundary.</p>
          <h3 className="pm-label" style={{ margin: "0 0 var(--pm-s2)" }}>Acceptance criteria</h3>
          <ul className="pm-list" style={{ marginBottom: "var(--pm-s4)" }}>
            <li>Values under a minute show whole seconds.</li>
            <li>Whole minutes don’t show a seconds remainder.</li>
            <li>Longer durations include the remaining seconds.</li>
            <li>Negative values are treated as zero.</li>
          </ul>
          <ul className="pm-facts">
            <li style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Clock3 size={15} aria-hidden="true" /> 18 minutes</li>
            <li style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><TerminalSquare size={15} aria-hidden="true" /> TypeScript</li>
            <li style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><Bot size={15} aria-hidden="true" /> AI assistant allowed</li>
          </ul>
        </Panel>
        <Panel>
          <span className="pm-label">Quick tour · unscored</span>
          <h2 className="pm-h2" style={{ margin: "var(--pm-s1) 0 var(--pm-s4)" }}>Three things to try</h2>
          <ol className="pm-steps">
            <li><div><b>Ask the assistant</b><p className="pm-muted">Pick a mode, add some context, and read what comes back.</p></div></li>
            <li><div><b>Review a code diff</b><p className="pm-muted">Nothing changes in your code until you accept it.</p></div></li>
            <li><div><b>Run the tests</b><p className="pm-muted">Check the edge cases before you decide you’re done.</p></div></li>
          </ol>
        </Panel>
      </div>
      <aside className="pm-results-aside" aria-label="Session details">
        <Panel>
          <h2 className="pm-h3" style={{ marginBottom: "var(--pm-s3)" }}>What to know about this session</h2>
          <div className="pm-detail"><b>The assistant is allowed</b><p className="pm-muted">Use it as much or as little as you like. In this prototype its replies are scripted and no external model is called.</p></div>
          <div className="pm-detail"><b>What the session keeps</b><p className="pm-muted">Your prompts and patch decisions stay in this browser tab. Each test run saves your code and its results.</p></div>
          <div className="pm-detail"><b>What it doesn’t record</b><p className="pm-muted">No keystroke logging, screen recording, webcam or biometrics.</p></div>
          <p className="pm-micro" style={{ margin: "var(--pm-s3) 0 0" }}>Evidence is limited to this task. A person, not an algorithm, reads the report.</p>
        </Panel>
        <Link href="/assessment" className="pm-btn pm-btn-primary">Start the assessment <ArrowRight size={16} aria-hidden="true" /></Link>
        <p className="pm-micro" style={{ margin: 0 }}>The timer starts when the workspace opens. By continuing you confirm you’ve read what the session keeps.</p>
      </aside>
    </div>
  </main>;
}
