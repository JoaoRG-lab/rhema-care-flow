-- Create table for AI research pipeline
CREATE TABLE public.ai_research_pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Topic and research phase
  topic TEXT NOT NULL,
  search_query TEXT,
  research_sources JSONB DEFAULT '[]'::jsonb,
  source_count INTEGER DEFAULT 0,
  
  -- Content generation
  generated_title TEXT,
  generated_summary TEXT,
  generated_content TEXT,
  generated_tags TEXT[] DEFAULT '{}',
  
  -- Verification workflow
  status TEXT NOT NULL DEFAULT 'researching' CHECK (status IN ('researching', 'drafting', 'ai_reviewing', 'pending_review', 'approved', 'rejected', 'published')),
  ai_verification_score NUMERIC(4,2),
  ai_verification_notes TEXT,
  ai_factcheck_passed BOOLEAN DEFAULT false,
  
  -- Human review
  reviewed_by UUID,
  reviewer_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  disease_area TEXT,
  content_type TEXT DEFAULT 'article',
  priority INTEGER DEFAULT 5,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_research_pipeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Require authentication for ai_research_pipeline"
  ON public.ai_research_pipeline FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own pipeline items"
  ON public.ai_research_pipeline FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pipeline items"
  ON public.ai_research_pipeline FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pipeline items"
  ON public.ai_research_pipeline FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all pipeline items"
  ON public.ai_research_pipeline FOR ALL
  USING (is_admin(auth.uid()));

-- Create topics queue for systematic research
CREATE TABLE public.research_topic_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  category TEXT NOT NULL,
  disease_area TEXT,
  priority INTEGER DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  source TEXT DEFAULT 'system', -- system, user, ai_suggested
  parent_topic_id UUID REFERENCES public.research_topic_queue(id),
  articles_generated INTEGER DEFAULT 0,
  last_processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.research_topic_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topic queue
CREATE POLICY "Anyone authenticated can view topic queue"
  ON public.research_topic_queue FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage topic queue"
  ON public.research_topic_queue FOR ALL
  USING (is_admin(auth.uid()));

-- Insert initial seed topics for rheumatology knowledge
INSERT INTO public.research_topic_queue (topic, category, disease_area, priority) VALUES
('Rheumatoid Arthritis Treatment Guidelines 2024', 'guidelines', 'Rheumatoid Arthritis', 10),
('Biologic DMARDs Comparison', 'treatment', 'Rheumatoid Arthritis', 9),
('DAS28 Score Interpretation', 'clinical_tools', 'Rheumatoid Arthritis', 9),
('Lupus Nephritis Management', 'treatment', 'SLE', 8),
('Psoriatic Arthritis Classification Criteria', 'diagnosis', 'Psoriatic Arthritis', 8),
('Ankylosing Spondylitis Exercise Protocols', 'rehabilitation', 'Axial Spondyloarthritis', 7),
('Juvenile Idiopathic Arthritis Updates', 'pediatric', 'JIA', 8),
('Gout Management in CKD Patients', 'treatment', 'Gout', 7),
('Osteoarthritis Non-Pharmacological Interventions', 'treatment', 'Osteoarthritis', 7),
('Vasculitis Classification ANCA', 'diagnosis', 'Vasculitis', 8),
('Sjogren Syndrome Diagnostic Criteria', 'diagnosis', 'Sjogren', 7),
('Scleroderma Screening Protocols', 'screening', 'Systemic Sclerosis', 8),
('TNF Inhibitors Safety Monitoring', 'safety', 'General', 9),
('JAK Inhibitors Clinical Evidence', 'treatment', 'General', 9),
('Methotrexate Best Practices', 'treatment', 'General', 10),
('Fibromyalgia Differential Diagnosis', 'diagnosis', 'Fibromyalgia', 6),
('Polymyalgia Rheumatica vs GCA', 'diagnosis', 'PMR', 7),
('Biosimilars in Rheumatology', 'treatment', 'General', 8),
('Pregnancy in Autoimmune Disease', 'special_populations', 'General', 8),
('COVID-19 and Immunosuppression', 'safety', 'General', 9);

-- Trigger for updated_at
CREATE TRIGGER update_ai_research_pipeline_updated_at
  BEFORE UPDATE ON public.ai_research_pipeline
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();