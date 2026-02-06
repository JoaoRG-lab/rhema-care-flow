-- Create contribution_comments table for discussion threads
CREATE TABLE public.contribution_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id UUID NOT NULL REFERENCES public.knowledge_contributions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.contribution_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contribution_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Require authentication
CREATE POLICY "Require authentication for contribution_comments"
ON public.contribution_comments
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can insert their own comments
CREATE POLICY "Users can insert own comments"
ON public.contribution_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
ON public.contribution_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.contribution_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Anyone can view comments on approved contributions
CREATE POLICY "Anyone can view comments on approved contributions"
ON public.contribution_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.knowledge_contributions kc 
    WHERE kc.id = contribution_id AND kc.status = 'approved'
  )
);

-- Admins can manage all comments
CREATE POLICY "Admins can manage all comments"
ON public.contribution_comments
FOR ALL
USING (is_admin(auth.uid()));

-- Add comment count to contributions
ALTER TABLE public.knowledge_contributions
ADD COLUMN comment_count INTEGER NOT NULL DEFAULT 0;

-- Create function to update comment count
CREATE OR REPLACE FUNCTION public.update_contribution_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.knowledge_contributions
    SET comment_count = comment_count + 1,
        updated_at = now()
    WHERE id = NEW.contribution_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.knowledge_contributions
    SET comment_count = GREATEST(0, comment_count - 1),
        updated_at = now()
    WHERE id = OLD.contribution_id;
    RETURN OLD;
  END IF;
END;
$$;

-- Create trigger for comment count
CREATE TRIGGER update_comment_count_trigger
AFTER INSERT OR DELETE ON public.contribution_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_contribution_comment_count();

-- Create trigger for updated_at
CREATE TRIGGER update_contribution_comments_updated_at
BEFORE UPDATE ON public.contribution_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_comments_contribution_id ON public.contribution_comments(contribution_id);
CREATE INDEX idx_comments_parent_id ON public.contribution_comments(parent_id);
CREATE INDEX idx_comments_user_id ON public.contribution_comments(user_id);
CREATE INDEX idx_comments_created_at ON public.contribution_comments(created_at DESC);