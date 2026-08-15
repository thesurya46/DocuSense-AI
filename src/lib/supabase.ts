import { createClient } from '@supabase/supabase-js'
import type { Document, Conversation } from '../types'

const SUPABASE_URL = "https://eerrhefkzgtmaryevbvp.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcnJoZWZremd0bWFyeWV2YnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2Mzk0OTgsImV4cCI6MjEwMjIxNTQ5OH0.pADUwSBsjG4lQ7J1R59kf-f-Gn3ehgvFlCdbRhVG76c"

const g = globalThis as typeof globalThis & { __supabase?: ReturnType<typeof createClient> }
export const supabase = g.__supabase ?? (g.__supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storageKey: 'rag-intel-auth' },
}))

export const SERVER_URL = `${SUPABASE_URL}/functions/v1/server/make-server-db4f34ac`

// ── Auth helpers ──────────────────────────────────────────────────────────────

export async function getAuthHeader(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated. Please sign in.')
  return `Bearer ${session.access_token}`
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function fetchDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('uploaded_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToDocument)
}

export async function upsertDocument(doc: Document): Promise<void> {
  const { error } = await supabase.from('documents').upsert(documentToRow(doc) as never)
  if (error) throw new Error(error.message)
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Conversations ─────────────────────────────────────────────────────────────

export async function fetchConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToConversation)
}

export async function upsertConversation(conv: Conversation): Promise<void> {
  const { error } = await supabase.from('conversations').upsert(conversationToRow(conv) as never)
  if (error) throw new Error(error.message)
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase.from('conversations').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Edge function: index document ─────────────────────────────────────────────

export async function indexDocument(params: {
  documentId: string
  documentName: string
  text: string
  pages: number
  chunkSize?: number
  chunkOverlap?: number
}): Promise<{ chunks: number }> {
  const auth = await getAuthHeader()
  const res  = await fetch(`${SERVER_URL}/index-document`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body:    JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err.error ?? `Server error ${res.status}`)
  }
  return res.json()
}

// ── Edge function: chat (SSE) ─────────────────────────────────────────────────

type ChatEvent =
  | { type: 'sources'; sources: import('../types').Source[] }
  | { type: 'delta';   delta:   string }
  | { type: 'done' }
  | { type: 'error';   error:   string }

export async function ragChat(
  params: {
    question:           string
    documentIds?:       string[]
    topK?:              number
    similarityThreshold?: number
    history?:           { role: string; content: string }[]
  },
  onEvent: (event: ChatEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const auth = await getAuthHeader()
  const res  = await fetch(`${SERVER_URL}/chat`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body:    JSON.stringify(params),
    signal,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err.error ?? `Server error ${res.status}`)
  }

  const reader  = res.body!.getReader()
  const decoder = new TextDecoder()
  let   buffer  = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try { onEvent(JSON.parse(line.slice(6)) as ChatEvent) } catch { /* skip */ }
    }
  }
}

// ── Edge function: semantic search ───────────────────────────────────────────

export async function semanticSearch(params: {
  query:               string
  documentIds?:        string[]
  topK?:               number
  similarityThreshold?: number
}): Promise<import('../types').SearchResult[]> {
  const auth = await getAuthHeader()
  const res  = await fetch(`${SERVER_URL}/search`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body:    JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err.error ?? `Server error ${res.status}`)
  }
  const data = await res.json() as { results: { score: number; document_name: string; document_id: string; page: number; chunk_id: string; text: string }[] }
  return data.results.map((r) => ({
    score:         r.score,
    document_name: r.document_name,
    document_id:   r.document_id,
    page:          r.page,
    chunk_id:      r.chunk_id,
    text:          r.text,
  }))
}

// ── Row mappers ───────────────────────────────────────────────────────────────

function rowToDocument(row: Record<string, unknown>): Document {
  return {
    id:          row.id as string,
    name:        row.name as string,
    type:        row.type as Document['type'],
    size:        row.size as number,
    pages:       row.pages as number,
    chunks:      row.chunks as number,
    status:      row.status as Document['status'],
    description: row.description as string | undefined,
    uploadedAt:  new Date(row.uploaded_at as string),
    indexedAt:   row.indexed_at ? new Date(row.indexed_at as string) : undefined,
  }
}

function documentToRow(doc: Document): Record<string, unknown> {
  return {
    id:          doc.id,
    name:        doc.name,
    type:        doc.type,
    size:        doc.size,
    pages:       doc.pages,
    chunks:      doc.chunks,
    status:      doc.status,
    description: doc.description ?? null,
    uploaded_at: doc.uploadedAt.toISOString(),
    indexed_at:  doc.indexedAt?.toISOString() ?? null,
  }
}

function rowToConversation(row: Record<string, unknown>): Conversation {
  const msgs = (row.messages as Record<string, unknown>[]) ?? []
  return {
    id:          row.id as string,
    title:       row.title as string,
    documentIds: (row.document_ids as string[]) ?? [],
    messages:    msgs.map((m) => ({
      id:            m.id as string,
      role:          m.role as 'user' | 'assistant',
      content:       m.content as string,
      sources:       m.sources as import('../types').Source[] | undefined,
      retrievalInfo: m.retrievalInfo as import('../types').ChatMessage['retrievalInfo'],
      timestamp:     new Date(m.timestamp as string),
    })),
    createdAt:   new Date(row.created_at as string),
    updatedAt:   new Date(row.updated_at as string),
  }
}

function conversationToRow(conv: Conversation): Record<string, unknown> {
  return {
    id:           conv.id,
    title:        conv.title,
    document_ids: conv.documentIds,
    messages:     conv.messages.map((m) => ({
      id:            m.id,
      role:          m.role,
      content:       m.content,
      sources:       m.sources ?? null,
      retrievalInfo: m.retrievalInfo ?? null,
      timestamp:     m.timestamp.toISOString(),
    })),
    updated_at:   conv.updatedAt.toISOString(),
  }
}
