import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Document, Conversation, Page } from './types'
import { supabase, fetchDocuments, fetchConversations, upsertConversation, deleteDocument as dbDeleteDocument } from './lib/supabase'
import { storage } from './lib/storage'
import Auth from './pages/Auth'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import Chat from './pages/Chat'
import Search from './pages/Search'
import Evaluate from './pages/Evaluate'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import CommandPalette from './components/CommandPalette'
import { ToastProvider, toast } from './components/Toast'
import { DEMO_DOCUMENTS, DEMO_CONVERSATIONS } from './data/demo'

type Theme = 'dark' | 'light'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [page, setPage] = useState<Page>('dashboard')
  const [documents, setDocuments] = useState<Document[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [chatInitDocId, setChatInitDocId] = useState<string | null>(null)
  const [theme, setTheme] = useState<Theme>('dark')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load data when user signs in
  useEffect(() => {
    if (!user) { setDocuments([]); setConversations([]); return }
    setDataLoading(true)
    Promise.allSettled([fetchDocuments(), fetchConversations()])
      .then(([documentsResult, conversationsResult]) => {
        const docs = documentsResult.status === 'fulfilled' ? documentsResult.value : []
        const convs = conversationsResult.status === 'fulfilled' ? conversationsResult.value : []

        setDocuments(docs.length > 0 ? docs : DEMO_DOCUMENTS)
        setConversations(convs.length > 0 ? convs : DEMO_CONVERSATIONS)

        if (documentsResult.status === 'rejected' || conversationsResult.status === 'rejected') {
          toast('Database tables are not ready. Showing demo workspace data.', 'info')
        }
      })
      .finally(() => setDataLoading(false))
  }, [user])

  // Apply theme
  useEffect(() => {
    if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light')
    else document.documentElement.removeAttribute('data-theme')
  }, [theme])

  // Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen((o) => !o) }
      if (e.key === 'Escape') setPaletteOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleAddDocument = (doc: Document) => {
    setDocuments((prev) => {
      const idx = prev.findIndex((d) => d.id === doc.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = doc; return next }
      return [doc, ...prev]
    })
  }

  const handleDeleteDocument = async (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    try {
      await dbDeleteDocument(id)
      toast('Document deleted', 'info')
    } catch (err: unknown) {
      toast(`Delete failed: ${(err as Error).message}`, 'error')
    }
  }

  const handleUpdateConversations = useCallback(async (convs: Conversation[]) => {
    setConversations(convs)
    // Persist the most recently updated conversation
    const latest = convs.reduce<Conversation | null>((acc, c) => (!acc || c.updatedAt > acc.updatedAt ? c : acc), null)
    if (latest) upsertConversation(latest).catch(() => {/* silent */})
  }, [])

  const handleChatAboutDoc = (docId: string) => { setChatInitDocId(docId); setPage('chat') }
  const handleNavigate = useCallback((p: Page) => { if (p !== 'chat') setChatInitDocId(null); setPage(p) }, [])

  const toggleTheme = () => {
    setTheme((t) => { const next = t === 'dark' ? 'light' : 'dark'; toast(`Switched to ${next} mode`, 'info'); return next })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast('Signed out', 'info')
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--color-border-strong)', borderTopColor: 'var(--color-cyan)', animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  if (!user) return <Auth />

  const indexedCount = documents.filter((d) => d.status === 'indexed').length
  const settings = storage.getSettings()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Sidebar
        currentPage={page}
        onNavigate={handleNavigate}
        documentCount={indexedCount}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenPalette={() => setPaletteOpen(true)}
        user={user}
      />

      <main style={{ marginLeft: 260, flex: 1, minHeight: '100vh', overflow: page === 'chat' ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column' }}>
        {dataLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--color-border-strong)', borderTopColor: 'var(--color-cyan)', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Loading your workspace…</div>
            </div>
          </div>
        ) : (
          <>
            {page === 'dashboard' && <Dashboard documents={documents} conversations={conversations} onNavigate={handleNavigate} />}
            {page === 'documents' && <Documents documents={documents} onAddDocument={handleAddDocument} onDeleteDocument={handleDeleteDocument} onChat={handleChatAboutDoc} />}
            {page === 'chat'      && <Chat documents={documents} conversations={conversations} onUpdateConversations={handleUpdateConversations} initialDocId={chatInitDocId} />}
            {page === 'search'    && <Search documents={documents} />}
            {page === 'evaluate'  && <Evaluate documents={documents} />}
            {page === 'settings'  && <Settings />}
            {page === 'profile'   && <Profile user={user} onSignOut={handleSignOut} />}
          </>
        )}
      </main>

<CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} documents={documents}
        onNavigate={(p) => { handleNavigate(p); setPaletteOpen(false) }}
        onChatDoc={(id) => { handleChatAboutDoc(id); setPaletteOpen(false) }} />

      <ToastProvider />
    </div>
  )
}
