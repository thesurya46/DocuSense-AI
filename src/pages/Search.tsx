import { useState } from 'react'
import type { Document, SearchResult } from '../types'
import { semanticSearch } from '../lib/supabase'
import { toast } from '../components/Toast'

interface SearchProps {
  documents: Document[]
}

function ScoreMeter({ score }: { score: number }) {
  const color = score >= 0.85 ? 'var(--color-success)' : score >= 0.7 ? 'var(--color-warning)' : 'var(--color-danger)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 64, height: 4, background: 'var(--color-surface-3)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.round(score * 100)}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color }}>{score.toFixed(3)}</span>
    </div>
  )
}

const TYPE_COLORS: Record<string, string> = {
  pdf: '#ef4444', docx: '#3b82f6', txt: '#6b7280', md: '#a78bfa',
}

function ResultCard({ result, rank }: { result: SearchResult; rank: number }) {
  const [expanded, setExpanded] = useState(false)
  const ext = result.document_name.split('.').pop()?.toLowerCase() ?? 'txt'
  const color = TYPE_COLORS[ext] ?? '#6b7280'

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', marginBottom: 10, transition: 'border-color 0.15s' }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border-strong)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)')}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px' }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: rank === 1 ? 'var(--color-cyan-dim)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: rank === 1 ? 'var(--color-cyan)' : 'var(--color-text-3)', flexShrink: 0, marginTop: 2 }}>
          {rank}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, color, background: color + '1a', padding: '1px 6px', borderRadius: 3, textTransform: 'uppercase' }}>{ext}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{result.document_name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <ScoreMeter score={result.score} />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>p.{result.page}</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>{result.chunk_id}</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.65, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: expanded ? 100 : 2, WebkitBoxOrient: 'vertical', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
            {result.text}
          </p>
          {result.text.length > 120 && (
            <button onClick={() => setExpanded(!expanded)} style={{ marginTop: 4, fontSize: 11.5, color: 'var(--color-cyan)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-sans)' }}>
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Search({ documents }: SearchProps) {
  const [query, setQuery] = useState('')
  const [threshold, setThreshold] = useState(0.7)
  const [topK, setTopK] = useState(5)
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)

  const indexedDocs = documents.filter((d) => d.status === 'indexed')

  const doSearch = async () => {
    if (!query.trim()) return

    setSearching(true)
    setResults(null)

    try {
      const searchResults = await semanticSearch({
        query: query.trim(),
        documentIds: selectedDocIds.length ? selectedDocIds : undefined,
        topK,
        similarityThreshold: threshold,
      })
      // keep only results at or above the current threshold slider
      setResults(searchResults.filter((r) => r.score >= threshold))
    } catch (err: unknown) {
      toast(`Search failed: ${(err as Error).message}`, 'error')
    } finally {
      setSearching(false)
    }
  }


  return (
    <div className="page-shell animate-fade-in" style={{ maxWidth: 940 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Semantic Search</h1>
        <p className="page-subtitle">Vector similarity search over indexed document chunks</p>
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doSearch()} placeholder="Enter a search query…" style={{ flex: 1, background: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)', borderRadius: 7, padding: '10px 14px', color: 'var(--color-text)', fontSize: 13.5, fontFamily: 'var(--font-sans)', outline: 'none' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-cyan)66')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-strong)')} />
          <button onClick={doSearch} disabled={!query.trim() || searching} style={{ padding: '10px 22px', borderRadius: 7, border: 'none', background: query.trim() && !searching ? 'var(--color-cyan)' : 'rgba(255,255,255,0.06)', color: query.trim() && !searching ? '#070809' : 'var(--color-text-3)', fontSize: 13.5, fontWeight: 500, fontFamily: 'var(--font-sans)', cursor: query.trim() && !searching ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              Threshold: <span style={{ color: 'var(--color-cyan)' }}>{threshold.toFixed(2)}</span>
            </label>
            <input type="range" min={0.3} max={0.99} step={0.01} value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))} style={{ width: 160, accentColor: 'var(--color-cyan)' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              Top-K: <span style={{ color: 'var(--color-cyan)' }}>{topK}</span>
            </label>
            <input type="range" min={1} max={20} step={1} value={topK} onChange={(e) => setTopK(parseInt(e.target.value))} style={{ width: 120, accentColor: 'var(--color-cyan)' }} />
          </div>

          {indexedDocs.length > 0 && (
            <div>
              <label style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Filter documents</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {indexedDocs.map((doc) => {
                  const sel = selectedDocIds.includes(doc.id)
                  return (
                    <button key={doc.id} onClick={() => setSelectedDocIds((prev) => prev.includes(doc.id) ? prev.filter((x) => x !== doc.id) : [...prev, doc.id])} style={{ padding: '3px 10px', borderRadius: 5, border: `1px solid ${sel ? 'var(--color-cyan)' : 'var(--color-border)'}`, background: sel ? 'var(--color-cyan-dim)' : 'transparent', color: sel ? 'var(--color-cyan)' : 'var(--color-text-3)', fontSize: 11.5, fontFamily: 'var(--font-sans)', cursor: 'pointer', transition: 'all 0.12s' }}>
                      {doc.name.replace(/\.[^/.]+$/, '').slice(0, 20)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {searching && (
        <div style={{ padding: '16px 0' }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 10, marginBottom: 10 }} />)}
        </div>
      )}

      {results !== null && !searching && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {results.length} result{results.length !== 1 ? 's' : ''} above {threshold.toFixed(2)} threshold
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>query: "{query}"</div>
          </div>

          {results.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, color: 'var(--color-text-3)', fontSize: 13.5 }}>
              No results above similarity threshold {threshold.toFixed(2)}.
              <br /><span style={{ fontSize: 12.5 }}>Try lowering the threshold or broadening your query.</span>
            </div>
          ) : (
            results.map((r, i) => <ResultCard key={r.chunk_id} result={r} rank={i + 1} />)
          )}
        </div>
      )}

      {results === null && !searching && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-3)', fontSize: 13.5 }}>
          Enter a query above to search across indexed documents using semantic similarity.
        </div>
      )}
    </div>
  )
}
