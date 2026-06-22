import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { generateClinicalCase } from './api'
import './App.css'

function MD({ children }) {
  return (
    <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>
      {String(children)}
    </ReactMarkdown>
  )
}

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
  'Obstetrics & Gynecology',
  'Surgery',
  'Pediatrics',
]

const CASE_SECTIONS = [
  { key: 'chief_complaint', label: 'Chief Complaint' },
  { key: 'history_of_present_illness', label: 'History of Present Illness' },
  { key: 'past_medical_history', label: 'Past Medical History' },
  { key: 'medications', label: 'Medications' },
  { key: 'allergies', label: 'Allergies' },
  { key: 'family_history', label: 'Family History' },
  { key: 'social_history', label: 'Social History' },
  { key: 'review_of_systems', label: 'Review of Systems' },
  { key: 'vital_signs', label: 'Vital Signs' },
  { key: 'physical_examination', label: 'Physical Examination' },
  { key: 'diagnostic_workup', label: 'Investigations / Diagnostic Workup' },
  { key: 'summary', label: 'Summary' },
  { key: 'differential_diagnosis', label: 'Differential Diagnosis' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'management_plan', label: 'Management Plan' },
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

function renderObjectList(obj) {
  return (
    <ul className="section-list">
      {Object.entries(obj).map(([k, v]) => (
        <li key={k}>
          <strong>{k}</strong>:{' '}
          {v !== null && typeof v === 'object' && !Array.isArray(v)
            ? renderObjectList(v)
            : typeof v === 'object' ? JSON.stringify(v) : <MD>{v}</MD>}
        </li>
      ))}
    </ul>
  )
}

function renderParagraphs(text) {
  return (
    <div className="section-content">
      {String(text)
        .split(/\n{2,}/)
        .map(para => para.trim())
        .filter(Boolean)
        .map((para, i) => (
          <p key={i} className="section-paragraph"><MD>{para}</MD></p>
        ))}
    </div>
  )
}

function renderSectionContent(value) {
  if (Array.isArray(value)) {
    return (
      <ul className="section-list">
        {value.map((item, i) => <li key={i}><MD>{item}</MD></li>)}
      </ul>
    )
  }
  if (value !== null && typeof value === 'object') {
    return renderObjectList(value)
  }
  if (typeof value === 'string') {
    return renderParagraphs(value)
  }
  return <p className="section-content">{JSON.stringify(value, null, 2)}</p>
}

function sectionModifier(key) {
  if (key === 'chief_complaint') return ' case-section--chief-complaint'
  if (key === 'diagnosis') return ' diagnosis-section'
  return ''
}

function CaseDisplay({ clinicalCase }) {
  return (
    <div className="case-display">
      <div className="case-toolbar">
        <button className="download-btn" onClick={() => window.print()}>
          ⬇ Download PDF
        </button>
      </div>
      {CASE_SECTIONS.map(({ key, label }) => (
        clinicalCase[key] == null ? null : (
          <div key={key} className={`case-section${sectionModifier(key)}`}>
            <span className="section-label">{label}</span>
            {renderSectionContent(clinicalCase[key])}
          </div>
        )
      ))}
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
      <main className="app-main">
        <header className="hero-card">
          <span className="hero-eyebrow">CLINICAL EDUCATION</span>
          <h1 className="hero-title"><span className="hero-title-accent">Clinical</span> Case Generator</h1>
          <p className="hero-subtitle">AI-generated clinical cases for diagnostic reasoning practice. Built for medical students.</p>
          <svg className="hero-ecg-accent" viewBox="0 0 800 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M0,20 L120,20 L130,18 L140,22 L150,5 L160,35 L170,15 L180,22 L200,20 L320,20 L330,18 L340,22 L350,5 L360,35 L370,15 L380,22 L400,20 L520,20 L530,18 L540,22 L550,5 L560,35 L570,15 L580,22 L600,20 L800,20" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </header>
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
