-- ============================================================
-- RAG Dual Brain — UHS Health OS
-- Cérebro Global (conhecimento médico) + Cérebro Privado (prontuários)
-- ============================================================

-- 1. Habilita extensão pgvector
create extension if not exists vector with schema extensions;

-- ============================================================
-- 2. CÉREBRO GLOBAL — global_embeddings
--    Indexa: education_content + knowledge_contributions
--    Acesso: qualquer médico autenticado (SELECT público c/ RLS)
-- ============================================================
create table if not exists public.global_embeddings (
  id            uuid primary key default gen_random_uuid(),

  -- Origem do documento
  source_table  text not null check (source_table in ('education_content','knowledge_contributions')),
  source_id     uuid not null,

  -- Texto original (chunk) que gerou o embedding
  chunk_index   int  not null default 0,        -- índice do chunk dentro do documento
  chunk_text    text not null,                   -- texto bruto do chunk (para exibir no contexto)

  -- Metadados de filtragem rápida
  specialty     text,
  category      text,
  title         text,
  tags          text[],

  -- Vetor (text-embedding-3-small = 1536 dims)
  embedding     extensions.vector(1536),

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (source_table, source_id, chunk_index)
);

-- Índice HNSW para busca por cosseno (melhor performance que IVFFlat em datasets < 1M)
create index if not exists global_embeddings_hnsw_idx
  on public.global_embeddings
  using hnsw (embedding extensions.vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- RLS: leitura para qualquer usuário autenticado
alter table public.global_embeddings enable row level security;

create policy "global_embeddings: autenticados podem ler"
  on public.global_embeddings
  for select
  using (auth.role() = 'authenticated');

-- Apenas service role pode inserir/atualizar (via Edge Function de indexação)
create policy "global_embeddings: service role escreve"
  on public.global_embeddings
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ============================================================
-- 3. CÉREBRO PRIVADO — patient_embeddings
--    Indexa: patient_cards.notes + visits.next_steps + disease_activity
--    Acesso: ESTRITO — somente o médico dono do registro (user_id = auth.uid())
-- ============================================================
create table if not exists public.patient_embeddings (
  id              uuid primary key default gen_random_uuid(),

  -- Propriedade — essencial para RLS
  user_id         uuid not null references auth.users(id) on delete cascade,

  -- Origem do documento clínico
  source_table    text not null check (source_table in ('patient_cards','visits')),
  source_id       uuid not null,

  chunk_index     int  not null default 0,
  chunk_text      text not null,               -- anotação/trecho clínico anonimizado

  -- Metadados para filtragem
  patient_code    text,                        -- patient_cards.patient_code (nunca nome real)
  visit_date      date,                        -- data da visita (quando source=visits)

  embedding       extensions.vector(1536),

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (source_table, source_id, chunk_index)
);

-- Índice HNSW particionado por user_id (filtragem antes da busca vetorial)
create index if not exists patient_embeddings_hnsw_idx
  on public.patient_embeddings
  using hnsw (embedding extensions.vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create index if not exists patient_embeddings_user_idx
  on public.patient_embeddings (user_id);

-- RLS ESTRITA: médico só acessa seus próprios vetores
alter table public.patient_embeddings enable row level security;

create policy "patient_embeddings: somente próprio user_id"
  on public.patient_embeddings
  for select
  using (auth.uid() = user_id);

create policy "patient_embeddings: service role escreve"
  on public.patient_embeddings
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ============================================================
-- 4. RPC — match_global_documents
--    Busca por similaridade de cosseno no Cérebro Global
--    Aberta a qualquer médico autenticado
-- ============================================================
create or replace function public.match_global_documents(
  query_embedding  extensions.vector(1536),
  match_threshold  float   default 0.70,
  match_count      int     default 8,
  filter_specialty text    default null,
  filter_category  text    default null
)
returns table (
  id           uuid,
  source_table text,
  source_id    uuid,
  chunk_index  int,
  chunk_text   text,
  title        text,
  specialty    text,
  category     text,
  tags         text[],
  similarity   float
)
language sql
stable
security definer   -- executa como owner, mas RLS já garante que só autenticados chegam aqui
set search_path = public, extensions
as $$
  select
    ge.id,
    ge.source_table,
    ge.source_id,
    ge.chunk_index,
    ge.chunk_text,
    ge.title,
    ge.specialty,
    ge.category,
    ge.tags,
    1 - (ge.embedding <=> query_embedding) as similarity
  from public.global_embeddings ge
  where
    (filter_specialty is null or ge.specialty = filter_specialty)
    and (filter_category is null or ge.category = filter_category)
    and 1 - (ge.embedding <=> query_embedding) > match_threshold
  order by ge.embedding <=> query_embedding
  limit match_count;
$$;

-- Permissão: qualquer role autenticada pode chamar
grant execute on function public.match_global_documents to authenticated;


-- ============================================================
-- 5. RPC — match_patient_records
--    Busca por similaridade no Cérebro Privado
--    RLS automática: só retorna vetores do auth.uid() corrente
-- ============================================================
create or replace function public.match_patient_records(
  query_embedding  extensions.vector(1536),
  match_threshold  float   default 0.65,
  match_count      int     default 5,
  filter_patient   text    default null   -- filtra por patient_code específico
)
returns table (
  id           uuid,
  source_table text,
  source_id    uuid,
  chunk_index  int,
  chunk_text   text,
  patient_code text,
  visit_date   date,
  similarity   float
)
language sql
stable
-- NÃO usa security definer: a função roda como o usuário autenticado,
-- então a política RLS "auth.uid() = user_id" é aplicada automaticamente
set search_path = public, extensions
as $$
  select
    pe.id,
    pe.source_table,
    pe.source_id,
    pe.chunk_index,
    pe.chunk_text,
    pe.patient_code,
    pe.visit_date,
    1 - (pe.embedding <=> query_embedding) as similarity
  from public.patient_embeddings pe
  where
    pe.user_id = auth.uid()                       -- redundância explícita (defense in depth)
    and (filter_patient is null or pe.patient_code = filter_patient)
    and 1 - (pe.embedding <=> query_embedding) > match_threshold
  order by pe.embedding <=> query_embedding
  limit match_count;
$$;

grant execute on function public.match_patient_records to authenticated;


-- ============================================================
-- 6. Tabela de log de queries RAG (auditoria + analytics)
-- ============================================================
create table if not exists public.rag_query_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  query_text    text not null,
  sources_used  text[],                 -- ['global','patient']
  global_hits   int default 0,
  patient_hits  int default 0,
  model         text,
  latency_ms    int,
  created_at    timestamptz not null default now()
);

alter table public.rag_query_log enable row level security;

create policy "rag_query_log: somente próprio user"
  on public.rag_query_log
  for select
  using (auth.uid() = user_id);

create policy "rag_query_log: service role escreve"
  on public.rag_query_log
  for insert
  with check (auth.role() = 'service_role');
