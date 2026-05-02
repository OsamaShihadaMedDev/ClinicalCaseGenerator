# Clinical Case Generator

**Live demo:** https://clinical-case-generator.vercel.app

An AI-powered clinical case generator for medical students. Pick a specialty, set the difficulty, optionally choose a focus area, and get a fully structured case — chief complaint, HPI, relevant history, exam findings, vitals, labs, and teaching points — with the diagnosis hidden until you're ready to reveal it.

Built to scratch my own itch as a final-year medical student. Generic study apps produce shallow cases that don't translate to real OSCE prep or differential reasoning practice. This one generates cases dense enough to actually study from, with clinically pivotal findings bolded so you can scan a case the way you'd scan a real chart.

## Features

- **13 specialties** including Internal Medicine subspecialties (Cardiology, Pulmonology, Neurology, GI, Endocrine, Nephrology, Heme, ID, Rheum), plus Emergency, OB/GYN, Surgery, and Pediatrics
- **Three difficulty levels** — Easy (textbook), Medium (realistic with distractors), Hard (red herrings, atypical features, subtle findings)
- **Optional focus area** input — narrow the case to specific topics (e.g. "EKG findings", "post-op complications", "2nd trimester bleeding")
- **Structured output** — every case returns the same shape: chief complaint, HPI, relevant history, ROS, vitals, physical exam (nested by body system), diagnostic workup, teaching points, diagnosis
- **Spoiler-safe reveal** — diagnosis is blurred until clicked; teaching points stay hidden until after reveal so they don't give the answer away
- **Clinically pivotal terms bolded** — symptoms, signs, abnormal vitals/labs, pertinent positives and negatives are highlighted so a student can scan the case like a real chart

## Tech stack

- **React + Vite** — single-page app, single-file component architecture (no premature splitting)
- **Google Gemini API** (`gemini-2.5-flash-lite`) for case generation with structured JSON output
- **react-markdown** for inline bolding of clinical terms
- **Vanilla CSS** with a custom design system (CSS variables, glassmorphism, aurora background)
- **Vercel** for deployment

## Design + engineering decisions

A few choices worth highlighting, because they're where the real thinking went:

**Defensive rendering for LLM output.** LLMs don't reliably return the exact JSON shape you ask for. Every section in the case display has a type-checked render path with a `JSON.stringify` fallback, so an unexpected nested structure never crashes the UI. Lesson: never trust the schema, always have a fallback.

**Structural fixes over prompt fixes.** Early versions had Teaching Points appearing alongside the case, which spoiled the diagnosis. The instinct was to add prompt instructions like "be careful not to hint at the diagnosis." That's probabilistic and brittle. The fix was structural — lift `revealed` state to the App component, gate Teaching Points behind it, and Gemini can write whatever it wants because the UI won't render it until the user reveals. Code-level fixes are deterministic; prompt-level fixes are probabilistic.

**Bold visibility on dark backgrounds.** Markdown bold rendered as `<strong>` initially looked the same as body text on the dark theme — relative weight perception means bold-next-to-regular reads as bold, but bold-on-dark with no color contrast just reads as regular. Fixed by giving `<strong>` a brighter color, not a heavier weight.

**Explicit category lists in the prompt.** Asking Gemini to "bold clinically pivotal terms" produced 1-2 bolded terms per paragraph. Replacing the vague guidance with an explicit category list (symptoms, signs, abnormal labs, PMH, medications, pertinent positives and negatives) plus a numeric target (4-8 bolded terms per paragraph) fixed it. Generic prompt instructions are useless; specific prompt instructions are deterministic.

**Glassmorphism + aurora design system.** Dark mode, sky-blue clinical accent, three static radial gradients for the aurora background, glass cards with translucent surfaces and inner highlights. Static rather than animated — performance and restraint. The hero card has an SVG ECG accent line as a visual signature; it's static rather than animated because moving ECG lines in medical UI are a cliché and signal "I want to look medical" rather than "I am a serious tool."

## Known limitations

- **The model can hallucinate diagnoses.** Gemini occasionally produces clinically inconsistent diagnoses or invents non-existent entities (e.g. conflating two real conditions into a fake one). A clinical-validation layer is the next planned addition — likely a self-check step or a validated diagnosis list per specialty.
- **The Gemini API key is exposed in the client bundle.** This is a known limitation of `VITE_*` env vars in client-side Vite apps. Acceptable for a portfolio demo, not for production. A backend proxy is the proper fix when this becomes a real product.
- **No mobile responsive testing yet.** Probably breaks at narrow widths.
- **No "generate new case" button.** You currently have to reclick the button.

## Running locally

```bash
git clone https://github.com/OsamaShihadaMedDev/ClinicalCaseGenerator.git
cd ClinicalCaseGenerator
npm install

Then:

npm run dev
```

## About

I'm a final-year medical student in Gaza, transitioning into AI app building. My thesis: most AI builders don't understand clinical workflows, and most clinicians don't build software. This project sits at that intersection — a study tool I'd actually use myself, built with the engineering discipline of a real product, not a tutorial demo.

This is project #2 in the series. Project #1: [Mini StudyBuddy](https://github.com/OsamaShihadaMedDev/Mini-studdybuddy).

```

Create a `.env` file in the project root with your Gemini API key:
