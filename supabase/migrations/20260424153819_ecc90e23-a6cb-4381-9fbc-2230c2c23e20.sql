-- Votes for education content cards (useful / not useful)
CREATE TABLE public.education_content_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.education_content(id) ON DELETE CASCADE,
  user_id UUID NULL,
  visitor_id TEXT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Each user (or anonymous visitor) gets one vote per content
  CONSTRAINT education_content_votes_voter_check
    CHECK (user_id IS NOT NULL OR visitor_id IS NOT NULL)
);

CREATE UNIQUE INDEX education_content_votes_user_unique
  ON public.education_content_votes (content_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX education_content_votes_visitor_unique
  ON public.education_content_votes (content_id, visitor_id)
  WHERE user_id IS NULL AND visitor_id IS NOT NULL;

CREATE INDEX education_content_votes_content_idx
  ON public.education_content_votes (content_id);

ALTER TABLE public.education_content_votes ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read aggregate votes
CREATE POLICY "Votes are publicly readable"
  ON public.education_content_votes
  FOR SELECT
  USING (true);

-- Anyone can submit a vote (auth optional). visitor_id required when not authed.
CREATE POLICY "Anyone can submit a vote"
  ON public.education_content_votes
  FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND user_id IS NULL AND visitor_id IS NOT NULL)
  );

-- A voter can change their own vote
CREATE POLICY "Voters can update their own vote"
  ON public.education_content_votes
  FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );

-- A voter can remove their own vote
CREATE POLICY "Voters can delete their own vote"
  ON public.education_content_votes
  FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );

CREATE TRIGGER update_education_content_votes_updated_at
  BEFORE UPDATE ON public.education_content_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();