# Clinical Case Generator

An AI-powered tool that generates realistic clinical cases for medical students to practice diagnostic reasoning. Pick a specialty, set the difficulty, and get a fully structured case — chief complaint, history, exam findings, labs — with the diagnosis hidden until you're ready to reveal it.

Built to scratch my own itch as a final-year medical student. The cases generic study apps generate are shallow; I wanted something I could use for real OSCE prep and differential reasoning practice.

## Status

🚧 In active development. Currently scaffolding the project — UI and AI integration coming soon.

## Planned features

- Specialty selection (Internal Medicine, Surgery, Pediatrics, Emergency, OB/GYN, etc.)
- Difficulty levels matched to training stage (Year 3 student → resident-level)
- Optional focus areas (e.g., "post-op complications", "cardiology")
- Structured case output: chief complaint, HPI, PMH, exam, labs, imaging
- Hidden diagnosis with reveal button
- Teaching points and "generate similar case" for spaced practice

## Tech stack

- React + Vite
- Gemini API for case generation
- Custom Claude Skill for medical case structure (planned)
- Vanilla CSS

## Running locally

```bash
npm install
npm run dev
```

You'll need a Gemini API key. Create a `.env` file in the project root:

## About me

Final-year medical student in Gaza, building software at the intersection of medicine and AI. This is project #2 in an ongoing series — see [Mini StudyBuddy](https://github.com/OsamaShihadaMedDev/Mini-studdybuddy) for project #1.