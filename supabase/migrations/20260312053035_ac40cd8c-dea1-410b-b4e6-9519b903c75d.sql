-- Newsletter digest history table
CREATE TABLE public.newsletter_digests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  digest_type text NOT NULL DEFAULT 'daily',
  subject text NOT NULL,
  content_html text NOT NULL,
  content_text text,
  stats_snapshot jsonb DEFAULT '{}'::jsonb,
  sent_to text[] DEFAULT '{}'::text[],
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'generated'
);

ALTER TABLE public.newsletter_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage digests"
  ON public.newsletter_digests FOR ALL
  USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert digests"
  ON public.newsletter_digests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view sent digests"
  ON public.newsletter_digests FOR SELECT
  USING (status = 'sent');

ALTER PUBLICATION supabase_realtime ADD TABLE public.newsletter_digests;