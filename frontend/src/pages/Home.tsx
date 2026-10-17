import { ArrowRight } from "lucide-react";
import { BrandMark, ButtonLink } from "@/components/proofmode/ui";
import { flawedPatch } from "@/contexts/DemoContext";

// The line of the scripted suggestion that rounds 59 seconds up to "1 min".
const FLAWED_LINE = flawedPatch.split("\n")[1].trim();

function SampleCard() {
  return <figure className="pm-sample" aria-label="Illustration of a sample run" style={{ margin: 0 }}>
    <div className="pm-sample-head"><span className="pm-label">Sample task · formatDuration</span><span className="pm-micro">Illustration</span></div>
    <div className="pm-sample-body">
      <div>
        <p className="pm-label" style={{ margin: "0 0 var(--pm-s2)" }}>The assistant’s suggestion</p>
        <div className="pm-diff" role="img" aria-label="Diff line using Math.round, flagged as the flaw">
          <div className="pm-diff-line pm-diff-add pm-diff-flag"><i>2</i><i aria-hidden="true">+</i><span>{FLAWED_LINE}</span></div>
        </div>
      </div>
      <div>
        <p className="pm-label" style={{ margin: "0 0 var(--pm-s2)" }}>What the test run shows</p>
        <div className="pm-code" style={{ display: "grid" }}>
          <div className="pm-testline pm-testline-fail"><b>FAIL</b><span>59s · expected "59 sec" · actual "1 min"</span></div>
          <div className="pm-testline pm-testline-pass"><b>PASS</b><span>60s · expected "1 min" · actual "1 min"</span></div>
        </div>
      </div>
      <figcaption className="pm-micro">A flawed suggestion, the test that catches it, and the record a reviewer can open. <span className="pm-evref">EV-03</span></figcaption>
    </div>
  </figure>;
}

export default function Home() {
  return <main>
    <section className="pm-container pm-hero">
      <div className="pm-hero-copy">
        <span className="pm-label">A coding assessment for working with AI</span>
        <h1 className="pm-h-display">Did they check what the AI wrote?</h1>
        <p className="pm-prose pm-muted" style={{ fontSize: "1.125rem" }}>Candidates solve a small task with an assistant whose code suggestion hides a subtle bug. The report shows what they did about it, with the evidence behind every finding.</p>
        <div className="pm-hero-actions">
          <ButtonLink href="/orientation">Try the demo <ArrowRight size={16} aria-hidden="true" /></ButtonLink>
          <ButtonLink href="/reviewer" variant="quiet">See a reviewer report</ButtonLink>
        </div>
      </div>
      <SampleCard />
    </section>

    <section className="pm-container pm-band" id="how" aria-labelledby="how-title">
      <h2 className="pm-h1" id="how-title">How a session goes</h2>
      <ol className="pm-steps pm-trio" style={{ gridTemplateColumns: undefined }}>
        <li style={{ gridTemplateColumns: "2.25rem minmax(0, 1fr)" }}><div><b>Work with the assistant</b><p className="pm-muted">The candidate writes a small function and can ask the assistant for help, as they would on the job.</p></div></li>
        <li style={{ gridTemplateColumns: "2.25rem minmax(0, 1fr)" }}><div><b>Check what it suggests</b><p className="pm-muted">One suggestion is subtly wrong. The candidate reads the diff, runs the tests, and accepts, rejects or fixes it.</p></div></li>
        <li style={{ gridTemplateColumns: "2.25rem minmax(0, 1fr)" }}><div><b>Read the evidence</b><p className="pm-muted">The report lists what was done and what wasn’t seen, and links each finding to its record.</p></div></li>
      </ol>
    </section>

    <section className="pm-container pm-band" id="about" aria-labelledby="about-title">
      <h2 className="pm-h1" id="about-title">What the report does differently</h2>
      <div className="pm-trio">
        <article><h3 className="pm-h3">Every finding has a source</h3><p className="pm-muted">Open any finding to see the test run or patch decision it comes from.</p></article>
        <article><h3 className="pm-h3">Not observed is not zero</h3><p className="pm-muted">If a task gave no fair chance to show a skill, the report says so instead of scoring it.</p></article>
        <article><h3 className="pm-h3">Feedback the candidate can use</h3><p className="pm-muted">Candidates see their own results and one practice idea, not just a pass or fail.</p></article>
      </div>
    </section>

    <section className="pm-container" style={{ paddingBottom: "var(--pm-s7)" }}>
      <div className="pm-cta">
        <h2 className="pm-h1">Walk through a sample session</h2>
        <ButtonLink href="/orientation">Try the demo <ArrowRight size={16} aria-hidden="true" /></ButtonLink>
      </div>
    </section>

    <footer className="pm-container pm-sitefoot">
      <a href="/" className="pm-wordmark"><BrandMark small /><span>ProofMode</span></a>
      <span className="pm-micro">Hackathon prototype. The candidate is sample data and the assistant is scripted. Not a hiring decision system.</span>
    </footer>
  </main>;
}
