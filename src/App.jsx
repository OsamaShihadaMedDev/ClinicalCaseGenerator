import { useState } from 'react'
import { generateClinicalCase } from './gemini'
import './App.css'

const SPECIALTIES = [
  'Cardiology',
  'Pulmonology',
  'Neurology',
  'Gastroenterology',
  'Endocrinology',
  'Nephrology',
  'Hematology',
  'Infectious Disease',
  'Rheumatology',
  'Emergency Medicine',
]

const CASE_SECTIONS = [
  { key: 'chief_complaint', label: 'Chief Complaint' },
  { key: 'history_of_present_illness', label: 'History of Present Illness' },
  { key: 'relevant_history', label: 'Relevant History' },
  { key: 'review_of_systems', label: 'Review of Systems' },
  { key: 'vital_signs', label: 'Vital Signs' },
  { key: 'physical_examination', label: 'Physical Examination' },
  { key: 'diagnostic_workup', label: 'Diagnostic Workup' },
  { key: 'teaching_points', label: 'Teaching Points' },
]

function CaseForm({ specialty, setSpecialty, difficulty, setDifficulty, focusArea, setFocusArea, onGenerate, isLoading }) {
  return (
    <div className="form-card">
      <div className="form-row">
        <label className="form-field">
          <span className="field-label">Specialty</span>
          <select value={specialty} onChange={e => setSpecialty(e.target.value)}>
            {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="form-field">
          <span className="field-label">Difficulty</span>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </label>
      </div>
      <label className="form-field form-field--full">
        <span className="field-label">
          Focus Area <span className="field-optional">(optional)</span>
        </span>
        <input
          type="text"
          value={focusArea}
          onChange={e => setFocusArea(e.target.value)}
          placeholder="e.g. EKG findings, drug interactions, physical exam…"
        />
      </label>
      <button className="generate-btn" onClick={onGenerate} disabled={isLoading}>
        {isLoading ? <><span className="spinner" />Generating…</> : 'Generate Case'}
      </button>
    </div>
  )
}

function DiagnosisReveal({ diagnosis }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="case-section diagnosis-section">
      <span className="section-label">
        {revealed ? 'Diagnosis' : 'Diagnosis — click to reveal'}
      </span>
      <p
        className={`diagnosis-text${revealed ? ' diagnosis-text--revealed' : ''}`}
        onClick={() => !revealed && setRevealed(true)}
      >
        {diagnosis}
      </p>
    </div>
  )
}

function CaseDisplay({ clinicalCase }) {
  return (
    <div className="case-display">
      {CASE_SECTIONS.map(({ key, label }) => (
        <div key={key} className="case-section">
          <span className="section-label">{label}</span>
         <p className="section-content">
          {typeof clinicalCase[key] === 'string' 
             ? clinicalCase[key] 
           : JSON.stringify(clinicalCase[key], null, 2)}
        </p>
        </div>
      ))}
      <DiagnosisReveal diagnosis={clinicalCase.diagnosis} />
    </div>
  )
}

function App() {
  const [specialty, setSpecialty] = useState('Cardiology')
  const [difficulty, setDifficulty] = useState('Medium')
  const [focusArea, setFocusArea] = useState('')
  const [clinicalCase, setClinicalCase] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleGenerate() {
    setIsLoading(true)
    setError(null)
    setClinicalCase(null)
    try {
      const result = await generateClinicalCase({ specialty, difficulty, focusArea })
      setClinicalCase(result)
    } catch (err) {
      setError(err.message || 'Failed to generate case. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Clinical Case Generator</h1>
        <p className="app-subtitle">Generate realistic clinical cases for diagnostic practice.</p>
      </header>
      <main className="app-main">
        <CaseForm
          specialty={specialty}
          setSpecialty={setSpecialty}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          focusArea={focusArea}
          setFocusArea={setFocusArea}
          onGenerate={handleGenerate}
          isLoading={isLoading}
        />
        {error && <div className="error-card">{error}</div>}
        {clinicalCase && <CaseDisplay clinicalCase={clinicalCase} />}
      </main>
    </div>
  )
}

export default App
