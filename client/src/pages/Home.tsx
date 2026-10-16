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
        <Eyebrow>IM—01 / THE AI-ERA ASSESSMENT</Eyebrow>
        <h1 className="glitch-title" data-text="Prove how you think with AI.">Prove how you think <span>with AI.</span></h1>
        <p className="hero-subtitle">A coding assessment that makes the work behind the answer visible.</p>
        <div className="hero-actions"><ButtonLink href="/orientation">Launch the demo <ArrowUpRight size={16} /></ButtonLink><a className="text-link" href="#how">See how it works <ArrowDown size={14} /></a></div>
        <div className="hero-proof"><StatusBadge>Evidence-linked</StatusBadge><span>One task. A clearer signal.</span></div>
      </div>
      <HeroVisual />
      <div className="hero-index"><span>01</span><span className="index-line" /><span>04</span><span className="index-label">THE PROOF SERIES</span></div>
    </section>

    <section className="story-section page-shell" id="how">
      <div className="story-intro"><Eyebrow color="cyan">A BETTER SIGNAL, BY DESIGN</Eyebrow><h2>Show the work.<br/><span>Keep the human.</span></h2><p>AI is part of how people build now. The assessment should make judgment visible—not try to ban the tools.</p></div>
      <div className="steps-list">
        <article className="step-row"><span className="step-index">01</span><div className="step-glyph green-glyph"><Sparkles size={19} /></div><div className="step-text"><h3>Build with AI</h3><p>Work through a realistic task with the tools you actually use.</p></div><ArrowRight className="step-arrow" size={17} /></article>
        <article className="step-row"><span className="step-index">02</span><div className="step-glyph cyan-glyph"><Eye size={19} /></div><div className="step-text"><h3>Review and test</h3><p>See each suggestion before it touches your code. Verify what matters.</p></div><ArrowRight className="step-arrow" size={17} /></article>
        <article className="step-row"><span className="step-index">03</span><div className="step-glyph magenta-glyph"><FileSearch size={19} /></div><div className="step-text"><h3>Get evidence-backed feedback</h3><p>Reviewers see the work behind the outcome—never an automated verdict.</p></div><ArrowRight className="step-arrow" size={17} /></article>
      </div>
    </section>

    <section className="features-section page-shell" id="about">
      <div className="features-heading"><SectionHeading label="BUILT FOR A FAIRER READ" title="The answer is only part of the story." description="Every signal points back to the task. Every missing signal stays honestly missing." tone="magenta" /><a className="text-link" href="/reviewer">See the reviewer view <MoveUpRight size={14} /></a></div>
      <div className="feature-grid">
        <article className="feature-card feature-evidence"><span className="feature-no">01 / TRACEABLE</span><span className="feature-icon"><FileSearch size={18} /></span><h3>Evidence, not vibes.</h3><p>Findings connect to the prompt, code diff, test result, or explanation that supports them.</p><span className="feature-trace">EV-01 <i>—</i> EV-04</span></article>
        <article className="feature-card feature-fair"><span className="feature-no">02 / FAIR BY DEFAULT</span><span className="feature-icon"><Eye size={18} /></span><h3>Missing isn’t zero.</h3><p>If a task never gave someone a fair chance to show a skill, it stays “Not observed.”</p><span className="not-observed-chip">NOT OBSERVED <span>≠</span> 0</span></article>
        <article className="feature-card feature-practice"><span className="feature-no">03 / FOR THE CANDIDATE</span><span className="feature-icon"><Sparkles size={18} /></span><h3>Keep learning forward.</h3><p>Leave with one optional next practice—useful feedback, not a final label.</p><span className="feature-practice-link">NEXT PRACTICE <ArrowUpRight size={12} /></span></article>
      </div>
    </section>

    <section className="bottom-cta page-shell"><div><Eyebrow>YOUR PROCESS IS PART OF THE PROOF</Eyebrow><h2>Ready to make your work visible?</h2></div><ButtonLink href="/orientation">Launch the demo <ArrowUpRight size={16} /></ButtonLink></section>
    <footer className="site-footer page-shell"><a href="/" className="wordmark"><span className="brand-mark"><b>⟨</b><i>•</i><b>⟩</b></span><span>ProofMode</span></a><span>Hackathon prototype — not a hiring decision system.</span><a href="/reviewer">Reviewer report <ArrowUpRight size={13} /></a></footer>
  </main>;
}
