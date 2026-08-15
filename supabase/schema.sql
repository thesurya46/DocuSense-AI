-- ============================================================
-- RAG Intel — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Documents table
create table if not exists documents (
  id           text primary key,
  name         text not null,
  type         text not null check (type in ('pdf','docx','txt','md')),
  size         bigint not null default 0,
  pages        int not null default 1,
  chunks       int not null default 0,
  status       text not null default 'indexed'
               check (status in ('uploading','extracting','chunking','embedding','indexed','error')),
  description  text,
  uploaded_at  timestamptz not null default now(),
  indexed_at   timestamptz,
  user_id      uuid references auth.users(id) on delete cascade
);

-- 3. Chunks table — stores text + 1536-dim embedding (text-embedding-3-small)
create table if not exists chunks (
  id            text primary key,
  document_id   text not null references documents(id) on delete cascade,
  document_name text not null,
  text          text not null,
  page          int not null default 1,
  chunk_index   int not null default 0,
  embedding     vector(1536),
  user_id       uuid references auth.users(id) on delete cascade
);

-- 4. Conversations table — messages stored as JSONB for simplicity
create table if not exists conversations (
  id           text primary key,
  title        text not null default 'New conversation',
  document_ids text[] not null default '{}',
  messages     jsonb not null default '[]',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  user_id      uuid references auth.users(id) on delete cascade
);

-- 5. Vector similarity search function (cosine distance via pgvector)
create or replace function match_chunks(
  query_embedding  vector(1536),
  match_threshold  float,
  match_count      int,
  filter_doc_ids   text[]  default null,
  filter_user_id   uuid    default null
)
returns table (
  id            text,
  document_id   text,
  document_name text,
  text          text,
  page          int,
  chunk_index   int,
  similarity    float
)
language sql stable
as $$
  select
    c.id,
    c.document_id,
    c.document_name,
    c.text,
    c.page,
    c.chunk_index,
    1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  where
    (filter_user_id is null or c.user_id = filter_user_id)
    and (filter_doc_ids is null or c.document_id = any(filter_doc_ids))
    and 1 - (c.embedding <=> query_embedding) >= match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- 6. HNSW index for fast approximate nearest-neighbour search
create index if not exists chunks_embedding_idx
  on chunks using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- 7. Supporting indexes
create index if not exists chunks_document_id_idx  on chunks(document_id);
create index if not exists chunks_user_id_idx      on chunks(user_id);
create index if not exists documents_user_id_idx   on documents(user_id);
create index if not exists conversations_user_id_idx on conversations(user_id);

-- 8. Row Level Security — users only access their own rows
alter table documents     enable row level security;
alter table chunks        enable row level security;
alter table conversations enable row level security;

create policy "documents: own rows"
  on documents for all using (auth.uid() = user_id);

create policy "chunks: own rows"
  on chunks for all using (auth.uid() = user_id);

create policy "conversations: own rows"
  on conversations for all using (auth.uid() = user_id);
