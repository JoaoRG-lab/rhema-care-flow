-- Create enum for contribution categories
CREATE TYPE contribution_category AS ENUM ('clinical_pearl', 'guideline_summary', 'case_insight', 'resource');

-- Create enum for contribution status
CREATE TYPE contribution_status AS ENUM ('pending', 'approved', 'rejected');

-- Create knowledge_contributions table
CREATE TABLE public.knowledge_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category contribution_category NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  disease_area TEXT,
  resource_url TEXT,
  status contribution_status NOT NULL DEFAULT 'pending',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contribution_votes table for tracking votes
CREATE TABLE public.contribution_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id UUID NOT NULL REFERENCES public.knowledge_contributions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_helpful BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contribution_id, user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.knowledge_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_contributions

-- Require authentication
CREATE POLICY "Require authentication for knowledge_contributions"
ON public.knowledge_contributions
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can insert their own contributions
CREATE POLICY "Users can insert own contributions"
ON public.knowledge_contributions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending contributions
CREATE POLICY "Users can update own pending contributions"
ON public.knowledge_contributions
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Users can delete their own pending contributions
CREATE POLICY "Users can delete own pending contributions"
ON public.knowledge_contributions
FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');

-- Users can view own contributions
CREATE POLICY "Users can view own contributions"
ON public.knowledge_contributions
FOR SELECT
USING (auth.uid() = user_id);

-- Anyone can view approved contributions
CREATE POLICY "Anyone can view approved contributions"
ON public.knowledge_contributions
FOR SELECT
USING (status = 'approved');

-- Admins can view all contributions
CREATE POLICY "Admins can view all contributions"
ON public.knowledge_contributions
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can update all contributions (for moderation)
CREATE POLICY "Admins can update all contributions"
ON public.knowledge_contributions
FOR UPDATE
USING (is_admin(auth.uid()));

-- Admins can delete all contributions
CREATE POLICY "Admins can delete all contributions"
ON public.knowledge_contributions
FOR DELETE
USING (is_admin(auth.uid()));

-- RLS Policies for contribution_votes

-- Require authentication
CREATE POLICY "Require authentication for contribution_votes"
ON public.contribution_votes
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can insert their own votes
CREATE POLICY "Users can insert own votes"
ON public.contribution_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update own votes"
ON public.contribution_votes
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes"
ON public.contribution_votes
FOR DELETE
USING (auth.uid() = user_id);

-- Users can view their own votes
CREATE POLICY "Users can view own votes"
ON public.contribution_votes
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to update helpful_count when votes change
CREATE OR REPLACE FUNCTION public.update_contribution_helpful_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.knowledge_contributions
    SET helpful_count = (
      SELECT COUNT(*) FROM public.contribution_votes 
      WHERE contribution_id = NEW.contribution_id AND is_helpful = true
    ),
    updated_at = now()
    WHERE id = NEW.contribution_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.knowledge_contributions
    SET helpful_count = (
      SELECT COUNT(*) FROM public.contribution_votes 
      WHERE contribution_id = OLD.contribution_id AND is_helpful = true
    ),
    updated_at = now()
    WHERE id = OLD.contribution_id;
    RETURN OLD;
  END IF;
END;
$$;

-- Create trigger for vote count updates
CREATE TRIGGER update_helpful_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.contribution_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_contribution_helpful_count();

-- Create trigger for updated_at on contributions
CREATE TRIGGER update_knowledge_contributions_updated_at
BEFORE UPDATE ON public.knowledge_contributions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_contributions_user_id ON public.knowledge_contributions(user_id);
CREATE INDEX idx_contributions_status ON public.knowledge_contributions(status);
CREATE INDEX idx_contributions_category ON public.knowledge_contributions(category);
CREATE INDEX idx_contributions_disease_area ON public.knowledge_contributions(disease_area);
CREATE INDEX idx_contributions_helpful_count ON public.knowledge_contributions(helpful_count DESC);
CREATE INDEX idx_votes_contribution_id ON public.contribution_votes(contribution_id);
CREATE INDEX idx_votes_user_id ON public.contribution_votes(user_id);