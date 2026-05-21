-- ============================================================
-- RODADA 12: Storage buckets + Realtime publications + OAuth
-- ============================================================

-- -------------------------------------------------------
-- 1. STORAGE BUCKETS
-- -------------------------------------------------------

-- Bucket para laudos/relatórios PDF
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'laudos',
  'laudos',
  false,
  10485760,  -- 10 MB
  ARRAY['application/pdf','image/png','image/jpeg','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para avatares de usuários (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 MB
  ARRAY['image/png','image/jpeg','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 2. STORAGE POLICIES — bucket: laudos
-- -------------------------------------------------------

-- Profissionais do mesmo tenant podem fazer upload
CREATE POLICY "laudos: upload by professional"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'laudos'
    AND auth.role() = 'authenticated'
    AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('medico', 'enfermeiro', 'admin')
  );

-- Dono do laudo pode ler
CREATE POLICY "laudos: owner read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'laudos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin pode ler todos
CREATE POLICY "laudos: admin read all"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'laudos'
    AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) = 'admin'
  );

-- Dono pode deletar
CREATE POLICY "laudos: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'laudos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- -------------------------------------------------------
-- 3. STORAGE POLICIES — bucket: avatars
-- -------------------------------------------------------

CREATE POLICY "avatars: authenticated upload own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- -------------------------------------------------------
-- 4. REALTIME — habilitar publicações
-- -------------------------------------------------------

-- Habilitar realtime nas tabelas críticas
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;

-- -------------------------------------------------------
-- 5. TABELA: notification_subscriptions
--    Controla quais usuários recebem quais eventos RT
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notification_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,  -- 'new_consultation','patient_update','audit_alert'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, event_type)
);

ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_subscriptions: owner access"
  ON public.notification_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------
-- 6. TABELA: oauth_providers (rastreia provedores OAuth)
-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.oauth_providers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL,  -- 'google','github'
  provider_uid  TEXT NOT NULL,
  email         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_uid)
);

ALTER TABLE public.oauth_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oauth_providers: owner read"
  ON public.oauth_providers FOR SELECT
  USING (auth.uid() = user_id);

-- -------------------------------------------------------
-- 7. FUNÇÃO: handle_oauth_profile_upsert
--    Chamada via trigger quando um usuário faz login OAuth
--    Sincroniza nome + avatar do Google com profiles
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_oauth_profile_upsert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_provider  TEXT;
  v_name      TEXT;
  v_avatar    TEXT;
BEGIN
  v_provider := NEW.raw_app_meta_data->>'provider';
  v_name     := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_avatar   := NEW.raw_user_meta_data->>'avatar_url';

  INSERT INTO public.profiles (id, full_name, avatar_url, role, created_at)
  VALUES (NEW.id, v_name, v_avatar, 'viewer', NOW())
  ON CONFLICT (id) DO UPDATE
    SET
      full_name  = EXCLUDED.full_name,
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
      updated_at = NOW();

  IF v_provider IS NOT NULL THEN
    INSERT INTO public.oauth_providers
      (user_id, provider, provider_uid, email)
    VALUES (
      NEW.id,
      v_provider,
      NEW.id::TEXT,
      NEW.email
    )
    ON CONFLICT (provider, provider_uid) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger na tabela auth.users (via Supabase)
DROP TRIGGER IF EXISTS on_auth_user_created_oauth ON auth.users;
CREATE TRIGGER on_auth_user_created_oauth
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_oauth_profile_upsert();

-- -------------------------------------------------------
-- 8. ÍNDICES DE PERFORMANCE
-- -------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, read_at)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_oauth_providers_user
  ON public.oauth_providers(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_subs_user
  ON public.notification_subscriptions(user_id);
