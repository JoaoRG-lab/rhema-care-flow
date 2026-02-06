-- Enable required extensions for cron scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create activity tracking table
CREATE TABLE IF NOT EXISTS public.site_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type text NOT NULL DEFAULT 'page_view',
  user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient activity queries
CREATE INDEX idx_site_activity_created_at ON public.site_activity_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.site_activity_log ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated users
CREATE POLICY "Anyone can log activity" ON public.site_activity_log
  FOR INSERT WITH CHECK (true);

-- Allow reading for activity checks
CREATE POLICY "System can read activity" ON public.site_activity_log
  FOR SELECT USING (true);

-- Create agent run log table
CREATE TABLE IF NOT EXISTS public.agent_run_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  results jsonb DEFAULT '{}'::jsonb,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS
ALTER TABLE public.agent_run_log ENABLE ROW LEVEL SECURITY;

-- Allow reading agent logs
CREATE POLICY "Anyone authenticated can view agent logs" ON public.agent_run_log
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow system inserts
CREATE POLICY "System can insert agent logs" ON public.agent_run_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update agent logs" ON public.agent_run_log
  FOR UPDATE USING (true);