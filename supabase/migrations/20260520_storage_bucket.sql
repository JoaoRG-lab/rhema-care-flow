-- ================================================================
-- Rhema Care Flow — Storage: bucket patient-files + RLS
-- ================================================================

-- Cria bucket privado (nao publico por padrao)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'patient-files',
  'patient-files',
  false,
  20971520,  -- 20MB
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/dicom'
  ]
) on conflict (id) do nothing;

-- RLS no storage
create policy "storage_clinicians_upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'patient-files'
    and auth.user_role() in ('admin','medico','enfermeiro','recepcao')
  );

create policy "storage_clinicians_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'patient-files'
    and auth.user_role() in ('admin','medico','enfermeiro','recepcao')
  );

create policy "storage_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'patient-files'
    and auth.user_role() = 'admin'
  );
