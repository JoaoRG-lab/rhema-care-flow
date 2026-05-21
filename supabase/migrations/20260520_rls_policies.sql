-- ================================================================
-- Rhema Care Flow — RLS Policies
-- Executa em: supabase db push  ou  Dashboard > SQL Editor
-- ================================================================

-- ── Helpers ──────────────────────────────────────────────────────

-- Retorna o role do usuario autenticado (cached por transacao)
create or replace function auth.user_role()
returns text
language sql stable
security definer
as $$
  select role from user_roles where user_id = auth.uid() limit 1;
$$;

-- ── PROFILES ─────────────────────────────────────────────────────
alter table profiles enable row level security;

-- Qualquer usuario autenticado le todos os perfis (necessario para joins autor)
create policy "profiles_select"
  on profiles for select
  to authenticated
  using (true);

-- Cada usuario edita apenas o proprio perfil
create policy "profiles_update_own"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admin pode tudo
create policy "profiles_admin_all"
  on profiles for all
  to authenticated
  using (auth.user_role() = 'admin')
  with check (auth.user_role() = 'admin');

-- ── USER_ROLES ───────────────────────────────────────────────────
alter table user_roles enable row level security;

create policy "user_roles_select"
  on user_roles for select
  to authenticated
  using (user_id = auth.uid() or auth.user_role() = 'admin');

create policy "user_roles_admin"
  on user_roles for all
  to authenticated
  using (auth.user_role() = 'admin')
  with check (auth.user_role() = 'admin');

-- ── PATIENT_CARDS ────────────────────────────────────────────────
alter table patient_cards enable row level security;

-- Clinicos (medico, enfermeiro, recepcao, admin) leem todos os pacientes
create policy "patient_cards_clinicians_select"
  on patient_cards for select
  to authenticated
  using (
    auth.user_role() in ('admin','medico','enfermeiro','recepcao')
  );

-- Paciente le apenas o proprio cartao
create policy "patient_cards_patient_select"
  on patient_cards for select
  to authenticated
  using (
    auth.user_role() = 'paciente'
    and email = (select email from profiles where id = auth.uid() limit 1)
  );

-- Apenas admin, medico e recepcao podem criar/editar
create policy "patient_cards_write"
  on patient_cards for insert
  to authenticated
  with check (auth.user_role() in ('admin','medico','recepcao'));

create policy "patient_cards_update"
  on patient_cards for update
  to authenticated
  using  (auth.user_role() in ('admin','medico','recepcao'))
  with check (auth.user_role() in ('admin','medico','recepcao'));

-- Apenas admin pode desativar (soft-delete via active=false)
create policy "patient_cards_deactivate"
  on patient_cards for delete
  to authenticated
  using (auth.user_role() = 'admin');

-- ── VISITS ───────────────────────────────────────────────────────
alter table visits enable row level security;

create policy "visits_clinicians_select"
  on visits for select
  to authenticated
  using (auth.user_role() in ('admin','medico','enfermeiro','recepcao'));

create policy "visits_patient_select"
  on visits for select
  to authenticated
  using (
    auth.user_role() = 'paciente'
    and patient_id in (
      select id from patient_cards
      where email = (select email from profiles where id = auth.uid() limit 1)
    )
  );

create policy "visits_write"
  on visits for insert
  to authenticated
  with check (auth.user_role() in ('admin','medico','enfermeiro','recepcao'));

create policy "visits_update"
  on visits for update
  to authenticated
  using  (auth.user_role() in ('admin','medico','enfermeiro','recepcao'))
  with check (auth.user_role() in ('admin','medico','enfermeiro','recepcao'));

-- ── PRONTUARIO_ENTRIES ───────────────────────────────────────────
alter table prontuario_entries enable row level security;

create policy "prontuario_clinicians_select"
  on prontuario_entries for select
  to authenticated
  using (auth.user_role() in ('admin','medico','enfermeiro'));

create policy "prontuario_write"
  on prontuario_entries for insert
  to authenticated
  with check (
    auth.user_role() in ('admin','medico','enfermeiro')
    and author_id = auth.uid()
  );

create policy "prontuario_update_own"
  on prontuario_entries for update
  to authenticated
  using  (author_id = auth.uid() or auth.user_role() = 'admin')
  with check (author_id = auth.uid() or auth.user_role() = 'admin');

create policy "prontuario_delete"
  on prontuario_entries for delete
  to authenticated
  using (author_id = auth.uid() or auth.user_role() = 'admin');

-- ── SCORE_ENTRIES ────────────────────────────────────────────────
alter table score_entries enable row level security;

create policy "scores_clinicians_select"
  on score_entries for select
  to authenticated
  using (auth.user_role() in ('admin','medico','enfermeiro'));

create policy "scores_write"
  on score_entries for insert
  to authenticated
  with check (
    auth.user_role() in ('admin','medico','enfermeiro')
  );

-- ── SCHEDULED_SMS ────────────────────────────────────────────────
alter table scheduled_sms enable row level security;

create policy "sms_admin_medico"
  on scheduled_sms for all
  to authenticated
  using  (auth.user_role() in ('admin','medico','recepcao'))
  with check (auth.user_role() in ('admin','medico','recepcao'));

-- ── PAYMENT_TRANSACTIONS ─────────────────────────────────────────
alter table payment_transactions enable row level security;

create policy "payments_admin"
  on payment_transactions for all
  to authenticated
  using  (auth.user_role() = 'admin')
  with check (auth.user_role() = 'admin');

create policy "payments_patient_select"
  on payment_transactions for select
  to authenticated
  using (
    auth.user_role() = 'paciente'
    and patient_id in (
      select id from patient_cards
      where email = (select email from profiles where id = auth.uid() limit 1)
    )
  );

-- ── AUDIT_LOGS ───────────────────────────────────────────────────
alter table audit_logs enable row level security;

create policy "audit_admin_only"
  on audit_logs for select
  to authenticated
  using (auth.user_role() = 'admin');

-- Qualquer usuario autenticado pode inserir (escrita de auditoria propria)
create policy "audit_insert"
  on audit_logs for insert
  to authenticated
  with check (user_id = auth.uid());
