-- ============================================================
-- Rhema Care Flow — Migration 004: Realtime + Storage
-- ============================================================

-- Habilita Realtime nas tabelas criticas
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.appointments;
alter publication supabase_realtime add table public.visits;

-- Storage bucket para exames
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exams',
  'exams',
  false,
  20971520,  -- 20 MB
  array['image/jpeg','image/png','image/webp','application/pdf','application/dicom']
)
on conflict (id) do nothing;

-- RLS no storage: dono ou admin pode ler; medico/admin pode subir
create policy "exams storage: leitura autenticada" on storage.objects
  for select using (
    bucket_id = 'exams' and auth.role() = 'authenticated'
  );

create policy "exams storage: upload medico/admin" on storage.objects
  for insert with check (
    bucket_id = 'exams'
    and public.my_role() in ('admin','medico')
  );

create policy "exams storage: delete admin" on storage.objects
  for delete using (
    bucket_id = 'exams' and public.is_admin()
  );
