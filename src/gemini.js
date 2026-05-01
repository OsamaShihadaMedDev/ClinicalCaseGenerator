import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

const DIFFICULTY_DESCRIPTIONS = {
  Easy: 'classic textbook presentation with clear, unambiguous findings',
  Medium: 'realistic presentation with some distractors and common atypical features',
  Hard: 'complex case with red herrings, atypical features, and subtle findings that require high clinical acumen',
}

export async function generateClinicalCase({ specialty, difficulty, focusArea }) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: { responseMimeType: 'application/json' },
  })

  const focus = focusArea?.trim() || 'general'
  const difficultyDesc = DIFFICULTY_DESCRIPTIONS[difficulty] || difficulty

  const prompt = `You are a medical educator creating clinical cases for medical students.

Generate a realistic, detailed clinical case with the following parameters:
- Specialty: ${specialty}
- Difficulty: ${difficulty} — ${difficultyDesc}
- Focus area: ${focus}

Return ONLY a valid JSON object with exactly these keys (no extra keys, no markdown):
{
  "chief_complaint": "one sentence, e.g. '62-year-old male with acute chest pain'",
  "history_of_present_illness": "detailed narrative paragraph",
  "relevant_history": "past medical history, medications, allergies, social history, family history",
  "review_of_systems": "pertinent positives and negatives",
  "vital_signs": "HR, BP, RR, Temp, SpO2, Weight — use realistic values",
  "physical_examination": "organized by system, include pertinent positives and negatives",
  "diagnostic_workup": "lab values, imaging findings, ECG, other studies — present raw data only, no interpretation",
  "teaching_points": "2-4 key learning points about this case and diagnosis",
  "diagnosis": "the final diagnosis — this field will be hidden from the student until they choose to reveal it"
}

Make the case clinically accurate and internally consistent. Do not mention or hint at the diagnosis anywhere except the "diagnosis" field.`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  return JSON.parse(text)
}
