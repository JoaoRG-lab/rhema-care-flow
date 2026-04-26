-- Tabela para armazenar IDs e tokens Memed por médico
create table if not exists public.memed_users (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  memed_user_id text,
  token       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- RLS: apenas o próprio usuário pode ver seu registro
alter table public.memed_users enable row level security;

create policy "memed_users: own row"
  on public.memed_users
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index
create index if not exists memed_users_user_id_idx on public.memed_users(user_id);
