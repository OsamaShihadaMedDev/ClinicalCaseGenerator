// Vercel Serverless Function — runs on the server, never shipped to the browser.
// The OpenRouter key lives in OPENROUTER_API_KEY (no VITE_ prefix), so it stays
// server-side. The browser calls POST /api/generate-case instead of OpenRouter.

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Default to Claude Haiku 4.5 on OpenRouter. Override with OPENROUTER_MODEL
// (any slug from https://openrouter.ai/models) without touching code.
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5'

const DIFFICULTY_DESCRIPTIONS = {
  Easy: 'classic textbook presentation with clear, unambiguous findings',
  Medium: 'realistic presentation with some distractors and common atypical features',
  Hard: 'complex case with red herrings, atypical features, and subtle findings that require high clinical acumen',
}

function buildPrompt({ specialty, difficulty, focusArea }) {
  const focus = focusArea?.trim() || 'general'
  const difficultyDesc = DIFFICULTY_DESCRIPTIONS[difficulty] || difficulty

  return `You are a medical educator writing a formal long-case clinical examination workup for medical students to study and practice on.

Generate a realistic, detailed long case with the following parameters:
- Specialty: ${specialty}
- Difficulty: ${difficulty} — ${difficultyDesc}
- Focus area: ${focus}

Write it the way a student would present a complete long case on the wards: a thorough, structured workup that flows from presentation through examination, investigations, and a reasoned assessment and plan.

Return ONLY a valid JSON object with exactly these keys (no extra keys, no markdown fences):
{
  "chief_complaint": "identifying data + presenting complaint in one line, e.g. '62-year-old male with acute chest pain for 3 hours'",
  "history_of_present_illness": "detailed chronological narrative — see formatting rules below",
  "past_medical_history": "past medical and surgical history as prose",
  "medications": ["Drug name dose route frequency", "..."],
  "allergies": "drug/food/environmental allergies and the reaction, or 'NKDA'",
  "family_history": "relevant family history",
  "social_history": "smoking, alcohol, recreational drugs, occupation, living situation, functional status",
  "review_of_systems": "pertinent positives and negatives by system",
  "vital_signs": { "HR": "110 bpm", "BP": "145/92 mmHg", "RR": "20/min", "Temp": "38.2°C", "SpO2": "96%", "Weight": "78 kg" },
  "physical_examination": { "General": "...", "Cardiovascular": "...", "Neurologic": { "Mental Status": "...", "Cranial Nerves": "...", "Motor": "..." } },
  "diagnostic_workup": { "CBC": "...", "BMP": "...", "ECG": "..." },
  "summary": "a 2-4 sentence problem-representation/summary statement synthesizing the key features, the way a student opens their case presentation",
  "differential_diagnosis": ["**Most likely diagnosis** — one-line supporting/refuting reasoning", "**Next diagnosis** — reasoning", "..."],
  "diagnosis": "the single final/most-likely diagnosis",
  "management_plan": ["**Investigations**: ...", "**Treatment**: ...", "**Monitoring**: ...", "**Disposition**: ...", "**Patient education**: ..."],
  "teaching_points": ["first key learning point", "second key learning point", "third key learning point"]
}

Field rules:
- history_of_present_illness: write 2-4 paragraphs separated by a blank line (\\n\\n). Move chronologically — onset and circumstances, character/course/progression, associated symptoms, then pertinent negatives and relevant context (recent illnesses, exposures, prior episodes).
- medications, differential_diagnosis, management_plan, teaching_points: arrays of strings, one item each. Do not use numbered strings.
- vital_signs: an object with keys HR, BP, RR, Temp, SpO2, Weight and string values.
- physical_examination: an object keyed by body system. Values may be strings or nested objects when a system has natural subsections (e.g. Neurologic with Mental Status, Cranial Nerves, Motor, Sensory, Reflexes, Coordination).
- diagnostic_workup: an object keyed by test or study name (CBC, BMP, LFTs, ECG, Chest X-Ray, etc.) with string result values.
- differential_diagnosis: order most likely to least likely; the first item should align with the diagnosis field.

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

Aim for roughly 4-8 bolded terms per paragraph in HPI and the history sections. Be generous — a med student should be able to scan the case and pick out every clinically meaningful finding from the bolded terms alone.

Make the case clinically accurate and internally consistent. The presentation sections (chief_complaint, history_of_present_illness, past_medical_history, medications, allergies, family_history, social_history, review_of_systems, vital_signs, physical_examination, diagnostic_workup) must NOT name or explicitly hint at the diagnosis — present only the findings. The analytic sections (summary, differential_diagnosis, diagnosis, management_plan, teaching_points) may name and discuss the diagnosis freely.`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'Server is missing OPENROUTER_API_KEY' })
  }

  // Vercel parses JSON bodies automatically; fall back for other runtimes.
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const { specialty, difficulty, focusArea } = body

  if (!specialty || typeof specialty !== 'string') {
    return res.status(400).json({ error: 'specialty is required' })
  }
  if (!difficulty || typeof difficulty !== 'string') {
    return res.status(400).json({ error: 'difficulty is required' })
  }

  try {
    const orResponse = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        // Optional: used by OpenRouter for app-attribution / rankings.
        'HTTP-Referer': req.headers.origin || 'https://clinical-case-generator.vercel.app',
        'X-Title': 'Clinical Case Generator',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        messages: [{ role: 'user', content: buildPrompt({ specialty, difficulty, focusArea }) }],
        response_format: { type: 'json_object' },
      }),
    })

    if (!orResponse.ok) {
      const detail = await orResponse.text().catch(() => '')
      console.error('OpenRouter error', orResponse.status, detail)
      return res.status(502).json({ error: 'Upstream model request failed' })
    }

    const data = await orResponse.json()
    const text = data.choices?.[0]?.message?.content
    if (!text) {
      return res.status(502).json({ error: 'Model returned no content' })
    }

    // Strip ```json fences if the model wraps its output.
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    return res.status(200).json(JSON.parse(cleaned))
  } catch (err) {
    console.error('generate-case failed', err)
    return res.status(500).json({ error: 'Failed to generate case' })
  }
}
