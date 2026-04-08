
-- Peer review assignments table
CREATE TABLE public.peer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL DEFAULT 'education',
  content_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  reviewer_specialty text,
  status text NOT NULL DEFAULT 'pending',
  score integer,
  feedback text,
  checklist jsonb DEFAULT '{}',
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.peer_reviews ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX peer_reviews_unique_reviewer ON public.peer_reviews(content_type, content_id, reviewer_id);

CREATE POLICY "Reviewers can view assigned reviews" ON public.peer_reviews
  FOR SELECT TO authenticated USING (auth.uid() = reviewer_id);

CREATE POLICY "Admins can manage all reviews" ON public.peer_reviews
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Reviewers can update own reviews" ON public.peer_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = reviewer_id);

CREATE POLICY "System can insert reviews" ON public.peer_reviews
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authors can view reviews on own content" ON public.peer_reviews
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM education_content ec WHERE ec.id = peer_reviews.content_id AND ec.author_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM knowledge_contributions kc WHERE kc.id = peer_reviews.content_id AND kc.user_id = auth.uid()
    )
  );

-- Interactive case studies table
CREATE TABLE public.case_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  specialty text DEFAULT 'Rheumatology',
  difficulty text NOT NULL DEFAULT 'intermediate',
  diagnosis_tags text[] DEFAULT '{}',
  scenario_json jsonb NOT NULL DEFAULT '[]',
  author_id uuid NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  completion_count integer NOT NULL DEFAULT 0,
  avg_score numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published case studies" ON public.case_studies
  FOR SELECT USING (is_published = true);

CREATE POLICY "Authors can manage own case studies" ON public.case_studies
  FOR ALL TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins can manage all case studies" ON public.case_studies
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- User progress on case studies
CREATE TABLE public.case_study_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_study_id uuid NOT NULL REFERENCES public.case_studies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  responses jsonb NOT NULL DEFAULT '[]',
  score numeric,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.case_study_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own attempts" ON public.case_study_attempts
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_peer_reviews_updated_at BEFORE UPDATE ON public.peer_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_studies_updated_at BEFORE UPDATE ON public.case_studies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
