-- Create education content table for patient articles and resources
CREATE TABLE public.education_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'article' CHECK (content_type IN ('article', 'video', 'infographic', 'guide', 'faq')),
  category TEXT NOT NULL,
  diagnosis_tags TEXT[] DEFAULT '{}',
  reading_time_minutes INTEGER,
  featured_image_url TEXT,
  external_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  author_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.education_content ENABLE ROW LEVEL SECURITY;

-- Policies for education content
-- Anyone authenticated can view published content
CREATE POLICY "Anyone can view published content"
ON public.education_content
FOR SELECT
USING (is_published = true);

-- Authors can view their own unpublished content
CREATE POLICY "Authors can view own content"
ON public.education_content
FOR SELECT
USING (auth.uid() = author_id);

-- Authors can insert their own content
CREATE POLICY "Authors can insert content"
ON public.education_content
FOR INSERT
WITH CHECK (auth.uid() = author_id);

-- Authors can update their own content
CREATE POLICY "Authors can update own content"
ON public.education_content
FOR UPDATE
USING (auth.uid() = author_id);

-- Authors can delete their own content
CREATE POLICY "Authors can delete own content"
ON public.education_content
FOR DELETE
USING (auth.uid() = author_id);

-- Admins can do everything
CREATE POLICY "Admins can manage all content"
ON public.education_content
FOR ALL
USING (public.is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_education_content_category ON public.education_content(category);
CREATE INDEX idx_education_content_published ON public.education_content(is_published, published_at DESC);
CREATE INDEX idx_education_content_diagnosis ON public.education_content USING GIN(diagnosis_tags);

-- Trigger for updated_at
CREATE TRIGGER update_education_content_updated_at
  BEFORE UPDATE ON public.education_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$;