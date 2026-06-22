// Thin browser client. No API key here — it calls our own serverless function
// at /api/generate-case, which holds the OpenRouter key server-side.

export async function generateClinicalCase({ specialty, difficulty, focusArea }) {
  const response = await fetch('/api/generate-case', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ specialty, difficulty, focusArea }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || `Request failed (${response.status})`)
  }

  return response.json()
}
