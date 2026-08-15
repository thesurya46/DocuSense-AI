import { useState, useCallback, useEffect, useRef } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

// Simple module-level callback so any component can call toast() without context
let _addToast: ((msg: string, type: ToastType) => void) | null = null

export function toast(message: string, type: ToastType = 'success') {
  setTimeout(() => _addToast?.(message, type), 0)
}

const TYPE_STYLES: Record<ToastType, { bg: string; border: string; icon: string; color: string }> = {
  success: {
    bg: 'var(--color-success-dim)',
    border: 'rgba(34,197,94,0.3)',
    icon: '✓',
    color: 'var(--color-success)',
  },
  error: {
    bg: 'var(--color-danger-dim)',
    border: 'rgba(239,68,68,0.3)',
    icon: '✕',
    color: 'var(--color-danger)',
  },
  info: {
    bg: 'var(--color-cyan-dim)',
    border: 'var(--color-cyan)44',
    icon: 'i',
    color: 'var(--color-cyan)',
  },
}

function ToastEntry({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  const s = TYPE_STYLES[item.type]
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(item.id), 3200)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [item.id, onRemove])

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        background: 'var(--color-surface)',
        border: `1px solid ${s.border}`,
        borderLeft: `3px solid ${s.color}`,
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        cursor: 'pointer',
        minWidth: 220,
        maxWidth: 340,
      }}
      onClick={() => onRemove(item.id)}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: s.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 700,
          color: s.color,
          flexShrink: 0,
          fontFamily: 'var(--font-mono)',
        }}
      >
        {s.icon}
      </span>
      <span style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.4 }}>{item.message}</span>
    </div>
  )
}

export function ToastProvider() {
  const [items, setItems] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
    setItems((prev) => [...prev.slice(-4), { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    _addToast = addToast
    return () => { _addToast = null }
  }, [addToast])

  if (items.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {items.map((item) => (
        <div key={item.id} style={{ pointerEvents: 'all' }}>
          <ToastEntry item={item} onRemove={removeToast} />
        </div>
      ))}
    </div>
  )
}
