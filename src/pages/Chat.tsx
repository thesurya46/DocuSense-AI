import { useState, useRef, useEffect, useCallback } from 'react'
import type { Document, ChatMessage, Conversation, Source, PipelineStage } from '../types'
import PipelineArchitecture from '../components/PipelineArchitecture'
import { toast } from '../components/Toast'
import { storage } from '../lib/storage'
import { ragChat } from '../lib/supabase'

interface ChatProps {
  documents: Document[]
  conversations: Conversation[]
  onUpdateConversations: (convs: Conversation[]) => void
  initialDocId?: string | null
}

function PipelineViz({ stage }: { stage: PipelineStage }) {
  if (stage === 'idle' || stage === 'done') return null
  return (
    <div style={{ marginBottom: 14 }} className="animate-fade-in">
      <PipelineArchitecture activeStage={stage} />
    </div>
  )
}

function SourceDrawer({ source, onClose }: { source: Source; onClose: () => void }) {
  const typeColors: Record<string, string> = { pdf: '#ef4444', docx: '#3b82f6', txt: '#6b7280', md: '#a78bfa' }
  const ext = source.document_name.split('.').pop()?.toLowerCase() ?? 'txt'
  const color = typeColors[ext] ?? '#6b7280'

  return (
    <div className="animate-slide-in-right" style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 400, background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)', zIndex: 200, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 1 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-cyan)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>{source.source_id}</div>
          <div style={{ fontSize: 11.5, color: 'var(--color-text-3)' }}>Supporting evidence</div>
        </div>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-2)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ background: 'var(--color-surface-2)', borderRadius: 8, padding: '14px 16px', marginBottom: 16, border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ padding: '2px 8px', borderRadius: 4, background: color + '1a', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600, color, textTransform: 'uppercase' }}>{ext}</div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>{source.document_name}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Page', value: String(source.page) },
              { label: 'Chunk', value: source.chunk_id.split('_').slice(-2).join('_') },
              { label: 'Doc ID', value: source.document_id },
              source.score != null ? { label: 'Similarity', value: source.score.toFixed(3) } : null,
            ].filter(Boolean).map((item) => (
              <div key={item!.label}>
                <div style={{ fontSize: 10, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{item!.label}</div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)' }}>{item!.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Relevant Passage</div>
          <div style={{ background: 'var(--color-surface-2)', border: `1px solid var(--color-cyan)33`, borderLeft: `3px solid var(--color-cyan)`, borderRadius: '0 8px 8px 0', padding: '14px 16px', fontSize: 13.5, lineHeight: 1.7, color: 'var(--color-text)', fontStyle: 'italic' }}>
            "{source.text}"
          </div>
        </div>
        {source.score != null && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Similarity Score</div>
            <div style={{ height: 6, background: 'var(--color-surface-3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.round(source.score * 100)}%`, background: source.score > 0.85 ? 'var(--color-success)' : source.score > 0.7 ? 'var(--color-warning)' : 'var(--color-danger)', borderRadius: 3, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>
              <span>0.0</span>
              <span style={{ color: source.score > 0.85 ? 'var(--color-success)' : 'var(--color-warning)' }}>{(source.score * 100).toFixed(1)}% match</span>
              <span>1.0</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function renderInlineContent(text: string, sources: Source[], onCitationClick: (s: Source) => void, isStreaming: boolean) {
  const parts = text.split(/(\[Source \d+\])/g)
  return parts.map((part, i) => {
    const match = part.match(/\[Source (\d+)\]/)
    if (match) {
      const sourceId = `Source ${match[1]}`
      const source = sources.find((s) => s.source_id === sourceId)
      return (
        <button key={i} onClick={() => !isStreaming && source && onCitationClick(source)} style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 7px', borderRadius: 4, border: '1px solid var(--color-cyan)', background: 'var(--color-cyan-dim)', color: 'var(--color-cyan)', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, cursor: !isStreaming && source ? 'pointer' : 'default', margin: '0 2px', verticalAlign: 'middle', opacity: isStreaming ? 0.5 : 1, transition: 'background 0.15s, opacity 0.2s' }}
          onMouseEnter={(e) => !isStreaming && source && (e.currentTarget.style.background = 'var(--color-cyan-glow)')}
          onMouseLeave={(e) => !isStreaming && source && (e.currentTarget.style.background = 'var(--color-cyan-dim)')}>
          {part}
        </button>
      )
    }
    const lines = part.split('\n')
    return (
      <span key={i}>
        {lines.map((line, j) => {
          const segs = line.split(/(\*\*[^*]+\*\*)/g).map((seg, k) => {
            const bold = seg.match(/^\*\*(.+)\*\*$/)
            return bold ? <strong key={k}>{bold[1]}</strong> : seg
          })
          return <span key={j}>{j > 0 && <br />}{segs}</span>
        })}
      </span>
    )
  })
}

function MessageBubble({ msg, displayContent, isStreaming, onCitationClick, onCopy, onRegenerate, isLast }: {
  msg: ChatMessage; displayContent?: string; isStreaming?: boolean
  onCitationClick: (s: Source) => void; onCopy: (c: string) => void
  onRegenerate: () => void; isLast: boolean
}) {
  const isUser = msg.role === 'user'
  const content = displayContent ?? msg.content
  const [showActions, setShowActions] = useState(false)

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div style={{ maxWidth: '72%', background: 'var(--color-cyan-dim)', border: '1px solid var(--color-cyan)33', borderRadius: '12px 12px 2px 12px', padding: '10px 14px', fontSize: 13.5, color: 'var(--color-text)', lineHeight: 1.6 }}>
          {msg.content}
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 20 }} className="animate-fade-in" onMouseEnter={() => !isStreaming && setShowActions(true)} onMouseLeave={() => setShowActions(false)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--color-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3" fill="#070809" /><circle cx="5" cy="5" r="1.2" fill="#00c4ff" /></svg>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>RAG Intel</span>
        {msg.retrievalInfo && !isStreaming && (
          <span style={{ fontSize: 10.5, color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
            · {msg.retrievalInfo.retrieved} chunks · avg {msg.retrievalInfo.avgScore.toFixed(2)} sim
          </span>
        )}
        {isStreaming && (
          <span style={{ fontSize: 10.5, color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>
            <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: 'var(--color-cyan)', marginRight: 5, animation: 'pulse-dot 0.7s ease-in-out infinite', verticalAlign: 'middle' }} />
            streaming...
          </span>
        )}
      </div>
      <div style={{ marginLeft: 30, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '2px 12px 12px 12px', padding: '14px 16px', fontSize: 13.5, lineHeight: 1.75, color: 'var(--color-text)', position: 'relative' }}>
        {renderInlineContent(content, msg.sources ?? [], onCitationClick, !!isStreaming)}
        {isStreaming && <span style={{ display: 'inline-block', width: 2, height: 14, background: 'var(--color-cyan)', marginLeft: 2, verticalAlign: 'text-bottom', animation: 'pulse-dot 0.6s ease-in-out infinite' }} />}
      </div>
      {!isStreaming && (
        <div style={{ marginLeft: 30, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, opacity: showActions ? 1 : 0, transition: 'opacity 0.15s' }}>
          {[
            { label: 'Copy', action: () => onCopy(msg.content), icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="4" y="1" width="7" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" /><path d="M8 4H4a1 1 0 00-1 1v5a1 1 0 001 1h4a1 1 0 001-1V5a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.2" fill="none" /></svg> },
            ...(isLast ? [{ label: 'Regenerate', action: onRegenerate, icon: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 6A5 5 0 1 0 3.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M1 2v4h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg> }] : []),
          ].map((btn) => (
            <button key={btn.label} onClick={btn.action} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 5, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-3)', fontSize: 11, fontFamily: 'var(--font-sans)', cursor: 'pointer', transition: 'all 0.12s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-2)'; e.currentTarget.style.color = 'var(--color-text)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-3)' }}>
              {btn.icon}{btn.label}
            </button>
          ))}
        </div>
      )}
      {!isStreaming && msg.sources && msg.sources.length > 0 && (
        <div style={{ marginLeft: 30, marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {msg.sources.map((source) => (
            <button key={source.source_id} onClick={() => onCitationClick(source)} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', textAlign: 'left', maxWidth: 280, transition: 'border-color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-cyan)66')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><path d="M7 1H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V5L7 1z" stroke="var(--color-cyan)" strokeWidth="1.2" /><path d="M7 1v4h4" stroke="var(--color-cyan)" strokeWidth="1.2" /></svg>
              <div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-cyan)', marginBottom: 2 }}>{source.source_id}</div>
                <div style={{ fontSize: 11.5, color: 'var(--color-text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{source.document_name}</div>
                <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', marginTop: 1 }}>p.{source.page}{source.score ? ` · ${(source.score * 100).toFixed(0)}% match` : ''}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Chat({ documents, conversations, onUpdateConversations, initialDocId }: ChatProps) {
  const [activeConvId, setActiveConvId] = useState<string | null>(conversations[0]?.id ?? null)
  const [input, setInput] = useState('')
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('idle')
  const [openSource, setOpenSource] = useState<Source | null>(null)
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(initialDocId ? [initialDocId] : [])
  const [localConvs, setLocalConvs] = useState<Conversation[]>(conversations)
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const streamAbortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeConv = localConvs.find((c) => c.id === activeConvId) ?? null

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConv?.messages, streamingContent])

  const updateConvs = useCallback((next: Conversation[]) => {
    setLocalConvs(next)
    onUpdateConversations(next)
  }, [onUpdateConversations])

  const newConversation = () => {
    const id = `conv_${Date.now()}`
    const conv: Conversation = { id, title: 'New conversation', messages: [], documentIds: selectedDocIds, createdAt: new Date(), updatedAt: new Date() }
    updateConvs([conv, ...localConvs])
    setActiveConvId(id)
  }

  const exportConversation = () => {
    if (!activeConv || activeConv.messages.length === 0) return
    const lines = [`# ${activeConv.title}`, `*Exported from RAG Intel · ${new Date().toLocaleString()}*`, '']
    for (const msg of activeConv.messages) {
      lines.push(`## ${msg.role === 'user' ? 'User' : 'RAG Intel'}`)
      lines.push(msg.content)
      if (msg.sources?.length) {
        lines.push('', '**Sources:**')
        for (const s of msg.sources) lines.push(`- **${s.source_id}** · ${s.document_name} · p.${s.page}`)
      }
      lines.push('')
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${activeConv.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(a.href)
    toast('Exported as Markdown', 'success')
  }

  const clearConversation = () => {
    if (!activeConv) return
    const next = localConvs.map((c) => c.id === activeConv.id ? { ...c, messages: [], updatedAt: new Date() } : c)
    setLocalConvs(next)
    onUpdateConversations(next)
    toast('Conversation cleared', 'info')
  }

  const addMsgToConv = useCallback((convId: string, msg: ChatMessage, snapshot: Conversation[]): Conversation[] => {
    return snapshot.map((c) => {
      if (c.id !== convId) return c
      return { ...c, messages: [...c.messages, msg], updatedAt: new Date(), title: c.messages.length === 0 ? msg.content.slice(0, 50) : c.title }
    })
  }, [])

  const sendMessage = async (text?: string) => {
    const question = (text ?? input).trim()
    if (!question || pipelineStage !== 'idle') return

    const settings = storage.getSettings()

    setInput('')
    streamAbortRef.current?.abort()

    let convId = activeConvId
    let workingConvs = localConvs

    if (!convId) {
      const id = `conv_${Date.now()}`
      const conv: Conversation = { id, title: question.slice(0, 50), messages: [], documentIds: selectedDocIds, createdAt: new Date(), updatedAt: new Date() }
      workingConvs = [conv, ...localConvs]
      updateConvs(workingConvs)
      convId = id
      setActiveConvId(id)
    }

    const userMsg: ChatMessage = { id: `msg_${Date.now()}`, role: 'user', content: question, timestamp: new Date() }
    workingConvs = addMsgToConv(convId, userMsg, workingConvs)
    updateConvs(workingConvs)

    const abortController = new AbortController()
    streamAbortRef.current = abortController

    const msgId = `msg_${Date.now()}_ai`
    let sources: Source[] = []
    let fullContent = ''

    try {
      setPipelineStage('embedding')

      const history = (activeConv ?? workingConvs.find((c) => c.id === convId))?.messages.slice(-6).map((m) => ({ role: m.role, content: m.content })) ?? []

      await ragChat(
        {
          question,
          documentIds: selectedDocIds.length ? selectedDocIds : undefined,
          topK: settings.topK,
          similarityThreshold: settings.similarityThreshold,
          history,
        },
        (event) => {
          if (event.type === 'sources') {
            sources = event.sources
            setPipelineStage('searching')

            const aiMsgBase: ChatMessage = {
              id: msgId, role: 'assistant', content: '', sources, timestamp: new Date(),
              retrievalInfo: sources.length > 0 ? {
                topK: settings.topK, retrieved: sources.length, filtered: sources.length,
                avgScore: sources.reduce((s, r) => s + (r.score ?? 0), 0) / sources.length,
              } : undefined,
            }
            workingConvs = addMsgToConv(convId!, aiMsgBase, workingConvs)
            updateConvs(workingConvs)
            setStreamingMsgId(msgId)
            setStreamingContent('')
            setPipelineStage('generating')
          } else if (event.type === 'delta') {
            fullContent += event.delta
            setStreamingContent(fullContent)
          } else if (event.type === 'error') {
            throw new Error(event.error)
          }
        },
        abortController.signal
      )

      if (!abortController.signal.aborted) {
        setPipelineStage('idle')
        setStreamingMsgId(null)
        setStreamingContent('')
        const aiMsgFinal: ChatMessage = {
          id: msgId, role: 'assistant', content: fullContent, sources, timestamp: new Date(),
          retrievalInfo: sources.length > 0 ? {
            topK: settings.topK, retrieved: sources.length, filtered: sources.length,
            avgScore: sources.reduce((s, r) => s + (r.score ?? 0), 0) / sources.length,
          } : undefined,
        }
        const finalConvs = workingConvs.map((c) => ({
          ...c,
          messages: c.messages.map((m) => m.id === msgId ? aiMsgFinal : m),
        }))
        setLocalConvs(finalConvs)
        onUpdateConversations(finalConvs)
      }
    } catch (err: unknown) {
      setPipelineStage('idle')
      setStreamingMsgId(null)
      const msg = (err as Error).message ?? 'Unknown error'
      if (!msg.includes('aborted')) toast(`Error: ${msg}`, 'error')
    }
  }

  const handleCopy = (content: string) => {
    const plain = content.replace(/\[Source \d+\]/g, '').replace(/\*\*/g, '').trim()
    navigator.clipboard.writeText(plain).then(() => toast('Copied', 'success'))
  }

  const handleRegenerate = async () => {
    if (!activeConv || pipelineStage !== 'idle') return
    const lastUser = [...activeConv.messages].reverse().find((m) => m.role === 'user')
    if (!lastUser) return
    const next = localConvs.map((c) => c.id === activeConv.id ? { ...c, messages: c.messages.slice(0, -1), updatedAt: new Date() } : c)
    setLocalConvs(next)
    onUpdateConversations(next)
    toast('Regenerating…', 'info')
    await new Promise((r) => setTimeout(r, 80))
    await sendMessage(lastUser.content)
  }

  const isProcessing = pipelineStage !== 'idle' || !!streamingMsgId
  const indexedDocs = documents.filter((d) => d.status === 'indexed')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: 240, minWidth: 240, borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '16px 14px 10px', borderBottom: '1px solid var(--color-border)' }}>
          <button onClick={newConversation} style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-2)', fontSize: 12.5, fontFamily: 'var(--font-sans)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-cyan)'; e.currentTarget.style.color = 'var(--color-cyan)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)' }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>New conversation
          </button>
        </div>

        {indexedDocs.length > 0 && (
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Scope to documents</div>
            {indexedDocs.map((doc) => {
              const sel = selectedDocIds.includes(doc.id)
              return (
                <button key={doc.id} onClick={() => setSelectedDocIds((prev) => prev.includes(doc.id) ? prev.filter((x) => x !== doc.id) : [...prev, doc.id])} style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '5px 6px', borderRadius: 5, border: 'none', background: sel ? 'var(--color-cyan-dim)' : 'transparent', cursor: 'pointer', textAlign: 'left', marginBottom: 2 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, border: `1.5px solid ${sel ? 'var(--color-cyan)' : 'var(--color-border-strong)'}`, background: sel ? 'var(--color-cyan)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sel && <span style={{ fontSize: 8, color: '#070809', fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 11.5, color: sel ? 'var(--color-cyan)' : 'var(--color-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name.replace(/\.[^/.]+$/, '')}</span>
                </button>
              )
            })}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          {localConvs.length === 0 && <div style={{ fontSize: 12, color: 'var(--color-text-3)', padding: '8px 4px' }}>No conversations yet.</div>}
          {localConvs.map((conv) => (
            <button key={conv.id} onClick={() => setActiveConvId(conv.id)} style={{ display: 'block', width: '100%', padding: '8px 10px', borderRadius: 6, border: 'none', background: activeConvId === conv.id ? 'var(--color-surface-2)' : 'transparent', cursor: 'pointer', textAlign: 'left', marginBottom: 2, transition: 'background 0.12s' }}
              onMouseEnter={(e) => { if (activeConvId !== conv.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={(e) => { if (activeConvId !== conv.id) e.currentTarget.style.background = 'transparent' }}>
              <div style={{ fontSize: 12.5, color: activeConvId === conv.id ? 'var(--color-text)' : 'var(--color-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.title}</div>
              <div style={{ fontSize: 10.5, color: 'var(--color-text-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{conv.messages.length} msg{conv.messages.length !== 1 ? 's' : ''}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--color-bg)' }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>{activeConv?.title ?? 'Document Intelligence Chat'}</span>
          {selectedDocIds.length > 0 && <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)' }}>· {selectedDocIds.length} doc{selectedDocIds.length !== 1 ? 's' : ''} scoped</span>}
          {isProcessing && pipelineStage !== 'idle' && (
            <span style={{ fontSize: 11.5, color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)', marginLeft: 4 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-cyan)', marginRight: 6, animation: 'pulse-dot 0.7s ease-in-out infinite', verticalAlign: 'middle' }} />
              {pipelineStage === 'embedding' && 'Embedding query…'}
              {pipelineStage === 'searching' && 'Searching vectors…'}
              {pipelineStage === 'filtering' && 'Filtering chunks…'}
              {pipelineStage === 'reranking' && 'Reranking…'}
              {pipelineStage === 'generating' && 'Generating answer…'}
            </span>
          )}
          {activeConv && activeConv.messages.length > 0 && !isProcessing && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button onClick={exportConversation} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-3)', fontSize: 11.5, fontFamily: 'var(--font-sans)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-cyan-dim)'; e.currentTarget.style.color = 'var(--color-cyan)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-3)' }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v7M2 6l3.5 3.5L9 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Export
              </button>
              <button onClick={clearConversation} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-3)', fontSize: 11.5, fontFamily: 'var(--font-sans)', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-danger-dim)'; e.currentTarget.style.color = 'var(--color-danger)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-3)' }}>
                Clear
              </button>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {(!activeConv || activeConv.messages.length === 0) && !isProcessing && (
            <div style={{ maxWidth: 560, margin: '40px auto 0', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-cyan-dim)', border: '1px solid var(--color-cyan)33', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="var(--color-cyan)" strokeWidth="1.5" /><path d="M7 10h6M10 7v6" stroke="var(--color-cyan)" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.02em', margin: '0 0 6px' }}>Document Intelligence</h2>
              <p style={{ fontSize: 13.5, color: 'var(--color-text-3)', lineHeight: 1.6, marginBottom: 28 }}>Ask questions about your indexed documents. Every answer is grounded in retrieved evidence with transparent citations.</p>
              {indexedDocs.length === 0 && (
                <div style={{ padding: '14px 18px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-3)' }}>
                  No documents indexed yet. Upload documents first to start asking questions.
                </div>
              )}
            </div>
          )}

          {activeConv?.messages.map((msg, idx) => {
            const isLast = idx === activeConv.messages.length - 1
            const isThisStreaming = msg.id === streamingMsgId
            return (
              <MessageBubble key={msg.id} msg={msg} displayContent={isThisStreaming ? streamingContent : undefined} isStreaming={isThisStreaming} onCitationClick={setOpenSource} onCopy={handleCopy} onRegenerate={handleRegenerate} isLast={isLast && msg.role === 'assistant'} />
            )
          })}

          {pipelineStage !== 'idle' && pipelineStage !== 'done' && <PipelineViz stage={pipelineStage} />}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: '14px 24px 18px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
          <div style={{ display: 'flex', gap: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 10, padding: '10px 14px', transition: 'border-color 0.15s' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-cyan)66')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-strong)')}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} placeholder="Ask a question about your documents…" disabled={isProcessing} rows={1}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text)', fontSize: 13.5, fontFamily: 'var(--font-sans)', resize: 'none', lineHeight: 1.5, overflowY: 'hidden' }}
              onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 120)}px` }} />
            <button onClick={() => sendMessage()} disabled={!input.trim() || isProcessing} style={{ width: 32, height: 32, borderRadius: 6, border: 'none', background: input.trim() && !isProcessing ? 'var(--color-cyan)' : 'rgba(255,255,255,0.06)', color: input.trim() && !isProcessing ? '#070809' : 'var(--color-text-3)', cursor: input.trim() && !isProcessing ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end', transition: 'all 0.15s' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-text-3)', textAlign: 'center' }}>
            Grounded strictly in indexed documents · Click <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)' }}>[Source N]</span> to verify · Shift+Enter for new line
          </div>
        </div>
      </div>

      {openSource && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 190 }} onClick={() => setOpenSource(null)} />
          <SourceDrawer source={openSource} onClose={() => setOpenSource(null)} />
        </>
      )}
    </div>
  )
}
