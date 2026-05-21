-- ================================================================
-- Rhema Care Flow — Tabela notifications + RLS
-- ================================================================
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  body       text,
  type       text not null check (type in ('info','warning','success','error')) default 'info',
  read       boolean not null default false,
  link       text,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

-- Usuarios so veem as proprias notificacoes
create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

-- Admins e sistema (service_role) podem inserir para qualquer usuario
create policy "notifications_insert_admin"
  on public.notifications for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or auth.user_role() = 'admin'
  );

-- Cada usuario pode marcar as proprias como lidas
create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
