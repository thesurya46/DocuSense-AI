import type { Document, ChatMessage, Conversation, SearchResult } from '../types'

export const DEMO_DOCUMENTS: Document[] = [
  {
    id: 'doc_001',
    name: 'NLP Architecture Paper 2024.pdf',
    type: 'pdf',
    size: 2_840_000,
    pages: 18,
    chunks: 94,
    status: 'indexed',
    uploadedAt: new Date('2024-11-14T10:22:00'),
    indexedAt: new Date('2024-11-14T10:22:47'),
    description: 'Hybrid retrieval architecture for large-scale document intelligence',
  },
  {
    id: 'doc_002',
    name: 'Evaluation Framework v3.md',
    type: 'md',
    size: 145_000,
    pages: 1,
    chunks: 31,
    status: 'indexed',
    uploadedAt: new Date('2024-11-12T14:05:00'),
    indexedAt: new Date('2024-11-12T14:05:09'),
    description: 'RAG evaluation methodology — precision, recall, citation accuracy',
  },
  {
    id: 'doc_003',
    name: 'Annual Research Report 2024.pdf',
    type: 'pdf',
    size: 5_210_000,
    pages: 42,
    chunks: 187,
    status: 'indexed',
    uploadedAt: new Date('2024-11-10T09:15:00'),
    indexedAt: new Date('2024-11-10T09:16:22'),
    description: 'Nexus Research Institute — full-year outcomes, programs, and financials',
  },
  {
    id: 'doc_004',
    name: 'Team Guidelines Q4.docx',
    type: 'docx',
    size: 380_000,
    pages: 7,
    chunks: 38,
    status: 'indexed',
    uploadedAt: new Date('2024-11-08T16:40:00'),
    indexedAt: new Date('2024-11-08T16:40:28'),
    description: 'Engineering team processes, code review standards, on-call policies',
  },
  {
    id: 'doc_005',
    name: 'Dataset Curation Notes.txt',
    type: 'txt',
    size: 92_000,
    pages: 1,
    chunks: 22,
    status: 'indexed',
    uploadedAt: new Date('2024-11-07T11:30:00'),
    indexedAt: new Date('2024-11-07T11:30:07'),
    description: 'Internal notes on benchmark dataset construction and filtering criteria',
  },
]

export const DEMO_SOURCES = {
  nlp_accuracy: {
    source_id: 'Source 1',
    document_id: 'doc_001',
    document_name: 'NLP Architecture Paper 2024.pdf',
    page: 9,
    chunk_id: 'doc_001_chunk_41',
    score: 0.94,
    text: 'The proposed hybrid retrieval architecture achieves an accuracy of 94.2% on the HotpotQA benchmark, outperforming the previous state-of-the-art by 3.1 percentage points. Notably, the model maintains sub-50ms latency at p99 under production load conditions, making it suitable for real-time document intelligence applications.',
  },
  nlp_methodology: {
    source_id: 'Source 2',
    document_id: 'doc_001',
    document_name: 'NLP Architecture Paper 2024.pdf',
    page: 4,
    chunk_id: 'doc_001_chunk_18',
    score: 0.91,
    text: 'Our methodology combines dense passage retrieval (DPR) with a cross-encoder reranking stage. Documents are split into 512-token chunks with 64-token overlap, preserving paragraph boundaries where possible. Each chunk is encoded using a fine-tuned text-embedding-3-small model and stored in a persistent ChromaDB collection. At query time, the top-20 candidates are retrieved by cosine similarity before the reranker selects the final top-5.',
  },
  eval_precision: {
    source_id: 'Source 3',
    document_id: 'doc_002',
    document_name: 'Evaluation Framework v3.md',
    page: 1,
    chunk_id: 'doc_002_chunk_07',
    score: 0.88,
    text: 'Retrieval precision is computed as the fraction of retrieved chunks that are judged relevant by human annotators. Our evaluation set consists of 200 question-answer pairs across five domains. A chunk is considered relevant if it contains the evidence necessary to answer the question, as determined by majority vote among three independent raters (Cohen\'s κ = 0.82).',
  },
  report_findings: {
    source_id: 'Source 1',
    document_id: 'doc_003',
    document_name: 'Annual Research Report 2024.pdf',
    page: 6,
    chunk_id: 'doc_003_chunk_22',
    score: 0.92,
    text: 'The 2024 program cohort produced 14 peer-reviewed publications, a 40% increase over the prior year. Key research themes included retrieval-augmented generation, multimodal understanding, and low-resource language modeling. Three projects received additional funding from the National Science Foundation totaling $2.4M.',
  },
  report_limitations: {
    source_id: 'Source 2',
    document_id: 'doc_003',
    document_name: 'Annual Research Report 2024.pdf',
    page: 31,
    chunk_id: 'doc_003_chunk_118',
    score: 0.85,
    text: 'Several limitations were identified during the evaluation phase. First, performance degrades on documents with complex multi-column layouts common in legal and financial PDFs. Second, cross-document reasoning — where the answer requires synthesizing information from multiple sources — remains an open challenge. Future work will explore multi-hop retrieval chains.',
  },
}

export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_001',
    title: 'NLP architecture accuracy',
    documentIds: ['doc_001', 'doc_002'],
    createdAt: new Date('2024-11-14T11:00:00'),
    updatedAt: new Date('2024-11-14T11:04:00'),
    messages: [
      {
        id: 'msg_001',
        role: 'user',
        content: 'What accuracy does the NLP architecture achieve on benchmarks?',
        timestamp: new Date('2024-11-14T11:00:30'),
      },
      {
        id: 'msg_002',
        role: 'assistant',
        content:
          'The hybrid retrieval architecture achieves **94.2% accuracy** on the HotpotQA benchmark, outperforming the previous state-of-the-art by 3.1 percentage points. [Source 1]\n\nImportantly, it maintains sub-50ms latency at p99 under production load, making it viable for real-time applications. [Source 1]\n\nThe methodology uses dense passage retrieval combined with a cross-encoder reranking stage, with top-20 candidates retrieved before the reranker selects the final top-5. [Source 2]',
        sources: [DEMO_SOURCES.nlp_accuracy, DEMO_SOURCES.nlp_methodology],
        timestamp: new Date('2024-11-14T11:00:38'),
        retrievalInfo: { topK: 5, retrieved: 5, filtered: 3, avgScore: 0.925 },
      },
    ],
  },
  {
    id: 'conv_002',
    title: 'Annual report key findings',
    documentIds: ['doc_003'],
    createdAt: new Date('2024-11-13T15:30:00'),
    updatedAt: new Date('2024-11-13T15:35:00'),
    messages: [
      {
        id: 'msg_003',
        role: 'user',
        content: 'What were the key findings in the 2024 annual report?',
        timestamp: new Date('2024-11-13T15:30:20'),
      },
      {
        id: 'msg_004',
        role: 'assistant',
        content:
          'The 2024 annual report highlights several significant achievements:\n\n- **14 peer-reviewed publications** were produced by the program cohort — a 40% increase over the prior year. [Source 1]\n- Research themes centered on retrieval-augmented generation, multimodal understanding, and low-resource language modeling. [Source 1]\n- Three projects received NSF funding totaling **$2.4M**. [Source 1]\n\nThe report also identifies limitations: performance degrades on complex multi-column PDF layouts, and cross-document reasoning remains an open challenge. [Source 2]',
        sources: [DEMO_SOURCES.report_findings, DEMO_SOURCES.report_limitations],
        timestamp: new Date('2024-11-13T15:30:31'),
        retrievalInfo: { topK: 5, retrieved: 5, filtered: 4, avgScore: 0.885 },
      },
    ],
  },
]

export const DEMO_SEARCH_RESULTS: SearchResult[] = [
  {
    score: 0.941,
    document_name: 'NLP Architecture Paper 2024.pdf',
    document_id: 'doc_001',
    page: 9,
    chunk_id: 'doc_001_chunk_41',
    section: 'Results',
    text: 'The proposed hybrid retrieval architecture achieves an accuracy of 94.2% on the HotpotQA benchmark, outperforming the previous state-of-the-art by 3.1 percentage points...',
  },
  {
    score: 0.912,
    document_name: 'NLP Architecture Paper 2024.pdf',
    document_id: 'doc_001',
    page: 4,
    chunk_id: 'doc_001_chunk_18',
    section: 'Methodology',
    text: 'Our methodology combines dense passage retrieval (DPR) with a cross-encoder reranking stage. Documents are split into 512-token chunks with 64-token overlap...',
  },
  {
    score: 0.876,
    document_name: 'Evaluation Framework v3.md',
    document_id: 'doc_002',
    page: 1,
    chunk_id: 'doc_002_chunk_07',
    section: 'Retrieval Metrics',
    text: 'Retrieval precision is computed as the fraction of retrieved chunks that are judged relevant by human annotators. Our evaluation set consists of 200 question-answer pairs...',
  },
  {
    score: 0.834,
    document_name: 'Annual Research Report 2024.pdf',
    document_id: 'doc_003',
    page: 6,
    chunk_id: 'doc_003_chunk_22',
    section: 'Program Outcomes',
    text: 'The 2024 program cohort produced 14 peer-reviewed publications, a 40% increase over the prior year. Key research themes included retrieval-augmented generation...',
  },
  {
    score: 0.791,
    document_name: 'Dataset Curation Notes.txt',
    document_id: 'doc_005',
    page: 1,
    chunk_id: 'doc_005_chunk_04',
    section: undefined,
    text: 'Benchmark questions were filtered to ensure they require evidence from the document rather than general world knowledge. Questions with ambiguous ground truth were removed...',
  },
]

export const SUGGESTED_QUESTIONS = [
  'What accuracy does the NLP model achieve?',
  'What methodology was used for retrieval?',
  'What were the key findings in 2024?',
  'What limitations were identified?',
  'How is retrieval precision measured?',
  'What is the capital of Japan?',
]

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
