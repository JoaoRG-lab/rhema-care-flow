-- ============================================================
-- Rhema Care Flow — Migration 003: Row Level Security (RLS)
-- ============================================================

-- Helper: role do usuario atual
create or replace function public.my_role()
returns user_role language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select (select role from public.profiles where id = auth.uid()) = 'admin';
$$;

-- ---- PROFILES ------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles: leitura propria" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles: atualiza propria" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: admin tudo" on public.profiles
  for all using (public.is_admin());

-- ---- PATIENTS ------------------------------------------------
alter table public.patients enable row level security;

create policy "patients: todos leem" on public.patients
  for select using (auth.role() = 'authenticated');

create policy "patients: medico/admin escrevem" on public.patients
  for insert with check (public.my_role() in ('admin','medico'));

create policy "patients: medico/admin atualizam" on public.patients
  for update using (public.my_role() in ('admin','medico'));

create policy "patients: admin desativa" on public.patients
  for delete using (public.is_admin());

-- ---- VISITS --------------------------------------------------
alter table public.visits enable row level security;

create policy "visits: todos leem" on public.visits
  for select using (auth.role() = 'authenticated');

create policy "visits: medico/admin escrevem" on public.visits
  for all using (public.my_role() in ('admin','medico'));

-- ---- PRONTUARIO ---------------------------------------------
alter table public.prontuario enable row level security;

create policy "prontuario: todos leem" on public.prontuario
  for select using (auth.role() = 'authenticated');

create policy "prontuario: medico/admin escrevem" on public.prontuario
  for all using (public.my_role() in ('admin','medico'));

-- ---- SCORES -------------------------------------------------
alter table public.scores enable row level security;

create policy "scores: todos leem" on public.scores
  for select using (auth.role() = 'authenticated');

create policy "scores: medico/admin escrevem" on public.scores
  for all using (public.my_role() in ('admin','medico'));

-- ---- EXAMS --------------------------------------------------
alter table public.exams enable row level security;

create policy "exams: todos leem" on public.exams
  for select using (auth.role() = 'authenticated');

create policy "exams: medico/admin sobem" on public.exams
  for all using (public.my_role() in ('admin','medico'));

-- ---- NOTIFICATIONS ------------------------------------------
alter table public.notifications enable row level security;

create policy "notifications: proprias" on public.notifications
  for all using (user_id = auth.uid());

-- ---- AUDIT LOGS (somente leitura para admin) ----------------
alter table public.audit_logs enable row level security;

create policy "audit: admin le" on public.audit_logs
  for select using (public.is_admin());

create policy "audit: sistema insere" on public.audit_logs
  for insert with check (true);

-- ---- APPOINTMENTS -------------------------------------------
alter table public.appointments enable row level security;

create policy "appt: todos leem" on public.appointments
  for select using (auth.role() = 'authenticated');

create policy "appt: medico/admin escrevem" on public.appointments
  for all using (public.my_role() in ('admin','medico'));
