-- Tabela de conversas com a IA clínica
create table if not exists public.ai_conversations (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null,
  user_id      uuid not null references auth.users(id) on delete cascade,
  patient_id   uuid references public.patients(id) on delete set null,
  role         text not null check (role in ('user', 'assistant', 'system')),
  content      text not null,
  created_at   timestamptz not null default now()
);

-- Índices para queries frequentes
create index if not exists idx_ai_conversations_session on public.ai_conversations(session_id);
create index if not exists idx_ai_conversations_user on public.ai_conversations(user_id);
create index if not exists idx_ai_conversations_patient on public.ai_conversations(patient_id);
create index if not exists idx_ai_conversations_created on public.ai_conversations(created_at desc);

-- RLS: usuário só vê suas próprias conversas
alter table public.ai_conversations enable row level security;

create policy "users_own_conversations" on public.ai_conversations
  for all using (auth.uid() = user_id);

-- Comentário
comment on table public.ai_conversations is
  'Histórico de conversas entre profissionais de saúde e o assistente clínico IA (GPT-4o).';
