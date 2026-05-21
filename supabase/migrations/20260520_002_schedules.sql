-- ============================================================
-- Rhema Care Flow — Migration 002: Agendamentos
-- ============================================================

create type appointment_status as enum (
  'agendado', 'confirmado', 'realizado', 'cancelado', 'falta'
);

create table if not exists public.appointments (
  id           uuid primary key default uuid_generate_v4(),
  patient_id   uuid not null references public.patients(id) on delete cascade,
  doctor_id    uuid not null references public.profiles(id),
  start_at     timestamptz not null,
  end_at       timestamptz not null,
  status       appointment_status not null default 'agendado',
  reason       text,
  notes        text,
  teleconsulta boolean not null default false,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint no_overlap exclude using gist (
    doctor_id with =,
    tstzrange(start_at, end_at) with &&
  ) where (status not in ('cancelado','falta'))
);

create index if not exists appt_patient_idx on public.appointments(patient_id);
create index if not exists appt_doctor_idx  on public.appointments(doctor_id);
create index if not exists appt_start_idx   on public.appointments(start_at);
create index if not exists appt_status_idx  on public.appointments(status);

-- Notifica paciente 1h antes via pg_cron (requer pg_net + Edge Function)
select cron.schedule(
  'notify-appointments',
  '*/15 * * * *',
  $$
    select net.http_post(
      url    := current_setting('app.edge_base_url') || '/functions/v1/send-sms',
      body   := json_build_object(
        'appointments', (
          select json_agg(row_to_json(a))
          from public.appointments a
          join public.patients p on p.id = a.patient_id
          where a.status = 'agendado'
            and a.start_at between now() + interval '55 min'
                                and now() + interval '65 min'
        )
      )::text,
      headers := '{"Content-Type":"application/json"}'::jsonb
    );
  $$
);
