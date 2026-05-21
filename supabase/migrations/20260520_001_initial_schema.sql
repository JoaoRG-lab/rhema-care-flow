-- ============================================================
-- Rhema Care Flow — Migration 001: Schema inicial
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";
create extension if not exists "pg_net";

-- Enum role
create type user_role as enum ('admin', 'medico', 'enfermeiro');

-- ============================================================
-- PROFILES (espelha auth.users)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  role        user_role not null default 'enfermeiro',
  avatar_url  text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-cria profile ao registrar
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- PATIENTS
-- ============================================================
create table if not exists public.patients (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  birthdate   date not null,
  cpf         text unique,
  phone       text,
  email       text,
  address     text,
  diagnosis   text,
  active      boolean not null default true,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists patients_name_idx on public.patients using gin (to_tsvector('portuguese', name));
create index if not exists patients_active_idx on public.patients(active);

-- ============================================================
-- VISITS
-- ============================================================
create table if not exists public.visits (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid not null references public.patients(id) on delete cascade,
  doctor_id       uuid not null references public.profiles(id),
  visit_date      timestamptz not null default now(),
  chief_complaint text,
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists visits_patient_idx on public.visits(patient_id);
create index if not exists visits_date_idx    on public.visits(visit_date desc);

-- ============================================================
-- PRONTUARIO
-- ============================================================
create type prontuario_type as enum ('evolucao','prescricao','laudo','anamnese');

create table if not exists public.prontuario (
  id         uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  author_id  uuid not null references public.profiles(id),
  content    text not null,
  type       prontuario_type not null default 'evolucao',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prontuario_patient_idx on public.prontuario(patient_id);

-- ============================================================
-- SCORES
-- ============================================================
create type score_type as enum ('DAS28','SDAI','Wells','BASFI');

create table if not exists public.scores (
  id              uuid primary key default uuid_generate_v4(),
  patient_id      uuid not null references public.patients(id) on delete cascade,
  author_id       uuid not null references public.profiles(id),
  score_type      score_type not null,
  score_value     numeric(6,2) not null,
  inputs          jsonb not null default '{}',
  interpretation  text not null,
  created_at      timestamptz not null default now()
);

create index if not exists scores_patient_idx on public.scores(patient_id);
create index if not exists scores_type_idx    on public.scores(score_type);

-- ============================================================
-- EXAMS (metadados — arquivo no Storage)
-- ============================================================
create table if not exists public.exams (
  id           uuid primary key default uuid_generate_v4(),
  patient_id   uuid not null references public.patients(id) on delete cascade,
  uploaded_by  uuid not null references public.profiles(id),
  file_name    text not null,
  file_url     text not null,
  file_size    bigint not null,
  mime_type    text not null,
  description  text,
  created_at   timestamptz not null default now()
);

create index if not exists exams_patient_idx on public.exams(patient_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create type notification_type as enum ('info','warning','success','error');

create table if not exists public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  body       text not null,
  type       notification_type not null default 'info',
  read       boolean not null default false,
  link       text,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx  on public.notifications(user_id);
create index if not exists notifications_read_idx  on public.notifications(read) where read = false;

-- ============================================================
-- AUDIT LOGS (LGPD)
-- ============================================================
create table if not exists public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id),
  action      text not null,
  resource    text not null,
  resource_id uuid,
  meta        jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_user_idx     on public.audit_logs(user_id);
create index if not exists audit_resource_idx on public.audit_logs(resource);
create index if not exists audit_date_idx     on public.audit_logs(created_at desc);
