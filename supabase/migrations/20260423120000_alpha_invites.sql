-- Create alpha_invites table to persist alpha program requests
CREATE TABLE IF NOT EXISTS public.alpha_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  society TEXT NOT NULL,
  role TEXT NOT NULL,
  institution TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.alpha_invites ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) may submit an alpha invite request
CREATE POLICY "Anyone can submit alpha invite requests"
  ON public.alpha_invites
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
