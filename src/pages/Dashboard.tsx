import type { Document, Conversation } from '../types'
import { formatBytes, formatDate } from '../data/demo'
import PipelineArchitecture from '../components/PipelineArchitecture'

interface DashboardProps {
  documents: Document[]
  conversations: Conversation[]
  onNavigate: (page: 'documents' | 'chat' | 'search' | 'evaluate' | 'settings') => void
}

const ACTIVITY = [
  { icon: '📄', msg: 'NLP Architecture Paper 2024.pdf indexed', sub: '94 chunks · 18 pages', time: '2m ago', color: 'var(--color-cyan)' },
  { icon: '💬', msg: 'Chat session — "What accuracy does the model achieve?"', sub: '2 sources cited · 0.94 avg similarity', time: '6m ago', color: 'var(--color-purple)' },
  { icon: '🔍', msg: 'Semantic search — "retrieval methodology"', sub: '4 results above threshold 0.70', time: '14m ago', color: 'var(--color-success)' },
  { icon: '📄', msg: 'Annual Research Report 2024.pdf indexed', sub: '187 chunks · 42 pages', time: '1h ago', color: 'var(--color-cyan)' },
  { icon: '🧪', msg: 'Evaluation run completed', sub: 'Retrieval precision 0.89 · Citation accuracy 0.94', time: '2h ago', color: 'var(--color-warning)' },
]

function StatCard({ label, value, sub, accent, trend }: { label: string; value: string | number; sub?: string; accent?: boolean; trend?: { dir: 'up' | 'down'; val: string } }) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: '20px 22px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: accent ? 'var(--color-cyan)' : 'var(--color-text)', lineHeight: 1, letterSpacing: '-0.02em' }}>
          {value}
        </div>
        {trend && (
          <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: trend.dir === 'up' ? 'var(--color-success)' : 'var(--color-danger)', marginBottom: 2, fontWeight: 500 }}>
            {trend.dir === 'up' ? '↑' : '↓'} {trend.val}
          </span>
        )}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: ok ? 'var(--color-success)' : 'var(--color-danger)',
        animation: ok ? 'pulse-dot 2.5s ease-in-out infinite' : 'none',
      }}
    />
  )
}

export default function Dashboard({ documents, conversations, onNavigate }: DashboardProps) {
  const indexedDocs = documents.filter((d) => d.status === 'indexed')
  const totalChunks = indexedDocs.reduce((s, d) => s + d.chunks, 0)
  const totalPages = indexedDocs.reduce((s, d) => s + d.pages, 0)

  const recentDocs = [...documents]
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    .slice(0, 4)

  const typeColor: Record<string, string> = { pdf: '#ef4444', docx: '#3b82f6', txt: '#6b7280', md: '#a78bfa' }

  const fileIcon = (type: Document['type']) => (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 6,
        background: (typeColor[type] ?? '#6b7280') + '1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 8,
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        color: typeColor[type] ?? '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
    >
      {type}
    </div>
  )

  return (
    <div className="page-shell animate-fade-in" style={{ maxWidth: 1160 }}>

      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Document Intelligence Platform · RAG Intel</p>
        </div>
        <button
          onClick={() => onNavigate('documents')}
          style={{
            padding: '9px 18px',
            borderRadius: 7,
            border: '1px solid var(--color-cyan)',
            background: 'var(--color-cyan-dim)',
            color: 'var(--color-cyan)',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-cyan-glow)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-cyan-dim)')}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          Upload Document
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard label="Indexed Documents" value={indexedDocs.length} sub={`of ${documents.length} uploaded`} trend={{ dir: 'up', val: '+2 today' }} />
        <StatCard label="Vector Chunks" value={totalChunks.toLocaleString()} sub="in ChromaDB" accent trend={{ dir: 'up', val: '+94' }} />
        <StatCard label="Pages Processed" value={totalPages.toLocaleString()} sub="across all documents" />
        <StatCard label="Conversations" value={conversations.length} sub="with citations" trend={{ dir: 'up', val: '+1 today' }} />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 16 }}>

        {/* Recent documents */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>Recent Documents</span>
            <button onClick={() => onNavigate('documents')} style={{ fontSize: 12, color: 'var(--color-cyan)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: 0 }}>
              View all →
            </button>
          </div>
          {recentDocs.map((doc, i) => (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 18px',
                borderBottom: i < recentDocs.length - 1 ? '1px solid var(--color-border)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onClick={() => onNavigate('documents')}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-2)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
            >
              {fileIcon(doc.type)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                  {doc.pages}p · {doc.chunks} chunks · {formatBytes(doc.size)}
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-3)', whiteSpace: 'nowrap' }}>{formatDate(doc.uploadedAt)}</div>
              <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 4, background: doc.status === 'indexed' ? 'var(--color-success-dim)' : 'var(--color-warning-dim)', color: doc.status === 'indexed' ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 500 }}>
                {doc.status}
              </div>
            </div>
          ))}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* System status */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 18px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 12 }}>System Status</div>
            {[
              { label: 'OpenAI API', ok: true, detail: 'gpt-4o-mini' },
              { label: 'ChromaDB', ok: true, detail: 'local · persistent' },
              { label: 'Embedding Service', ok: true, detail: 'text-embedding-3-small' },
              { label: 'Document Parser', ok: true, detail: 'PyMuPDF · python-docx' },
            ].map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <span style={{ fontSize: 12.5, color: 'var(--color-text-2)' }}>{s.label}</span>
                  <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', marginTop: 1 }}>{s.detail}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusDot ok={s.ok} />
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: s.ok ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {s.ok ? 'online' : 'offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 18px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 10 }}>Quick Actions</div>
            {[
              { label: 'Upload Document', page: 'documents' as const, primary: true },
              { label: 'Ask a Question', page: 'chat' as const, primary: false },
              { label: 'Semantic Search', page: 'search' as const, primary: false },
              { label: 'Run Evaluation', page: 'evaluate' as const, primary: false },
            ].map((a) => (
              <button
                key={a.label}
                onClick={() => onNavigate(a.page)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  marginBottom: 6,
                  borderRadius: 6,
                  border: `1px solid ${a.primary ? 'var(--color-cyan)' : 'var(--color-border)'}`,
                  background: a.primary ? 'var(--color-cyan-dim)' : 'transparent',
                  color: a.primary ? 'var(--color-cyan)' : 'var(--color-text-2)',
                  fontSize: 12.5,
                  fontFamily: 'var(--font-sans)',
                  fontWeight: a.primary ? 500 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = a.primary ? 'var(--color-cyan-glow)' : 'var(--color-surface-2)'
                  if (!a.primary) e.currentTarget.style.color = 'var(--color-text)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = a.primary ? 'var(--color-cyan-dim)' : 'transparent'
                  if (!a.primary) e.currentTarget.style.color = 'var(--color-text-2)'
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-card)', marginBottom: 24 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>Activity Feed</span>
        </div>
        {ACTIVITY.map((a, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '11px 18px',
              borderBottom: i < ACTIVITY.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: a.color + '15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {a.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.msg}</div>
              <div style={{ fontSize: 11.5, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{a.sub}</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-3)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>{a.time}</div>
          </div>
        ))}
      </div>

      {/* Pipeline architecture */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>System Architecture</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2 }}>
              Indexing pipeline runs once offline · Query pipeline runs live on every request
            </div>
          </div>
        </div>
        <PipelineArchitecture />
      </div>
    </div>
  )
}
