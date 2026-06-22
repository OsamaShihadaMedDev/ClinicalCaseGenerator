# Clinical Case Generator

**Live demo:** https://clinical-case-generator.vercel.app

An AI-powered clinical case generator for medical students. Pick a specialty, set the difficulty, optionally choose a focus area, and get a full, formal long case — chief complaint, HPI, past/drug/family/social history, review of systems, vitals, exam, investigations, summary, differential, diagnosis, management plan, and teaching points — structured the way you'd present one on the wards, and exportable to PDF.

Built to scratch my own itch as a final-year medical student. Generic study apps produce shallow cases that don't translate to real OSCE prep or differential reasoning practice. This one generates cases dense enough to actually study from, with clinically pivotal findings bolded so you can scan a case the way you'd scan a real chart.

## Features

- **13 specialties** including Internal Medicine subspecialties (Cardiology, Pulmonology, Neurology, GI, Endocrine, Nephrology, Heme, ID, Rheum), plus Emergency, OB/GYN, Surgery, and Pediatrics
- **Three difficulty levels** — Easy (textbook), Medium (realistic with distractors), Hard (red herrings, atypical features, subtle findings)
- **Optional focus area** input — narrow the case to specific topics (e.g. "EKG findings", "post-op complications", "2nd trimester bleeding")
- **Formal long-case structure** — every case follows the shape a student presents on the wards: chief complaint, multi-paragraph HPI, past medical / drug / allergy / family / social history, review of systems, vitals, physical exam (nested by body system), investigations, summary, differential diagnosis, diagnosis, management plan, and teaching points
- **Clinically pivotal terms bolded** — symptoms, signs, abnormal vitals/labs, pertinent positives and negatives are highlighted so a student can scan the case like a real chart
- **Export to PDF** — one click prints the case to a clean, light-themed document (native browser print, selectable text)

## Tech stack

- **React + Vite** — single-page app, single-file component architecture (no premature splitting)
- **Vercel Serverless Function** (`/api/generate-case`) — proxies the model API so the key stays server-side, never in the browser bundle
- **OpenRouter API** for case generation, defaulting to **Claude Haiku 4.5** (model-agnostic — any OpenRouter model via `OPENROUTER_MODEL`)
- **react-markdown** for inline bolding of clinical terms
- **Vanilla CSS** with a custom design system (CSS variables, glassmorphism, aurora background) plus a print stylesheet for PDF export
- **Vercel** for deployment

## Design + engineering decisions

A few choices worth highlighting, because they're where the real thinking went:

**Defensive rendering for LLM output.** LLMs don't reliably return the exact JSON shape you ask for. The case display renders each section by value type (paragraphs, lists, key/value) with a `JSON.stringify` fallback, so an unexpected nested structure never crashes the UI. Lesson: never trust the schema, always have a fallback.

**Keep the API key off the client.** The first version read the key from a `VITE_*` env var, which Vite bakes straight into the browser bundle — anyone could extract it. The fix was structural, not a patch: a Vercel serverless function (`/api/generate-case`) holds the key and proxies the request, and the browser only ever talks to our own endpoint. A dev-only Vite plugin runs that same handler in-process so local `npm run dev` works without a separate backend. Secrets belong on the server, full stop.

**Bold visibility on dark backgrounds.** Markdown bold rendered as `<strong>` initially looked the same as body text on the dark theme — relative weight perception means bold-next-to-regular reads as bold, but bold-on-dark with no color contrast just reads as regular. Fixed by giving `<strong>` a brighter color, not a heavier weight.

**Explicit category lists in the prompt.** Asking the model to "bold clinically pivotal terms" produced 1-2 bolded terms per paragraph. Replacing the vague guidance with an explicit category list (symptoms, signs, abnormal labs, PMH, medications, pertinent positives and negatives) plus a numeric target (4-8 bolded terms per paragraph) fixed it. Generic prompt instructions are useless; specific prompt instructions are deterministic.

**Glassmorphism + aurora design system.** Dark mode, sky-blue clinical accent, three static radial gradients for the aurora background, glass cards with translucent surfaces and inner highlights. Static rather than animated — performance and restraint. The hero card has an SVG ECG accent line as a visual signature; it's static rather than animated because moving ECG lines in medical UI are a cliché and signal "I want to look medical" rather than "I am a serious tool."

## Known limitations

- **The model can hallucinate diagnoses.** It occasionally produces clinically inconsistent diagnoses or invents non-existent entities (e.g. conflating two real conditions into a fake one). A clinical-validation layer is the next planned addition — likely a self-check step or a validated diagnosis list per specialty.
- **The `/api` endpoint is public and unauthenticated.** The key is safe server-side, but anyone could call the endpoint and spend credits. Mitigated for now with a hard credit limit on the OpenRouter key; per-IP rate limiting is the next step.
- **No mobile responsive testing yet.** Probably breaks at narrow widths.

## Running locally

```bash
git clone https://github.com/OsamaShihadaMedDev/ClinicalCaseGenerator.git
cd ClinicalCaseGenerator
npm install
npm run dev
```

A dev-only Vite plugin runs the serverless handler in-process, so `npm run dev` serves both the app and `/api/generate-case` on `localhost:5173` — no Vercel CLI needed. (You can still run `vercel dev` if you want full production parity.)

You'll need an OpenRouter API key (https://openrouter.ai/keys). Create a `.env` file in the project root — these are **server-side** vars (no `VITE_` prefix), so they're never shipped to the browser:

```bash
OPENROUTER_API_KEY=sk-or-your-key-here
# Optional — defaults to anthropic/claude-haiku-4.5
OPENROUTER_MODEL=anthropic/claude-haiku-4.5
```

## Deploying

On Vercel, set the same variables under **Project → Settings → Environment Variables** (`OPENROUTER_API_KEY`, optionally `OPENROUTER_MODEL`). The `/api` folder is auto-deployed as a serverless function; no extra config needed.

## About

I'm a final-year medical student in Gaza, transitioning into AI app building. My thesis: most AI builders don't understand clinical workflows, and most clinicians don't build software. This project sits at that intersection — a study tool I'd actually use myself, built with the engineering discipline of a real product, not a tutorial demo.

This is project #2 in the series. Project #1: [Mini StudyBuddy](https://github.com/OsamaShihadaMedDev/Mini-studdybuddy).
