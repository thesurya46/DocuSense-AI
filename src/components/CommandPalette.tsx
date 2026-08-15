import { useState, useEffect, useRef, useCallback } from 'react'
import type { Document, Page } from '../types'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ReactElement
  action: () => void
  group: string
  keywords?: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  documents: Document[]
  onNavigate: (page: Page) => void
  onChatDoc: (docId: string) => void
}

const NavIcon = ({ path }: { path: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d={path} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function CommandPalette({ open, onClose, documents, onNavigate, onChatDoc }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const NAV_COMMANDS: CommandItem[] = [
    { id: 'nav-dashboard', label: 'Go to Dashboard', description: 'Overview, stats, system status', group: 'Navigation', keywords: 'overview home', icon: <NavIcon path="M1 1h5v5H1zM8 1h5v5H8zM1 8h5v5H1zM8 8h5v5H8z" />, action: () => { onNavigate('dashboard'); onClose() } },
    { id: 'nav-documents', label: 'Go to Documents', description: 'Upload and manage indexed documents', group: 'Navigation', keywords: 'upload files pdf', icon: <NavIcon path="M8 1H3a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5L8 1zM8 1v4h4" />, action: () => { onNavigate('documents'); onClose() } },
    { id: 'nav-chat', label: 'Open Chat', description: 'Ask questions about your documents', group: 'Navigation', keywords: 'ask question query', icon: <NavIcon path="M12 8a1 1 0 01-1 1H4L1 12V2a1 1 0 011-1h9a1 1 0 011 1v6z" />, action: () => { onNavigate('chat'); onClose() } },
    { id: 'nav-search', label: 'Semantic Search', description: 'Vector similarity search across chunks', group: 'Navigation', keywords: 'find retrieve', icon: <NavIcon path="M6 11A5 5 0 106 1a5 5 0 000 10zM13 13l-3-3" />, action: () => { onNavigate('search'); onClose() } },
    { id: 'nav-evaluate', label: 'Open Evaluation', description: 'Run RAG precision and citation tests', group: 'Navigation', keywords: 'metrics test benchmark', icon: <NavIcon path="M2 10V7M5 10V5M8 10V3M11 10V1" />, action: () => { onNavigate('evaluate'); onClose() } },
    { id: 'nav-settings', label: 'Settings', description: 'LLM, embedding, chunking configuration', group: 'Navigation', keywords: 'config api key model', icon: <NavIcon path="M7 4.5A2.5 2.5 0 117 9.5 2.5 2.5 0 017 4.5zM7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13" />, action: () => { onNavigate('settings'); onClose() } },
  ]

  const DOC_COMMANDS: CommandItem[] = documents
    .filter((d) => d.status === 'indexed')
    .map((doc) => ({
      id: `doc-${doc.id}`,
      label: doc.name,
      description: `${doc.pages}p · ${doc.chunks} chunks · Chat about this document`,
      group: 'Documents',
      keywords: doc.name.toLowerCase(),
      icon: (
        <div style={{ width: 14, height: 14, borderRadius: 3, background: { pdf: '#ef4444', docx: '#3b82f6', txt: '#6b7280', md: '#a78bfa' }[doc.type] + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontFamily: 'var(--font-mono)', fontWeight: 700, color: { pdf: '#ef4444', docx: '#3b82f6', txt: '#6b7280', md: '#a78bfa' }[doc.type] }}>
          {doc.type}
        </div>
      ),
      action: () => { onChatDoc(doc.id); onClose() },
    }))

  const ALL_COMMANDS = [...NAV_COMMANDS, ...DOC_COMMANDS]

  const filtered = query.trim()
    ? ALL_COMMANDS.filter((c) =>
        `${c.label} ${c.description ?? ''} ${c.keywords ?? ''}`.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_COMMANDS

  // Group filtered items
  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  // Flat index for keyboard nav
  const flatItems = Object.values(groups).flat()

  useEffect(() => { setActiveIdx(0) }, [query])

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => (i + 1) % flatItems.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => (i - 1 + flatItems.length) % flatItems.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      flatItems[activeIdx]?.action()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [flatItems, activeIdx, onClose])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 500 }}
        onClick={onClose}
      />

      {/* Palette */}
      <div
        className="animate-scale-in"
        style={{
          position: 'fixed',
          top: '16vh',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 580,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 14,
          boxShadow: 'var(--shadow-float)',
          zIndex: 510,
          overflow: 'hidden',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: 'var(--color-text-3)' }}>
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search pages, documents, actions…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: 'var(--color-text)',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <kbd
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-3)',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 4,
              padding: '2px 6px',
            }}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 360, overflowY: 'auto', padding: '6px 0' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: 13.5, color: 'var(--color-text-3)' }}>
              No results for "{query}"
            </div>
          )}

          {Object.entries(groups).map(([group, items]) => {
            const groupStartIdx = flatItems.indexOf(items[0])
            return (
              <div key={group}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text-3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    padding: '8px 18px 4px',
                  }}
                >
                  {group}
                </div>
                {items.map((item, localIdx) => {
                  const flatIndex = groupStartIdx + localIdx
                  const isActive = flatIndex === activeIdx
                  return (
                    <button
                      key={item.id}
                      data-idx={flatIndex}
                      onClick={item.action}
                      onMouseEnter={() => setActiveIdx(flatIndex)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        width: '100%',
                        padding: '9px 18px',
                        background: isActive ? 'var(--color-cyan-dim)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: isActive ? 'var(--color-cyan-glow)' : 'var(--color-surface-2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isActive ? 'var(--color-cyan)' : 'var(--color-text-2)',
                          flexShrink: 0,
                          transition: 'all 0.1s',
                        }}
                      >
                        {item.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: isActive ? 'var(--color-text)' : 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.label}
                        </div>
                        {item.description && (
                          <div style={{ fontSize: 11.5, color: 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                            {item.description}
                          </div>
                        )}
                      </div>
                      {isActive && (
                        <kbd style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)', background: 'var(--color-cyan-dim)', border: '1px solid var(--color-cyan)44', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
                          ↵
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: '8px 18px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            gap: 16,
          }}
        >
          {[
            { keys: '↑↓', label: 'navigate' },
            { keys: '↵', label: 'select' },
            { keys: 'Esc', label: 'close' },
          ].map((h) => (
            <span key={h.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <kbd style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border-strong)', borderRadius: 3, padding: '1px 5px' }}>
                {h.keys}
              </kbd>
              <span style={{ color: 'var(--color-text-3)' }}>{h.label}</span>
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
