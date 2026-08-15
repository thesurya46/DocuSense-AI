export type DocumentStatus = 'uploading' | 'extracting' | 'chunking' | 'embedding' | 'indexed' | 'error'

export interface Document {
  id: string
  name: string
  type: 'pdf' | 'docx' | 'txt' | 'md'
  size: number
  pages: number
  chunks: number
  status: DocumentStatus
  uploadedAt: Date
  indexedAt?: Date
  description?: string
}

export interface Chunk {
  chunk_id: string
  document_id: string
  document_name: string
  page: number
  section?: string
  text: string
  score?: number
}

export interface Source {
  source_id: string
  document_id: string
  document_name: string
  page: number
  chunk_id: string
  text: string
  score?: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  timestamp: Date
  retrievalInfo?: {
    topK: number
    retrieved: number
    filtered: number
    avgScore: number
  }
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  documentIds: string[]
  createdAt: Date
  updatedAt: Date
}

export interface SearchResult {
  score: number
  document_name: string
  document_id: string
  page: number
  chunk_id: string
  text: string
  section?: string
}

export type Page = 'dashboard' | 'documents' | 'chat' | 'search' | 'evaluate' | 'settings' | 'profile'

export type PipelineStage =
  | 'idle'
  | 'embedding'
  | 'searching'
  | 'filtering'
  | 'reranking'
  | 'generating'
  | 'done'
