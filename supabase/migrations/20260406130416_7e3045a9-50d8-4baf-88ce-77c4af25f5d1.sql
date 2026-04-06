CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  session_id text NOT NULL,
  page_path text NOT NULL,
  referrer text,
  user_agent text,
  screen_width integer,
  screen_height integer,
  language text,
  country text,
  device_type text DEFAULT 'desktop',
  browser text,
  os text,
  duration_seconds integer DEFAULT 0,
  is_bounce boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert site visits" ON public.site_visits
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read site visits" ON public.site_visits
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.site_visits;

CREATE INDEX idx_site_visits_created_at ON public.site_visits(created_at DESC);
CREATE INDEX idx_site_visits_page_path ON public.site_visits(page_path);
CREATE INDEX idx_site_visits_visitor_id ON public.site_visits(visitor_id);