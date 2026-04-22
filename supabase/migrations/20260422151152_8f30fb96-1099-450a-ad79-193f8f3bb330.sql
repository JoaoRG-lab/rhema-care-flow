BEGIN;
TRUNCATE TABLE public.patient_chain_anchors, public.epi_risk_scores, public.epi_feature_vectors, public.scheduled_sms, public.consultation_sessions, public.score_entries, public.infusion_events, public.monitoring_events, public.visits, public.patient_cards RESTART IDENTITY CASCADE;
DROP POLICY IF EXISTS "Admins can view all patient cards" ON public.patient_cards;
DROP POLICY IF EXISTS "Admins can view all visits" ON public.visits;
DROP POLICY IF EXISTS "Admins can view all scores" ON public.score_entries;
DROP POLICY IF EXISTS "Admins can view all infusions" ON public.infusion_events;
DROP POLICY IF EXISTS "Admins can view all monitoring" ON public.monitoring_events;
DROP POLICY IF EXISTS "Admins can view all chain anchors" ON public.patient_chain_anchors;
DROP POLICY IF EXISTS "Admins can view all feature vectors" ON public.epi_feature_vectors;
ALTER TABLE public.epi_feature_vectors DROP CONSTRAINT IF EXISTS epi_feature_vectors_encrypted_nonempty_chk;
ALTER TABLE public.epi_feature_vectors ADD CONSTRAINT epi_feature_vectors_encrypted_nonempty_chk CHECK (octet_length(vector_encrypted) > 0 AND char_length(vector_hash) = 64);
DROP POLICY IF EXISTS "Users manage own feature vectors" ON public.epi_feature_vectors;
CREATE POLICY "Users manage own feature vectors" ON public.epi_feature_vectors FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
COMMIT;
-- done