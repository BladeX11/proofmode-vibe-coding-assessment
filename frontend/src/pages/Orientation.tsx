import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Bot, Check, Clock3, Eye, LockKeyhole, Play, ScanEye, ShieldCheck, TerminalSquare } from "lucide-react";
import { ActionButton, Eyebrow, Panel, StatusBadge } from "@/components/proofmode/ui";

export default function Orientation() {
  return <main className="app-page page-shell orientation-page">
    <Link className="back-link" href="/"><ArrowLeft size={15} /> Back to ProofMode</Link>
    <div className="orientation-heading"><div><Eyebrow>ASSESSMENT / CANDIDATE BRIEF</Eyebrow><h1>Before you begin.</h1><p>A few minutes to understand the task, your tools, and what this session captures.</p></div><StatusBadge tone="cyan">ORIENTATION · UNGRADED</StatusBadge></div>
    <div className="orientation-grid">
      <section className="orientation-main">
        <Panel className="task-preview"><div className="panel-topline"><Eyebrow>YOUR TASK</Eyebrow><span className="task-id">TASK / TS-014</span></div><h2>Make time human-readable.</h2><p>Implement a small <code>formatDuration</code> helper for an activity feed. Return clear, concise durations—then tell us how you checked the tricky boundary.</p><div className="acceptance"><h3>ACCEPTANCE CRITERIA</h3><ul><li><Check size={14} /> Values under a minute show whole seconds.</li><li><Check size={14} /> Whole minutes don’t show a seconds remainder.</li><li><Check size={14} /> Longer durations include remaining seconds.</li><li><Check size={14} /> Negative values are treated as zero.</li></ul></div><div className="task-meta"><span><Clock3 size={15} /> 18 minutes</span><span><TerminalSquare size={15} /> TypeScript</span><span><Bot size={15} /> AI assistant allowed</span></div></Panel>
        <Panel className="tutorial-panel"><div className="panel-topline"><Eyebrow color="cyan">QUICK TOUR</Eyebrow><span className="unscored-label">UNSCORED</span></div><h2>Three things to try.</h2><div className="tutorial-steps"><div><span className="tutorial-icon"><Bot size={17} /></span><div><b>Ask the assistant</b><p>Choose a mode, add context, and get a suggestion.</p></div><span className="tutorial-num">01</span></div><div><span className="tutorial-icon cyan"><ScanEye size={17} /></span><div><b>Review a code diff</b><p>Nothing changes until you explicitly accept it.</p></div><span className="tutorial-num">02</span></div><div><span className="tutorial-icon magenta"><Play size={17} /></span><div><b>Run a test</b><p>Check the edge cases and verify your implementation.</p></div><span className="tutorial-num">03</span></div></div></Panel>
      </section>
      <aside className="orientation-aside">
        <Panel className="session-panel"><Eyebrow>SESSION DETAILS</Eyebrow><h2>Your space.<br/>Your process.</h2><div className="detail-list"><div><span className="detail-icon green"><Check size={15} /></span><span><b>AI is allowed</b><small>Use the built-in assistant as much—or as little—as you like.</small></span></div><div><span className="detail-icon cyan"><Eye size={15} /></span><span><b>What’s recorded</b><small>Prompts, visible code changes, test results, and your explanations.</small></span></div><div><span className="detail-icon muted"><LockKeyhole size={15} /></span><span><b>What stays hidden</b><small>No keystroke logging, screen recording, webcam, or biometrics.</small></span></div></div><div className="privacy-note"><ShieldCheck size={16} /><p>Evidence is limited to this task. A human reviewer—not an algorithm—interprets the report.</p></div></Panel>
        <div className="orientation-start"><p>Ready when you are. The timer starts after you begin.</p><Link href="/assessment" className="button button-primary full-button">Start assessment <ArrowRight size={16} /></Link><small>By continuing, you acknowledge the session evidence notice above.</small></div>
      </aside>
    </div>
    <div className="prototype-footer"><span>PROOFMODE / IM—01</span><span>Candidate orientation <i>·</i> 01 of 04</span></div>
  </main>;
}
