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
  "vital_signs": { "HR": "110 bpm", "BP": "145/92 mmHg", "RR": "20/min", "Temp": "38.2°C", "SpO2": "96%", "Weight": "78 kg" },
  "physical_examination": { "General": "...", "Cardiovascular": "...", "Neurologic": { "Mental Status": "...", "Cranial Nerves": "...", "Motor": "..." } },
  "diagnostic_workup": { "CBC": "...", "BMP": "...", "ECG": "..." },
  "teaching_points": ["first key learning point", "second key learning point", "third key learning point"],
  "diagnosis": "the final diagnosis — this field will be hidden from the student until they choose to reveal it"
}

For vital_signs: use an object with keys HR, BP, RR, Temp, SpO2, Weight and string values.
For physical_examination: use an object keyed by body system. Values may be strings or nested objects when a system has natural subsections (e.g. Neurologic with Mental Status, Cranial Nerves, Motor, Sensory, Reflexes, Coordination).
For diagnostic_workup: use an object keyed by test or study name (CBC, BMP, LFTs, ECG, Chest X-Ray, etc.) with string result values.
For teaching_points: use an array of strings, one per teaching point. Do not use a numbered string.

Wrap clinically pivotal terms in markdown bold (**term**). Bold ALL of the following when they appear:
- Every symptom relevant to the differential (e.g., polydipsia, polyuria, weight loss, blurred vision, dyspnea, chest pain, headache, tingling)
- Every key sign on physical exam (e.g., tachycardia, tachypnea, hypotension, edema, pallor, jaundice, focal weakness)
- Every abnormal vital or lab value (and its qualifier like 'elevated' or 'low')
- Every relevant past medical history item (e.g., diabetes, hypertension, GDM, prior MI)
- Every relevant medication (especially ones tied to the differential)
- Every pertinent positive AND pertinent negative the student should notice
- Pivotal diagnostic findings (e.g., 'opaque yellow synovial fluid,' 'ST elevation,' 'positive nitrites')

Do NOT bold:
- Connecting prose, articles, prepositions, common verbs
- Generic descriptive language ('appears comfortable,' 'no acute distress')
- Demographic info already in the chief complaint (age, sex)
- The diagnosis itself in the diagnosis field

Aim for roughly 4-8 bolded terms per paragraph in HPI and Relevant History. Be generous — a med student should be able to scan the case and pick out every clinically meaningful finding from the bolded terms alone.

Make the case clinically accurate and internally consistent. Do not mention or hint at the diagnosis anywhere except the "diagnosis" field.`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  return JSON.parse(text)
}
