import React from 'react'
import type { Page } from '../types'
import type { User } from '@supabase/supabase-js'

interface SidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
  documentCount: number
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onOpenPalette: () => void
  user: User
}

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      {
        id: 'dashboard' as Page,
        label: 'Dashboard',
        icon: (
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <rect x="1.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="9.5" y="1.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="1.5" y="9.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <rect x="9.5" y="9.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        id: 'documents' as Page,
        label: 'Documents',
        icon: (
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <path d="M10 1.5H4a1 1 0 00-1 1v12a1 1 0 001 1h9a1 1 0 001-1V6.5L10 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M10 1.5v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <line x1="5.5" y1="10" x2="11.5" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="5.5" y1="12.5" x2="9.5" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      {
        id: 'chat' as Page,
        label: 'Chat',
        icon: (
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <path d="M15 10a1 1 0 01-1 1H5.5L2 14V2.5a1 1 0 011-1H14a1 1 0 011 1V10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        id: 'search' as Page,
        label: 'Search',
        icon: (
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        id: 'evaluate' as Page,
        label: 'Evaluate',
        icon: (
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <path d="M3 13V9M6.5 13V7M10 13V5M13.5 13V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Account',
    items: [
      {
        id: 'settings' as Page,
        label: 'Settings',
        icon: (
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <circle cx="8.5" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8.5 1.5v1.7M8.5 13.8v1.7M1.5 8.5h1.7M13.8 8.5h1.7M3.6 3.6l1.2 1.2M12.2 12.2l1.2 1.2M3.6 13.4l1.2-1.2M12.2 4.8l1.2-1.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
]

export default function Sidebar({ currentPage, onNavigate, documentCount, theme, onToggleTheme, onOpenPalette, user }: SidebarProps) {
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <aside style={{ width: 260, minWidth: 260, height: '100vh', background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 50 }}>

      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 34, height: 34, background: 'var(--color-cyan)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 16px var(--color-cyan-glow)' }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2z" fill="#070809" fillRule="evenodd" />
              <circle cx="10" cy="10" r="2" fill="#070809" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>RAG Intel</div>
            <div style={{ fontSize: 10.5, color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', opacity: 0.8, marginTop: 1 }}>v2.4.0 · production</div>
          </div>
        </div>
      </div>

      {/* Search shortcut */}
      <div style={{ padding: '12px 14px 10px' }}>
        <button onClick={onOpenPalette} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--color-border-strong)', background: 'var(--color-surface-2)', color: 'var(--color-text-3)', fontSize: 13, fontFamily: 'var(--font-sans)', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-cyan)55'; e.currentTarget.style.color = 'var(--color-text-2)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-strong)'; e.currentTarget.style.color = 'var(--color-text-3)' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.4" /><line x1="8.5" y1="8.5" x2="12" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
          <span style={{ flex: 1 }}>Quick search…</span>
          <kbd style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: 'var(--color-surface-3)', border: '1px solid var(--color-border-strong)', borderRadius: 4, padding: '2px 6px', color: 'var(--color-text-3)', lineHeight: 1.4 }}>⌘K</kbd>
        </button>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 8px' }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.09em', padding: '10px 8px 5px', fontWeight: 500 }}>{group.label}</div>
            {group.items.map((item) => {
              const active = currentPage === item.id
              return (
                <button key={item.id} onClick={() => onNavigate(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: active ? 'var(--color-cyan-dim)' : 'transparent', color: active ? 'var(--color-cyan)' : 'var(--color-text-2)', fontSize: 14, fontWeight: active ? 500 : 400, fontFamily: 'var(--font-sans)', width: '100%', textAlign: 'left', transition: 'background 0.12s, color 0.12s', marginBottom: 1, position: 'relative' }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--color-text)' } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-2)' } }}>
                  {active && <div style={{ position: 'absolute', left: 0, top: '25%', bottom: '25%', width: 3, borderRadius: 2, background: 'var(--color-cyan)' }} />}
                  <span style={{ opacity: active ? 1 : 0.65, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.id === 'documents' && documentCount > 0 && (
                    <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', background: active ? 'rgba(0,196,255,0.2)' : 'var(--color-surface-3)', color: active ? 'var(--color-cyan)' : 'var(--color-text-3)', padding: '2px 7px', borderRadius: 20, fontWeight: 600 }}>
                      {documentCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--color-border)', padding: '10px 12px' }}>
        {/* Status bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--color-success-dim)', borderRadius: 7, marginBottom: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', flexShrink: 0, animation: 'pulse-dot 2s ease-in-out infinite', display: 'inline-block' }} />
          <span style={{ fontSize: 11.5, color: 'var(--color-success)', fontWeight: 500, flex: 1 }}>All systems operational</span>
          <button onClick={onToggleTheme} title="Toggle theme" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-success)', opacity: 0.7, padding: 2, lineHeight: 1, fontSize: 13, flexShrink: 0 }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}>
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>

        {/* User chip */}
        <button onClick={() => onNavigate('profile')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 9, border: `1px solid ${currentPage === 'profile' ? 'var(--color-cyan)44' : 'var(--color-border)'}`, background: currentPage === 'profile' ? 'var(--color-cyan-dim)' : 'var(--color-surface-2)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { if (currentPage !== 'profile') { e.currentTarget.style.borderColor = 'var(--color-cyan)44'; e.currentTarget.style.background = 'var(--color-surface-3)' } }}
          onMouseLeave={(e) => { if (currentPage !== 'profile') { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)' } }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', background: 'var(--color-cyan-dim)', border: '1.5px solid var(--color-cyan)44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {avatarUrl
              ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>{initials}</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{displayName}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{user?.email}</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: 'var(--color-text-3)' }}>
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
