# ProofMode — Implementation Plan

## Product and scope

Build a polished, responsive frontend prototype for the IM-01 ProofMode hackathon demo. It will tell one complete candidate-to-reviewer story across six connected screens: landing page, candidate orientation, coding assessment workspace, AI patch review, candidate results, and recruiter evidence report. Seeded sample data and browser-local state will make the entire journey demonstrable without external APIs or a backend. The prototype will surface evidence and human review, not hiring decisions, candidate rankings, cheating allegations, or surveillance.

## Implementation approach

- Reuse the initialized React 19 + TypeScript + Vite project, Wouter routing, Lucide icons, and existing dark-mode capable starter. Serve it as a static frontend on the existing 3000 port using `pnpm dev:static`; no server or database is needed.
- Use explicit routes for `/`, `/orientation`, `/assessment`, `/assessment/review`, `/results`, and `/reviewer`. Shared demo state will preserve the candidate’s prompt, chosen patch action, test result, and context note across the flow; sensible seeded states will also make deeper screens directly viewable.
- Implement the landing hero illustration as a lazy-loaded React Three Fiber scene: a floating code editor, evidence cards, test indicators, and an AI signal orb, with restrained, pointer-controlled parallax. Provide a static CSS illustration fallback for reduced-motion preferences and unsupported devices. Keep scene decoration separate from essential labels and controls.
- Model the assessment around a realistic TypeScript task: implement a `formatDuration` helper with clear acceptance criteria. A seeded AI suggestion contains a visible, intentionally flawed diff; the candidate can inspect it, reject it, apply a corrected version, run tests, and submit. All code changes remain explicit and user-controlled. Assistant modes and responses are local demo content with a clear fallback label rather than a live model dependency.
- Give findings stable evidence references for prompt, diff, test output, and candidate explanation. Candidate and reviewer screens will distinguish correctness from process, show confidence and skill bands, and render an unavailable skill as **Not observed**, never zero. Provide an optional practice card and a context note separate from assessment findings.
- Build reusable components for navigation, buttons, panels/cards, tabs, badges, evidence links, skill/confidence indicators, code diffs, terminal output, assistant messages, practice cards, and an accessible evidence dialog.
- Use semantic landmarks, visible keyboard focus, readable contrast, labels, minimum 44px touch targets, responsive layouts, and reduced-motion support. Ensure the mobile workspace remains usable by reflowing task/editor/assistant sections instead of squeezing desktop columns.

## Design direction

- **Design Movement:** Premium cyberpunk product interface, inspired by precise instrument panels and holographic developer tooling rather than a generic admin dashboard.
- **Core Principles:** Evidence before inference; neon as a restrained signal; stable, legible assessment controls; candidate agency at each transition.
- **Color Philosophy:** Near-black and layered charcoal panels create focus and depth. Electric green marks the primary action and verified progress; cyan and magenta identify evidence and AI; pink-red is reserved for errors. Maintain readable text contrast instead of using neon as body copy.
- **Layout Paradigm:** An asymmetric editorial landing hero, followed by a linear three-stage narrative; immersive three-column desktop assessment; compact single-page reviewer report. Collapse panels into a purposeful mobile sequence.
- **Signature Elements:** Chamfered panel corners with fine technical rules; small evidence-ID chips and signal traces; a floating holographic code workspace in the hero.
- **Interaction Philosophy:** User-initiated actions, visible AI diffs, explicit apply/reject decisions, immediate test feedback, and evidence links that open their source context.
- **Animation:** Short, subtle glow/scan accents and low-amplitude scene parallax only. Disable motion under `prefers-reduced-motion`; no animation on scores, evidence, or critical text.
- **Typography System:** Futuristic display face for headings paired with a highly readable sans-serif for prose and a technical monospace for labels, code, and evidence IDs. Use restrained uppercase micro-labels and generous line-height for assessment content.
- **Brand Essence:** A coding assessment that makes the work behind an AI-assisted answer visible to candidates and human reviewers; **fair, exact, empowering**.
- **Brand Voice:** Direct, calm, and evidence-led. Examples: “Show the reasoning, not just the result.” “This skill wasn’t observed in this task.”
- **Wordmark & Logo:** A custom “PM” signal mark built from two angular brackets and a central proof-point glyph beside the ProofMode wordmark.
- **Signature Brand Color:** Electric green `#00ff88`.

## Project structure

- `client/src/App.tsx` — route map, shared shell, and screen-level composition.
- `client/src/pages/` — landing, orientation, assessment, patch-review, results, and reviewer screens.
- `client/src/components/proofmode/` — shared ProofMode navigation, controls, panels, code/evidence widgets, and dialogs.
- `client/src/components/proofmode/HeroScene.tsx` — lazy-loaded R3F hero scene with a static fallback.
- `client/src/contexts/DemoContext.tsx` — typed task, assistant, patch, test, result, and evidence seed data plus browser-session demo state and actions.
- `client/src/index.css` — reusable color/type/space/border/motion tokens, global accessibility styles, and responsive cyberpunk visual system.
- `client/public/manus-routes.json` — synchronized static declaration for all six application routes.
- `client/public/proofmode-logo.svg` and `app.config.ts` — custom product mark and platform project-logo metadata.
- `plan.md` — this agreed implementation and design plan.
- `TODO.md` — outcome-based requirements and delivery status, written after approval.

## Dependencies and serving

The existing project uses pinned `pnpm@10.18.0`; add `three` and `@react-three/fiber` only for the landing visual. Keep the existing lifecycle-script policy in `pnpm-workspace.yaml` unchanged unless a dependency requires a reviewed adjustment. Do not introduce hosted services, model credentials, persistence, or user accounts. Run the Vite static dev command on the configured port 3000, and include a static, source-derived route manifest before starting the dev server.
