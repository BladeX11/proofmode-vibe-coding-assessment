import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Eye, FileSearch, MoveUpRight, Sparkles } from "lucide-react";
import { ButtonLink, Eyebrow, SectionHeading, StatusBadge } from "@/components/proofmode/ui";
const HeroScene = lazy(() => import("@/components/proofmode/HeroScene"));

class HeroSceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function StaticHero() {
  return <div className="hero-art static-hero" role="img" aria-label="Illustration of an evidence-linked coding workspace">
    <div className="hero-art-grid" />
    <div className="hero-orb"><span /></div>
    <div className="hero-code-card">
      <div className="hero-code-head"><span className="window-dots"><i /><i /><i /></span><span>formatDuration.ts</span><span className="hero-live"><i />LIVE</span></div>
      <div className="hero-code-body"><div className="code-gutter">01<br/>02<br/>03<br/>04<br/>05<br/>06<br/>07<br/>08</div><div className="code-lines"><b>export function</b> <em>formatDuration</em>(sec) {'{'}<br/><span>const safe = Math.max(0, Math.floor(sec));</span><br/><span>if (safe &lt; 60) return <i>`${'{'}safe{'}'} sec`</i>;</span><br/><span>const min = Math.floor(safe / 60);</span><br/><span>const rem = safe % 60;</span><br/><span>return rem ? <i>`${'{'}min{'}'} min ${'{'}rem{'}'} sec`</i></span><br/><span className="indent">: <i>`${'{'}min{'}'} min`</i>;</span><br/>{'}'}</div></div>
      <div className="hero-test-row"><span><Check size={13} /> 4 / 4 checks passed</span><span className="hero-commit">+ 8 lines</span></div>
    </div>
    <div className="float-card float-evidence"><span className="float-icon"><Eye size={14} /></span><div><b>Evidence linked</b><small>EV-03 · Boundary test</small></div><span className="float-check"><Check size={12} /></span></div>
    <div className="float-card float-prompt"><span className="float-icon cyan"><FileSearch size={14} /></span><div><b>59s boundary</b><small>Candidate caught the flaw</small></div></div>
    <div className="hero-footprint"><span>SESSION / 04:32</span><span>● CAPTURE ACTIVE</span></div>
    <div className="hero-scan" />
  </div>;
}
function HeroVisual() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = document.createElement("canvas");
    const supported = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    setReady(!reduced && supported);
  }, []);
  return <div className="hero-visual-wrap">
    {ready ? <HeroSceneBoundary fallback={<StaticHero />}><Suspense fallback={<StaticHero />}><HeroScene /></Suspense></HeroSceneBoundary> : <StaticHero />}
    <span className="scene-caption"><Sparkles size={13} /> PROOF IN MOTION <span>·</span> 01 / 03</span>
  </div>;
}

export default function Home() {
  return <main className="home-page">
    <section className="hero-section page-shell">
      <div className="hero-copy">
        <Eyebrow>Evidence-first coding assessment</Eyebrow>
        <h1>Assess how engineers actually work.</h1>
        <p className="hero-subtitle">ProofMode captures the code, the decision path, the execution evidence, and the reviewer context behind each candidate submission.</p>
        <div className="hero-actions"><ButtonLink href="/orientation">Launch the demo <ArrowUpRight size={16} /></ButtonLink><a className="text-link" href="#how">See how it works <ArrowDown size={14} /></a></div>
        <div className="hero-proof"><StatusBadge>Evidence-linked</StatusBadge><span>Clearer signal. Fairer review.</span></div>
      </div>
      <HeroVisual />
      <div className="hero-index"><span>01</span><span className="index-line" /><span>04</span><span className="index-label">THE PROOF SERIES</span></div>
    </section>

    <section className="story-section page-shell" id="how">
      <div className="story-intro"><Eyebrow color="cyan">Why it exists</Eyebrow><h2>Make the work visible.</h2><p>Engineering teams need a signal that reflects how a candidate reasoned, built, and verified — not just a final answer.</p></div>
      <div className="steps-list">
        <article className="step-row"><span className="step-index">01</span><div className="step-glyph green-glyph"><Sparkles size={19} /></div><div className="step-text"><h3>Work with the tools you use</h3><p>Assess realistic engineering behavior with a structured task and visible review loop.</p></div><ArrowRight className="step-arrow" size={17} /></article>
        <article className="step-row"><span className="step-index">02</span><div className="step-glyph cyan-glyph"><Eye size={19} /></div><div className="step-text"><h3>Verify execution</h3><p>Check how the code behaves under the same conditions a reviewer would scrutinize.</p></div><ArrowRight className="step-arrow" size={17} /></article>
        <article className="step-row"><span className="step-index">03</span><div className="step-glyph magenta-glyph"><FileSearch size={19} /></div><div className="step-text"><h3>Review the evidence</h3><p>Turn the task into a compact, fair record that a hiring team or engineering manager can interpret.</p></div><ArrowRight className="step-arrow" size={17} /></article>
      </div>
    </section>

    <section className="features-section page-shell" id="about">
      <div className="features-heading"><SectionHeading label="Built for fair review" title="The answer is only part of the story." description="Every signal points back to the task, the evidence, and the review context so teams can judge accurately." tone="magenta" /><a className="text-link" href="/reviewer">See the reviewer view <MoveUpRight size={14} /></a></div>
      <div className="feature-grid">
        <article className="feature-card feature-evidence"><span className="feature-no">01 / Traceable</span><span className="feature-icon"><FileSearch size={18} /></span><h3>Evidence, not vibes.</h3><p>Each finding connects to the prompt, code diff, execution output, and reviewer context that supports it.</p><span className="feature-trace">Prompt + diff + output</span></article>
        <article className="feature-card feature-fair"><span className="feature-no">02 / Fair by default</span><span className="feature-icon"><Eye size={18} /></span><h3>Missing isn’t zero.</h3><p>If a task never gave someone a fair chance to show a skill, that stays clearly marked as not observed.</p><span className="not-observed-chip">Not observed</span></article>
        <article className="feature-card feature-practice"><span className="feature-no">03 / Candidate feedback</span><span className="feature-icon"><Sparkles size={18} /></span><h3>Keep learning forward.</h3><p>Leave with a practical next step, not a vague verdict.</p><span className="feature-practice-link">Next practice <ArrowUpRight size={12} /></span></article>
      </div>
    </section>

    <section className="bottom-cta page-shell"><div><Eyebrow>Built for real review</Eyebrow><h2>Turn software tasks into reliable evidence.</h2></div><ButtonLink href="/orientation">Launch the demo <ArrowUpRight size={16} /></ButtonLink></section>
    <footer className="site-footer page-shell"><a href="/" className="wordmark"><span className="brand-mark"><b>⟨</b><i>•</i><b>⟩</b></span><span>ProofMode</span></a><span>Evidence-first coding assessment platform.</span><a href="/reviewer">Reviewer report <ArrowUpRight size={13} /></a></footer>
  </main>;
}
