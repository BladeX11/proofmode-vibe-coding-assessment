import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Bot, Check, ChevronDown, CircleHelp, Clock3, Code2, FileCode2, History, Play, Send, Sparkles, Terminal, WandSparkles } from "lucide-react";
import { ActionButton, Eyebrow, StatusBadge } from "@/components/proofmode/ui";
import { useDemo, type AssistantMode } from "@/contexts/DemoContext";

const modes: AssistantMode[] = ["Explain", "Plan", "Suggest code", "Explain a change", "Suggest a test"];
export default function Assessment() {
  const { code, setCode, ask, messages, patch, tests, executionResult, runningTests, runTests, submit } = useDemo();
  const [mode, setMode] = useState<AssistantMode>("Explain");
  const [prompt, setPrompt] = useState("");
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { const start = Date.now(); const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000); return () => window.clearInterval(timer); }, []);
  const remaining = Math.max(0, 18 * 60 - elapsed);
  const timer = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const send = () => { ask(mode, prompt); setPrompt(""); };
  return <main className="workbench-page">
    <header className="workbench-top"><Link href="/" className="workbench-brand"><span className="brand-mark"><b>⟨</b><i>•</i><b>⟩</b></span><span>ProofMode</span><span className="top-divider" /> <span className="workspace-name">Assessment workspace</span></Link><div className="workbench-meta"><StatusBadge>SESSION EVIDENCE ON</StatusBadge><span className="timer"><Clock3 size={14} /> {timer}</span><span className="save-state"><span /> Saved</span><Link href="/orientation" className="exit-link">Exit task</Link></div></header>
    <div className="workbench-progress"><span style={{ width: `${Math.min(84, 22 + Math.floor(elapsed / 60) * 3)}%` }} /></div>
    <div className="workspace-grid">
      <aside className="task-sidebar"><div className="sidebar-heading"><Eyebrow>TASK / TS-014</Eyebrow><span>01 <i>/</i> 01</span></div><h1>Make time human-readable.</h1><p className="task-description">Implement <code>formatDuration(seconds)</code> for a compact activity feed.</p><div className="task-rule" /><h2>Acceptance criteria</h2><ul className="criterion-list"><li><Check size={13} /> Under a minute → whole seconds</li><li><Check size={13} /> Whole minutes → no remainder</li><li><Check size={13} /> Longer durations → include seconds</li><li><Check size={13} /> Negative input → treat as zero</li></ul><div className="task-hint"><CircleHelp size={15} /><p>Try values around the 60-second boundary. One second can change the output.</p></div><div className="sidebar-tools"><Eyebrow>AVAILABLE TOOLS</Eyebrow><span><Bot size={14} /> ProofMode AI assistant</span><span><Terminal size={14} /> Local test runner</span></div><div className="task-progress"><span>Progress</span><strong>Task 01 <i>of</i> 01</strong><div><span style={{ width: tests === "passed" ? "100%" : "46%" }} /></div></div></aside>
      <section className="editor-column"><div className="editor-toolbar"><div className="file-tab"><FileCode2 size={14} /><span>formatDuration.ts</span><i className="file-unsaved" title="Local draft" /></div><div className="editor-toolbar-right"><span>TypeScript</span><button className="icon-button subtle-icon" aria-label="Version history"><History size={15} /></button></div></div><div className="editor-note"><Code2 size={14} /><span>Your code stays yours. AI changes only appear as a reviewable diff.</span></div><div className="editor-area"><div className="line-numbers" aria-hidden="true">{Array.from({ length: Math.max(6, code.split("\n").length) }, (_, i) => <span key={i}>{String(i + 1).padStart(2, "0")}</span>)}</div><label className="sr-only" htmlFor="candidate-code">Your TypeScript implementation</label><textarea id="candidate-code" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} aria-describedby="editor-help" /><span id="editor-help" className="sr-only">Edit the code, or review the AI patch before applying a change.</span></div>
        <div className="editor-footer"><span><span className="footer-signal" /> LOCAL DRAFT</span><span>UTF-8 <i>·</i> LF <i>·</i> TypeScript</span></div>
        <section className="terminal-panel"><div className="terminal-head"><div><Terminal size={14} /><b>TEST OUTPUT</b><span className="terminal-tab">formatDuration.test.ts</span></div><ActionButton variant="quiet" onClick={() => { void runTests(); }} disabled={runningTests}><Play size={13} /> {runningTests ? "Running tests…" : "Run tests"}</ActionButton></div><div className="terminal-output" aria-live="polite">
          {runningTests ? (
            <>
              <span className="terminal-prompt">$</span>{" "}
              <span className="terminal-muted">Running isolated tests…</span>
            </>
          ) : !executionResult ? (
            <>
              <span className="terminal-prompt">$</span>{" "}
              <span className="terminal-muted">Ready. Run tests to check the boundary cases.</span>
              <br />
              <span className="terminal-muted">Expected: 0, 59, 60, 125, and -5 seconds</span>
            </>
          ) : (
            <>
              <span className={executionResult.status === "passed" ? "terminal-pass" : "terminal-fail"}>
                {executionResult.status === "passed"
                  ? `✓ ${executionResult.passed}/${executionResult.total} tests passed`
                  : executionResult.status === "timeout"
                    ? "× Execution timed out"
                    : executionResult.status === "error"
                      ? "× Execution error"
                      : `× ${executionResult.passed}/${executionResult.total} tests passed`}
              </span>
              <br />
              <span className="terminal-muted">Execution time: {executionResult.durationMs} ms</span>
              {executionResult.message && (
                <>
                  <br />
                  <span className="terminal-muted">{executionResult.message}</span>
                </>
              )}
              {executionResult.cases.map((item) => (
                <div key={`${item.input}-${item.expected}`}>
                  <span className={item.passed ? "terminal-pass" : "terminal-fail"}>
                    {item.passed ? "✓" : "×"}
                  </span>{" "}
                  <span className="terminal-muted">
                    {item.input}s · expected {JSON.stringify(item.expected)} · actual{" "}
                    {item.actual === undefined ? "no output" : JSON.stringify(item.actual)}
                    {item.error ? ` · ${item.error}` : ""}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </section>
      </section>
      <aside className="assistant-column"><div className="assistant-head"><div className="assistant-avatar"><WandSparkles size={17} /></div><div><b>ProofMode assistant</b><small>Demo response · no external model</small></div><span className="assistant-online" /></div><div className="assistant-mode-label"><Eyebrow color="cyan">CHOOSE A MODE</Eyebrow></div><div className="mode-list">{modes.map((item) => <button key={item} className={`mode-pill${mode === item ? " active" : ""}`} onClick={() => setMode(item)} type="button">{item}</button>)}</div><div className="assistant-thread" aria-live="polite">
        <div className="assistant-message"><span className="assistant-message-mark"><Sparkles size={13} /></span><div><p>Let’s make this helper clear at the edges. What would you like to explore?</p><small>PROOFMODE / SYSTEM</small></div></div>
        {messages.map((message, i) => <div key={i} className={`assistant-message ${message.role === "candidate" ? "candidate-message" : ""}`}><span className="assistant-message-mark">{message.role === "candidate" ? "YOU" : <Sparkles size={13} />}</span><div><p>{message.text}</p><small>{message.role === "candidate" ? "CANDIDATE PROMPT" : "SEEDED ASSISTANT"}</small></div></div>)}
        {patch === "pending" && <div className="patch-notice"><div className="patch-notice-top"><span className="patch-spark"><WandSparkles size={13} /></span><b>Suggestion ready</b><span className="new-tag">NEW</span></div><p>A formatter draft is ready. Review every changed line before you decide.</p><Link href="/assessment/review" className="patch-review-link">Review code diff <ArrowRight size={14} /></Link></div>}
      </div><div className="assistant-input"><label className="sr-only" htmlFor="assistant-prompt">Ask the assistant</label><textarea id="assistant-prompt" rows={2} placeholder="Ask about an edge case…" value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} /><button className="send-button" onClick={send} aria-label="Send prompt"><Send size={15} /></button><small>AI suggestions are visible before they change your code.</small></div></aside>
    </div>
    <footer className="workbench-bottom"><div><span className="evidence-tiny-dot" /> Evidence limited to this task <span className="bottom-sep">·</span> no screen or keystroke recording</div><div><Link href="/assessment/review" className="review-shortcut">Review suggestion <ArrowRight size={13} /></Link><Link href="/results" className="button button-primary submit-task" onClick={() => submit()}>Submit task <ArrowRight size={15} /></Link></div></footer>
  </main>;
}
