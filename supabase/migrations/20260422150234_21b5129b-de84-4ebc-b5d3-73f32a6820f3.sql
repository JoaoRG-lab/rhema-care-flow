
-- 1. Harden permissive INSERT/UPDATE policies (require authentication or specific scope)

-- agent_run_log: only service_role / system jobs should write. Restrict to service_role.
DROP POLICY IF EXISTS "System can insert agent logs" ON public.agent_run_log;
DROP POLICY IF EXISTS "System can update agent logs" ON public.agent_run_log;
CREATE POLICY "Service role can insert agent logs"
  ON public.agent_run_log FOR INSERT
  TO service_role
  WITH CHECK (true);
CREATE POLICY "Service role can update agent logs"
  ON public.agent_run_log FOR UPDATE
  TO service_role
  USING (true);

-- custody_audit_log: restrict inserts to authenticated users logging their own custody
DROP POLICY IF EXISTS "System can log custody events" ON public.custody_audit_log;
CREATE POLICY "Authenticated can log own custody events"
  ON public.custody_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ultimate_user_custody c
      WHERE c.id = custody_audit_log.custody_id
        AND c.user_id = auth.uid()
    )
  );

-- feedback_submissions: keep public submissions but add basic guardrails
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback_submissions;
CREATE POLICY "Anyone can submit feedback"
  ON public.feedback_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(message) BETWEEN 1 AND 5000
    AND char_length(category) BETWEEN 1 AND 100
  );

-- newsletter_digests: restrict insert to service_role
DROP POLICY IF EXISTS "System can insert digests" ON public.newsletter_digests;
CREATE POLICY "Service role can insert digests"
  ON public.newsletter_digests FOR INSERT
  TO service_role
  WITH CHECK (true);

-- peer_reviews: only authenticated users (service or admin) — require auth.uid()
DROP POLICY IF EXISTS "System can insert reviews" ON public.peer_reviews;
CREATE POLICY "Authenticated can insert reviews"
  ON public.peer_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- site_activity_log & site_visits: public analytics inserts, but bound to required fields
DROP POLICY IF EXISTS "Anyone can log activity" ON public.site_activity_log;
CREATE POLICY "Anyone can log activity"
  ON public.site_activity_log FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(activity_type) BETWEEN 1 AND 100
    AND (user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can insert site visits" ON public.site_visits;
CREATE POLICY "Anyone can insert site visits"
  ON public.site_visits FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(page_path) BETWEEN 1 AND 2000
    AND char_length(session_id) BETWEEN 1 AND 200
    AND char_length(visitor_id) BETWEEN 1 AND 200
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- 2. Restrict bucket listing on education-images: keep object-level public read,
-- but block listing the bucket contents for unauthenticated users.
DROP POLICY IF EXISTS "Anyone can view education images" ON storage.objects;
CREATE POLICY "Public read of education images by exact name"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'education-images'
    AND (
      auth.role() = 'authenticated'
      OR (
        -- anonymous can only read when fetching a specific object, not listing
        coalesce(current_setting('request.method', true), '') <> 'LIST'
      )
    )
  );
