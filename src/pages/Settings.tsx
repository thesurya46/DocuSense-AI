import { useState, useEffect } from 'react'
import { toast } from '../components/Toast'
import { storage } from '../lib/storage'

interface SettingsProps {
  onApiKeySaved?: () => void
}

function SettingRow({ label, description, children }: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--color-text)', marginBottom: 2 }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: 'var(--color-text-3)', lineHeight: 1.5, maxWidth: 380 }}>{description}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginTop: 28, marginBottom: 4, paddingBottom: 10, borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{sub}</div>}
    </div>
  )
}

function StyledSelect({ value, options, onChange }: { value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{
      background: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)',
      borderRadius: 6, padding: '6px 28px 6px 10px', color: 'var(--color-text)', fontSize: 12.5,
      fontFamily: 'var(--font-mono)', cursor: 'pointer', outline: 'none', minWidth: 220,
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
    }}
      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-cyan)66')}
      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-strong)')}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function NumberInput({ value, min, max, step, onChange }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(parseFloat(e.target.value))} style={{
      background: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)',
      borderRadius: 6, padding: '6px 10px', color: 'var(--color-text)', fontSize: 12.5,
      fontFamily: 'var(--font-mono)', outline: 'none', width: 100, textAlign: 'right',
    }}
      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-cyan)66')}
      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-strong)')}
    />
  )
}

export default function Settings({ onApiKeySaved: _onApiKeySaved }: SettingsProps) {
  const [llmModel, setLlmModel] = useState('gpt-4o-mini')
  const [embeddingModel, setEmbeddingModel] = useState('text-embedding-3-small')
  const [chunkSize, setChunkSize] = useState(500)
  const [chunkOverlap, setChunkOverlap] = useState(50)
  const [topK, setTopK] = useState(5)
  const [similarityThreshold, setSimilarityThreshold] = useState(0.70)
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(25)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const s = storage.getSettings()
    setLlmModel(s.llmModel)
    setEmbeddingModel(s.embeddingModel)
    setChunkSize(s.chunkSize)
    setChunkOverlap(s.chunkOverlap)
    setTopK(s.topK)
    setSimilarityThreshold(s.similarityThreshold)
    setMaxFileSizeMb(s.maxFileSizeMb)
  }, [])

  const handleSave = () => {
    storage.saveSettings({ apiKey: '', llmModel, embeddingModel, chunkSize, chunkOverlap, topK, similarityThreshold, maxFileSizeMb })
    setSaved(true)
    toast('Configuration saved', 'success')
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="page-shell animate-fade-in" style={{ maxWidth: 820 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Pipeline configuration · model selection · retrieval tuning</p>
      </div>

      {/* Server-side API key notice */}
      <div style={{ background: 'var(--color-cyan-dim)', border: '1px solid var(--color-cyan)33', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
          <path d="M9 1a8 8 0 100 16A8 8 0 009 1zm0 4v4m0 3.5v.5" stroke="var(--color-cyan)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-cyan)', marginBottom: 2 }}>OpenAI API key is server-side</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-2)', lineHeight: 1.5 }}>
            Your <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,196,255,0.1)', padding: '1px 5px', borderRadius: 3 }}>OPENAI_API_KEY</code> is stored securely as a Supabase Edge Function secret — never exposed to the browser.
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '0 24px 4px', boxShadow: 'var(--shadow-card)' }}>

        <SectionHeader title="LLM Provider" sub="Language model used for grounded answer generation" />
        <SettingRow label="Model" description="OpenAI chat model. gpt-4o-mini offers the best cost/quality balance.">
          <StyledSelect value={llmModel} onChange={setLlmModel} options={[
            { value: 'gpt-4o-mini', label: 'gpt-4o-mini  (recommended)' },
            { value: 'gpt-4o', label: 'gpt-4o' },
            { value: 'gpt-4-turbo', label: 'gpt-4-turbo' },
            { value: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo' },
          ]} />
        </SettingRow>

        <SectionHeader title="Embeddings" sub="Model used server-side to convert text into vector representations" />
        <SettingRow label="Model" description="text-embedding-3-small: 1536-dim, best quality. ada-002: legacy, lower cost.">
          <StyledSelect value={embeddingModel} onChange={setEmbeddingModel} options={[
            { value: 'text-embedding-3-small', label: 'text-embedding-3-small (recommended)' },
            { value: 'text-embedding-3-large', label: 'text-embedding-3-large' },
            { value: 'text-embedding-ada-002', label: 'text-embedding-ada-002 (legacy)' },
          ]} />
        </SettingRow>

        <SectionHeader title="Chunking" sub="Controls how documents are split before indexing" />
        <SettingRow label="Chunk size (tokens)" description="Smaller = precise retrieval. Larger = more context per chunk. Applies on next upload.">
          <NumberInput value={chunkSize} min={100} max={2000} step={50} onChange={setChunkSize} />
        </SettingRow>
        <SettingRow label="Chunk overlap (tokens)" description="Tokens shared between adjacent chunks to prevent evidence split across a boundary.">
          <NumberInput value={chunkOverlap} min={0} max={200} step={10} onChange={setChunkOverlap} />
        </SettingRow>

        <SectionHeader title="Retrieval" sub="Vector search and similarity-filter behaviour" />
        <SettingRow label="Top-K" description="Candidate chunks retrieved before similarity filtering.">
          <NumberInput value={topK} min={1} max={20} step={1} onChange={setTopK} />
        </SettingRow>
        <SettingRow label="Similarity threshold" description="Chunks below this cosine similarity are excluded — prevents weak matches reaching the LLM.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="range" min={0.3} max={0.99} step={0.01} value={similarityThreshold} onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))} style={{ width: 120, accentColor: 'var(--color-cyan)' }} />
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)', minWidth: 40 }}>{similarityThreshold.toFixed(2)}</span>
          </div>
        </SettingRow>

        <SectionHeader title="Upload Limits" />
        <SettingRow label="Max file size" description="Uploads exceeding this limit are rejected before processing.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NumberInput value={maxFileSizeMb} min={1} max={100} step={1} onChange={setMaxFileSizeMb} />
            <span style={{ fontSize: 12.5, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>MB</span>
          </div>
        </SettingRow>

        <div style={{ padding: '16px 0 8px' }} />
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} style={{ padding: '10px 24px', borderRadius: 7, border: 'none', background: saved ? 'var(--color-success)' : 'var(--color-cyan)', color: '#070809', fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-sans)', cursor: 'pointer', transition: 'all 0.2s' }}>
          {saved ? '✓ Saved' : 'Save configuration'}
        </button>
      </div>
    </div>
  )
}
