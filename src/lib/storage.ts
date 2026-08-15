import type { Document, Conversation } from '../types'

export interface StoredChunk {
  id: string
  documentId: string
  documentName: string
  text: string
  page: number
  chunkIndex: number
  embedding: number[]
}

export interface Settings {
  apiKey: string
  llmModel: string
  embeddingModel: string
  chunkSize: number
  chunkOverlap: number
  topK: number
  similarityThreshold: number
  maxFileSizeMb: number
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  llmModel: 'gpt-4o-mini',
  embeddingModel: 'text-embedding-3-small',
  chunkSize: 500,
  chunkOverlap: 50,
  topK: 5,
  similarityThreshold: 0.70,
  maxFileSizeMb: 25,
}

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function set(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('localStorage quota exceeded:', e)
  }
}

const K = {
  settings: 'ri_settings',
  documents: 'ri_documents',
  chunks: 'ri_chunks',
  conversations: 'ri_conversations',
}

export const storage = {
  getSettings(): Settings {
    return { ...DEFAULT_SETTINGS, ...get<Partial<Settings>>(K.settings, {}) }
  },
  saveSettings(s: Settings): void {
    set(K.settings, s)
  },

  getDocuments(): Document[] {
    const docs = get<Document[]>(K.documents, [])
    return docs.map((d) => ({
      ...d,
      uploadedAt: new Date(d.uploadedAt),
      indexedAt: d.indexedAt ? new Date(d.indexedAt) : undefined,
    }))
  },
  saveDocuments(docs: Document[]): void {
    set(K.documents, docs)
  },

  getChunks(): StoredChunk[] {
    return get<StoredChunk[]>(K.chunks, [])
  },
  saveChunks(chunks: StoredChunk[]): void {
    set(K.chunks, chunks)
  },
  addChunks(newChunks: StoredChunk[]): void {
    const existing = this.getChunks()
    set(K.chunks, [...existing, ...newChunks])
  },
  removeChunksByDoc(docId: string): void {
    const existing = this.getChunks()
    set(K.chunks, existing.filter((c) => c.documentId !== docId))
  },

  getConversations(): Conversation[] {
    const convs = get<Conversation[]>(K.conversations, [])
    return convs.map((c) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: c.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
    }))
  },
  saveConversations(convs: Conversation[]): void {
    set(K.conversations, convs)
  },
}
