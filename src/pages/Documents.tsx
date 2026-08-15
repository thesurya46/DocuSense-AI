import { useState, useRef, useCallback } from 'react'
import type { Document, DocumentStatus } from '../types'
import { formatBytes, formatDate } from '../data/demo'
import { storage } from '../lib/storage'
import { upsertDocument } from '../lib/supabase'
import { indexDocument } from '../lib/supabase'
import { extractText } from '../lib/fileParser'
import { toast } from '../components/Toast'

interface DocumentsProps {
  documents: Document[]
  onAddDocument: (doc: Document) => void
  onDeleteDocument: (id: string) => void
  onChat: (docId: string) => void
}

const TYPE_COLORS: Record<string, string> = { pdf: '#ef4444', docx: '#3b82f6', txt: '#6b7280', md: '#a78bfa' }

function FileIcon({ type }: { type: Document['type'] }) {
  const color = TYPE_COLORS[type] || '#6b7280'
  return (
    <div style={{ width: 36, height: 36, borderRadius: 7, background: color + '1a', border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
      {type}
    </div>
  )
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const cfg: Record<DocumentStatus, { bg: string; color: string; label: string }> = {
    uploading:  { bg: 'var(--color-cyan-dim)',    color: 'var(--color-cyan)',    label: 'Uploading'  },
    extracting: { bg: 'var(--color-warning-dim)', color: 'var(--color-warning)', label: 'Extracting' },
    chunking:   { bg: 'var(--color-warning-dim)', color: 'var(--color-warning)', label: 'Chunking'   },
    embedding:  { bg: 'var(--color-purple-dim)',  color: 'var(--color-purple)',  label: 'Embedding'  },
    indexed:    { bg: 'var(--color-success-dim)', color: 'var(--color-success)', label: 'Indexed'    },
    error:      { bg: 'var(--color-danger-dim)',  color: 'var(--color-danger)',  label: 'Error'      },
  }
  const c = cfg[status]
  return (
    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: 4, background: c.bg, color: c.color, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {status !== 'indexed' && status !== 'error' && <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: c.color, marginRight: 5, animation: 'pulse-dot 1s ease-in-out infinite', verticalAlign: 'middle' }} />}
      {c.label}
    </span>
  )
}

function ProcessingBar({ status, progress }: { status: DocumentStatus; progress: number }) {
  const labels: Partial<Record<DocumentStatus, string>> = {
    uploading: 'Reading file…', extracting: 'Extracting text…',
    chunking: 'Chunking…', embedding: 'Generating embeddings (server)…',
  }
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-3)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>
        <span>{labels[status] ?? status}</span>
        <span>{progress}%</span>
      </div>
      <div style={{ height: 3, background: 'var(--color-surface-3)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--color-cyan)', borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

function UploadZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(false); const files = Array.from(e.dataTransfer.files); if (files.length) onFiles(files) }, [onFiles])
  return (
    <div onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} onClick={() => inputRef.current?.click()}
      style={{ border: `1.5px dashed ${dragging ? 'var(--color-cyan)' : 'var(--color-border-strong)'}`, borderRadius: 10, padding: '36px 24px', textAlign: 'center', cursor: 'pointer', background: dragging ? 'var(--color-cyan-dim)' : 'var(--color-surface)', transition: 'all 0.2s', marginBottom: 24 }}>
      <input ref={inputRef} type="file" multiple accept=".pdf,.docx,.txt,.md" style={{ display: 'none' }}
        onChange={(e) => { const files = Array.from(e.target.files ?? []); if (files.length) { onFiles(files); e.target.value = '' } }} />
      <div style={{ width: 40, height: 40, borderRadius: 8, background: dragging ? 'var(--color-cyan-glow)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 12V3M9 3L5.5 6.5M9 3L12.5 6.5" stroke={dragging ? 'var(--color-cyan)' : 'var(--color-text-2)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 14h14" stroke={dragging ? 'var(--color-cyan)' : 'var(--color-text-3)'} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 500, color: dragging ? 'var(--color-cyan)' : 'var(--color-text)', marginBottom: 4 }}>Drop files here or click to upload</div>
      <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>PDF, DOCX, TXT, Markdown · Max 25 MB · Indexed server-side with OpenAI</div>
    </div>
  )
}

export default function Documents({ documents, onAddDocument, onDeleteDocument, onChat }: DocumentsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [progress, setProgress] = useState<Record<string, number>>({})

  const extToType = (ext: string): Document['type'] => ({ pdf: 'pdf', docx: 'docx', txt: 'txt', md: 'md' } as Record<string, Document['type']>)[ext.toLowerCase()] ?? 'txt'

  const handleFiles = async (files: File[]) => {
    const settings = storage.getSettings()

    for (const file of files) {
      if (file.size > settings.maxFileSizeMb * 1024 * 1024) { toast(`${file.name} exceeds ${settings.maxFileSizeMb} MB`, 'error'); continue }
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      if (!['pdf', 'docx', 'txt', 'md'].includes(ext)) { toast(`Unsupported type: .${ext}`, 'error'); continue }

      const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      const docBase: Document = { id, name: file.name, type: extToType(ext), size: file.size, pages: 1, chunks: 0, status: 'uploading', uploadedAt: new Date() }

      onAddDocument(docBase)
      setProgress((p) => ({ ...p, [id]: 5 }))

      try {
        // 1. Insert document record into Supabase
        await upsertDocument(docBase)

        // 2. Extract text client-side
        onAddDocument({ ...docBase, status: 'extracting' })
        setProgress((p) => ({ ...p, [id]: 20 }))
        const { text, pages } = await extractText(file)
        const docWithPages = { ...docBase, pages }

        // 3. Send to edge function for chunking + embedding
        onAddDocument({ ...docWithPages, status: 'embedding' })
        setProgress((p) => ({ ...p, [id]: 40 }))

        const { chunks } = await indexDocument({
          documentId:   id,
          documentName: file.name,
          text,
          pages,
          chunkSize:    settings.chunkSize,
          chunkOverlap: settings.chunkOverlap,
        })

        setProgress((p) => ({ ...p, [id]: 100 }))
        const finalDoc: Document = { ...docWithPages, status: 'indexed', chunks, indexedAt: new Date() }
        onAddDocument(finalDoc)
        toast(`${file.name} indexed — ${chunks} chunks`, 'success')
      } catch (err: unknown) {
        const errDoc = { ...docBase, status: 'error' as const }
        onAddDocument(errDoc)
        await upsertDocument(errDoc).catch(() => {/* silent */})
        toast(`Failed: ${(err as Error).message}`, 'error')
      } finally {
        setProgress((p) => { const n = { ...p }; delete n[id]; return n })
      }
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await new Promise((r) => setTimeout(r, 300))
    onDeleteDocument(id)
    setDeletingId(null)
  }

  const indexed    = documents.filter((d) => d.status === 'indexed')
  const processing = documents.filter((d) => d.status !== 'indexed' && d.status !== 'error')

  return (
    <div className="page-shell animate-fade-in" style={{ maxWidth: 1040 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Documents</h1>
        <p className="page-subtitle">
          {indexed.length} indexed · {documents.reduce((s, d) => s + d.chunks, 0).toLocaleString()} chunks · stored in Supabase pgvector
        </p>
      </div>

      <UploadZone onFiles={handleFiles} />

      {processing.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Processing</div>
          {processing.map((doc) => (
            <div key={doc.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '14px 16px', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FileIcon type={doc.type} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', marginBottom: 2 }}>{doc.name}</div>
                  <ProcessingBar status={doc.status} progress={progress[doc.id] ?? 10} />
                </div>
                <StatusBadge status={doc.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {indexed.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Indexed ({indexed.length})</div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 80px 80px 120px 100px', padding: '10px 16px', borderBottom: '1px solid var(--color-border)', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Document</span><span>Pages</span><span>Chunks</span><span>Size</span><span>Indexed</span><span>Actions</span>
            </div>
            {indexed.map((doc, i) => (
              <div key={doc.id} style={{ display: 'grid', gridTemplateColumns: '1fr 64px 80px 80px 120px 100px', padding: '14px 16px', borderBottom: i < indexed.length - 1 ? '1px solid var(--color-border)' : 'none', alignItems: 'center', opacity: deletingId === doc.id ? 0.4 : 1, transition: 'opacity 0.3s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <FileIcon type={doc.type} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                    {doc.description && <div style={{ fontSize: 11.5, color: 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{doc.description}</div>}
                  </div>
                </div>
                <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)' }}>{doc.pages}</span>
                <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)' }}>{doc.chunks}</span>
                <span style={{ fontSize: 12.5, fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)' }}>{formatBytes(doc.size)}</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{doc.indexedAt ? formatDate(doc.indexedAt) : '—'}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => onChat(doc.id)} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-cyan)', fontSize: 11.5, fontFamily: 'var(--font-sans)', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-cyan-dim)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>Chat</button>
                  <button onClick={() => handleDelete(doc.id)} style={{ padding: '4px 6px', borderRadius: 5, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-3)', fontSize: 12, cursor: 'pointer', lineHeight: 1 }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-danger-dim)'; e.currentTarget.style.color = 'var(--color-danger)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-3)' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-3)', fontSize: 13.5 }}>
          No documents yet. Upload your first document above.
        </div>
      )}
    </div>
  )
}
