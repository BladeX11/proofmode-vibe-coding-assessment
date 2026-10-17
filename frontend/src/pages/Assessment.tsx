import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Clock3, FileCode2, Play, Send } from "lucide-react";
import { ActionButton, BrandMark } from "@/components/proofmode/ui";
import { useDemo, type AssistantMode, type ExecutionResult } from "@/contexts/DemoContext";

const modes: AssistantMode[] = ["Explain", "Plan", "Suggest code", "Explain a change", "Suggest a test"];
const SESSION_SECONDS = 18 * 60;

function runSummary(result: ExecutionResult): string {
  if (result.status === "timeout") return "The run timed out";
  if (result.status === "error") return "The run could not finish";
  return result.status === "passed" ? `All ${result.total} tests passed` : `${result.passed} of ${result.total} tests passed`;
}

export default function Assessment() {
  const { code, setCode, ask, messages, patch, executionResult, runningTests, runTests, submit } = useDemo();
  const [, navigate] = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mode, setMode] = useState<AssistantMode>("Explain");
  const [prompt, setPrompt] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const gutterRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async () => {
    if (submitting || runningTests) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submit();
      navigate("/results");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const start = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const remaining = Math.max(0, SESSION_SECONDS - elapsed);
  const clock = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const send = () => { ask(mode, prompt); setPrompt(""); };
  const lineCount = Math.max(8, code.split("\n").length);
  const testStatus = runningTests ? "Running…" : executionResult ? runSummary(executionResult) : "Not run yet";

  return <main className="pm-ws">
    <header className="pm-ws-bar">
      <Link href="/" className="pm-ws-brand"><BrandMark small /><span>ProofMode</span><small>Assessment workspace</small></Link>
      <div className="pm-ws-meta">
        <span className="pm-micro">Prompts stay in this tab. Test runs save your code.</span>
        <span className="pm-ws-timer" role="timer" aria-label="Time remaining"><Clock3 size={15} aria-hidden="true" /> {clock}</span>
        <Link href="/orientation" className="pm-btn pm-btn-quiet">Exit task</Link>
      </div>
    </header>

    <div className="pm-ws-grid">
      <aside className="pm-ws-col pm-ws-task" aria-label="Task">
        <span className="pm-micro">Task TS-014</span>
        <h1>Format a duration for an activity feed</h1>
        <p>Write <code className="pm-evref">formatDuration(seconds)</code> in TypeScript.</p>
        <h2>Acceptance criteria</h2>
        <ul className="pm-ws-criteria">
          <li>Under a minute: whole seconds</li>
          <li>Whole minutes: no remainder shown</li>
          <li>Longer durations: minutes and seconds</li>
          <li>Negative input: treat as zero</li>
        </ul>
        <p className="pm-ws-callout"><strong>Hint</strong>Try values around 60 seconds. One second can change the output.</p>
        <div className="pm-ws-status"><span className="pm-label">Tests</span><strong aria-live="polite">{testStatus}</strong></div>
      </aside>

      <section className="pm-ws-col pm-ws-editor" aria-label="Code and tests">
        <div className="pm-ws-filebar">
          <span className="pm-ws-file"><FileCode2 size={15} aria-hidden="true" /> formatDuration.ts</span>
          <span className="pm-micro">Draft kept in this browser tab</span>
        </div>
        <p className="pm-label" style={{ margin: 0 }}>Your code stays yours. Assistant changes only appear as a diff you can accept or reject.</p>
        <div className="pm-ws-editorbox">
          <div className="pm-ws-gutter" ref={gutterRef} aria-hidden="true">{Array.from({ length: lineCount }, (_, i) => i + 1).join("\n")}</div>
          <label className="sr-only" htmlFor="candidate-code">Your TypeScript implementation</label>
          <textarea id="candidate-code" spellCheck={false} wrap="off" value={code} disabled={submitting} onChange={(e) => setCode(e.target.value)} onScroll={(e) => { if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop; }} aria-describedby="editor-help" />
          <span id="editor-help" className="sr-only">Edit the code, or review the assistant’s suggestion before applying a change.</span>
        </div>

        <div className="pm-code pm-ws-tests">
          <div className="pm-ws-tests-head">
            <b>Test output <span className="pm-code-muted" style={{ fontFamily: "var(--pm-font-mono)", fontWeight: 400 }}>formatDuration.test.ts</span></b>
            <ActionButton variant="quiet" onClick={() => { void runTests(); }} disabled={runningTests}><Play size={14} aria-hidden="true" /> {runningTests ? "Running tests…" : "Run tests"}</ActionButton>
          </div>
          <div className="pm-ws-tests-out" aria-live="polite">
            {runningTests ? <span className="pm-code-muted">Running the tests in an isolated sandbox…</span>
              : !executionResult ? <span className="pm-code-muted">Not run yet. The tests check 0, 59, 60, 125 and -5 seconds.</span>
              : <>
                <div className="pm-ws-tests-sum">{runSummary(executionResult)} <span className="pm-code-muted" style={{ fontWeight: 400 }}>· {executionResult.durationMs} ms</span></div>
                {executionResult.message && <div className="pm-code-muted">{executionResult.message}</div>}
                {executionResult.cases.map((item) => <div key={`${item.input}-${item.expected}`} className={`pm-testline ${item.passed ? "pm-testline-pass" : "pm-testline-fail"}`}>
                  <b>{item.passed ? "PASS" : "FAIL"}</b>
                  <span>{item.input}s · expected {JSON.stringify(item.expected)} · actual {item.actual === undefined ? "no output" : JSON.stringify(item.actual)}{item.error ? ` · ${item.error}` : ""}</span>
                </div>)}
              </>}
          </div>
        </div>
      </section>

      <aside className="pm-ws-col pm-ws-assistant" aria-label="Assistant">
        <div className="pm-ws-assistant-head">
          <strong>Assistant</strong>
          <span className="pm-micro">Scripted replies. No external model is called.</span>
        </div>
        <div className="pm-ws-modes" role="group" aria-label="Assistant mode">
          {modes.map((item) => <button key={item} className="pm-ws-mode" aria-pressed={mode === item} onClick={() => setMode(item)} type="button">{item}</button>)}
        </div>
        <div className="pm-ws-thread" aria-live="polite">
          <div className="pm-ws-msg"><span className="pm-label">Assistant</span><p>Let’s make this helper clear at the edges. What would you like to look at?</p></div>
          {messages.map((message, i) => <div key={i} className={`pm-ws-msg${message.role === "candidate" ? " pm-ws-msg-you" : ""}`}>
            <span className="pm-label">{message.role === "candidate" ? "You" : "Assistant (scripted)"}</span><p>{message.text}</p>
          </div>)}
          {patch === "pending" && <div className="pm-ws-patch">
            <strong>A suggested change is ready</strong>
            <p>Read every changed line before you decide.</p>
            <Link href="/assessment/review" className="pm-btn pm-btn-secondary">Review the diff <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>}
        </div>
        <div className="pm-ws-input">
          <label className="pm-label" htmlFor="assistant-prompt">Ask the assistant</label>
          <div className="pm-ws-input-row">
            <textarea id="assistant-prompt" className="pm-field" rows={2} placeholder="Ask about an edge case" value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
            <button className="pm-btn pm-btn-primary pm-btn-icon" onClick={send} aria-label="Send prompt" type="button"><Send size={16} aria-hidden="true" /></button>
          </div>
          <span className="pm-micro">Suggestions never change your code until you accept them.</span>
        </div>
      </aside>
    </div>

    {submitError && <p className="pm-ws-error" role="alert">{submitError}</p>}
    <footer className="pm-ws-foot">
      <span className="pm-micro">Evidence is limited to this task. No screen or keystroke recording.</span>
      <div className="pm-ws-foot-actions">
        <Link href="/assessment/review" className="pm-btn pm-btn-quiet">Review suggestion</Link>
        <button className="pm-btn pm-btn-primary" type="button" onClick={() => { void handleSubmit(); }} disabled={submitting || runningTests}>{submitting ? "Submitting…" : "Submit task"} <ArrowRight size={16} aria-hidden="true" /></button>
      </div>
    </footer>
  </main>;
}
