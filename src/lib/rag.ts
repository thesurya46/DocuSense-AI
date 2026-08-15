import type { StoredChunk } from './storage'
import type { Source } from '../types'

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}

export function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const charsPerChunk = chunkSize * 4
  const overlapChars = overlap * 4
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  const chunks: string[] = []
  let current = ''

  for (const para of paragraphs) {
    const candidate = current ? current + '\n\n' + para : para
    if (candidate.length > charsPerChunk && current.length > 0) {
      chunks.push(current.trim())
      current = current.slice(-overlapChars) + '\n\n' + para
    } else {
      current = candidate
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

export interface RetrievedChunk {
  chunk: StoredChunk
  score: number
}

export function retrieveTopK(
  queryEmbedding: number[],
  chunks: StoredChunk[],
  topK: number,
  threshold: number,
  docIds?: string[]
): RetrievedChunk[] {
  const pool = docIds?.length ? chunks.filter((c) => docIds.includes(c.documentId)) : chunks
  return pool
    .filter((c) => c.embedding?.length > 0)
    .map((c) => ({ chunk: c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
    .filter((r) => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

export function buildSystemPrompt(retrieved: RetrievedChunk[]): string {
  if (retrieved.length === 0) {
    return 'You are a document assistant. No relevant passages were found above the similarity threshold. Politely tell the user their question cannot be answered from the indexed documents and suggest they lower the similarity threshold or upload relevant documents.'
  }
  const context = retrieved
    .map((r, i) => `[Source ${i + 1}] ${r.chunk.documentName} (page ${r.chunk.page}):\n${r.chunk.text}`)
    .join('\n\n---\n\n')

  return `You are a precise document intelligence assistant. Answer the user's question using ONLY the document excerpts below.

Rules:
- Cite inline with [Source N] immediately after each claim
- If the answer is not in the excerpts, say so — never hallucinate
- Be concise and factual
- Use **bold** for key terms, numbers, or findings
- Numbered lists for multi-part answers

Document excerpts:
${context}`
}

export function chunksToSources(retrieved: RetrievedChunk[]): Source[] {
  return retrieved.map((r, i) => ({
    source_id: `Source ${i + 1}`,
    document_id: r.chunk.documentId,
    document_name: r.chunk.documentName,
    page: r.chunk.page,
    chunk_id: r.chunk.id,
    text: r.chunk.text,
    score: r.score,
  }))
}
