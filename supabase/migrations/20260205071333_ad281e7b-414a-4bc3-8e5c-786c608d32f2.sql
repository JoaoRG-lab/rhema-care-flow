-- Add explicit RESTRICTIVE policies requiring authentication on sensitive tables
-- These work as AND conditions with existing policies, ensuring no unauthenticated access

-- patient_cards: Require authentication for all operations
CREATE POLICY "Require authentication for patient_cards"
ON public.patient_cards
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- visits: Require authentication for all operations
CREATE POLICY "Require authentication for visits"
ON public.visits
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- score_entries: Require authentication for all operations
CREATE POLICY "Require authentication for score_entries"
ON public.score_entries
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- monitoring_events: Require authentication for all operations
CREATE POLICY "Require authentication for monitoring_events"
ON public.monitoring_events
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- monitoring_plans: Require authentication for all operations
CREATE POLICY "Require authentication for monitoring_plans"
ON public.monitoring_plans
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- infusion_events: Require authentication for all operations
CREATE POLICY "Require authentication for infusion_events"
ON public.infusion_events
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- profiles: Require authentication for all operations
CREATE POLICY "Require authentication for profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- verification_requests: Require authentication for all operations
CREATE POLICY "Require authentication for verification_requests"
ON public.verification_requests
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- audit_logs: Require authentication for all operations
CREATE POLICY "Require authentication for audit_logs"
ON public.audit_logs
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- user_roles: Require authentication for all operations
CREATE POLICY "Require authentication for user_roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- tasks: Require authentication for all operations
CREATE POLICY "Require authentication for tasks"
ON public.tasks
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- shifts: Require authentication for all operations
CREATE POLICY "Require authentication for shifts"
ON public.shifts
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- focus_sessions: Require authentication for all operations
CREATE POLICY "Require authentication for focus_sessions"
ON public.focus_sessions
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);