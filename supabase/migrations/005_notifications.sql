-- 005_notifications.sql
-- Tabela de notificações por usuário com RLS

create type notif_type   as enum ('consulta', 'exame', 'alerta', 'sistema');
create type notif_status as enum ('lida', 'nao_lida');

create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       notif_type   not null default 'sistema',
  title      text         not null,
  body       text         not null default '',
  status     notif_status not null default 'nao_lida',
  link       text,
  created_at timestamptz  not null default now()
);

create index idx_notifications_user    on notifications(user_id);
create index idx_notifications_status  on notifications(user_id, status);
create index idx_notifications_created on notifications(created_at desc);

-- RLS
alter table notifications enable row level security;

create policy "notif: usuario le as proprias"
  on notifications for select
  using (auth.uid() = user_id);

create policy "notif: usuario atualiza as proprias"
  on notifications for update
  using (auth.uid() = user_id);

create policy "notif: usuario deleta as proprias"
  on notifications for delete
  using (auth.uid() = user_id);

create policy "notif: sistema insere (service_role)"
  on notifications for insert
  with check (true);

-- Realtime
alter publication supabase_realtime add table notifications;

-- Funcao helper: criar notificacao (chamavel via RPC ou pg_cron)
create or replace function create_notification(
  p_user_id uuid,
  p_type    notif_type,
  p_title   text,
  p_body    text,
  p_link    text default null
) returns uuid
language plpgsql security definer as $$
declare v_id uuid;
begin
  insert into notifications(user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link)
  returning id into v_id;
  return v_id;
end;
$$;

-- Trigger: notifica medico responsavel quando agendamento eh confirmado
create or replace function notify_on_appointment_confirm()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'confirmado' and old.status <> 'confirmado' then
    perform create_notification(
      new.provider_id,
      'consulta',
      'Consulta confirmada',
      'O agendamento foi confirmado pelo paciente.',
      '/schedule'
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_confirm
  after update on appointments
  for each row execute function notify_on_appointment_confirm();
