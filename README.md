# 🧠 DocuSense-AI 

> A Retrieval-Augmented Generation (RAG) Document Intelligence System — upload documents, ask questions, and get AI-powered answers with cited sources.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?logo=tailwindcss&logoColor=white)

---

## 📌 Overview

**DocuSense-AI** is a full-stack RAG (Retrieval-Augmented Generation) application that allows users to:

- Upload documents (PDF, DOCX, TXT, Markdown)
- Automatically chunk, embed, and index them into a vector store
- Ask natural language questions and get AI answers with source citations
- Perform semantic search across all uploaded documents
- Evaluate retrieval quality with precision/recall metrics

---

## ✨ Features

| Feature                   | Description                                             |
| ------------------------- | ------------------------------------------------------- |
| 📄 **Document Upload**    | Supports PDF, DOCX, TXT, and Markdown files             |
| 🔍 **Semantic Search**    | Vector similarity search across all documents           |
| 💬 **AI Chat**            | Conversational Q&A with cited source references         |
| 📊 **Dashboard**          | Overview of indexed documents and system stats          |
| 🧪 **Evaluation**         | Built-in RAG evaluation with precision & recall metrics |
| 👤 **Authentication**     | User auth via Supabase (sign up / sign in)              |
| ⚙️ **Settings & Profile** | Manage API keys, preferences, and account details       |

---

## 🗂️ Project Structure

```
DocuSense-AI/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # App pages (Chat, Dashboard, Documents, Search, Evaluate, Auth, Profile, Settings)
│   ├── lib/              # Core logic
│   │   ├── rag.ts        # RAG pipeline (chunking, retrieval, generation)
│   │   ├── supabase.ts   # Supabase DB client & queries
│   │   ├── openai.ts     # OpenAI API integration
│   │   ├── storage.ts    # File storage helpers
│   │   └── fileParser.ts # PDF / DOCX / TXT parser
│   ├── data/
│   │   └── demo.ts       # Demo documents, conversations & search results
│   ├── types.ts          # Shared TypeScript types
│   ├── App.tsx           # Root component & routing
│   └── main.tsx          # App entry point
├── supabase/
│   ├── schema.sql        # Database schema (tables + vector indexes)
│   └── functions/        # Supabase Edge Functions
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, TailwindCSS 4
- **Build Tool**: Vite 8
- **Backend / Database**: Supabase (Postgres + pgvector)
- **AI / Embeddings**: OpenAI API (embeddings + chat completion)
- **Document Parsing**: `pdfjs-dist`, `mammoth` (for DOCX)
- **Package Manager**: pnpm

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) — `npm install -g pnpm`
- A [Supabase](https://supabase.com/) project
- An [OpenAI](https://platform.openai.com/) API key

### 1. Clone the repository

```bash
git clone https://github.com/thesurya46/DocuSense-AI.git
cd DocuSense-AI
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

### 4. Set up the database

Run the SQL schema in your Supabase project's SQL editor:

```bash
# Open supabase/schema.sql and execute it in the Supabase dashboard
```

### 5. Start the development server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Available Scripts

| Command        | Description                        |
| -------------- | ---------------------------------- |
| `pnpm dev`     | Start the local development server |
| `pnpm build`   | Build for production               |
| `pnpm preview` | Preview the production build       |
| `pnpm format`  | Format code with oxfmt             |

---

## 🔑 How It Works

```
User uploads file
       ↓
File is parsed (PDF/DOCX/TXT/MD)
       ↓
Text split into chunks (512 tokens, 64-token overlap)
       ↓
Each chunk embedded via OpenAI text-embedding model
       ↓
Embeddings stored in Supabase (pgvector)
       ↓
User asks a question
       ↓
Query embedded → Top-K chunks retrieved by cosine similarity
       ↓
Retrieved chunks passed to OpenAI chat model as context
       ↓
AI response returned with source citations
```

---

## 📄 License

This project is for educational and personal use. Feel free to fork and build upon it.

---

## 🙋‍♂️ Author

**thesurya46** — [GitHub](https://github.com/thesurya46)
