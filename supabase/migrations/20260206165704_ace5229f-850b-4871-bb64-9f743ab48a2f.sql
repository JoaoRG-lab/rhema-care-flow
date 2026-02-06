-- Add specialty column to education_content for multi-specialty support
ALTER TABLE public.education_content 
ADD COLUMN IF NOT EXISTS specialty text DEFAULT 'Rheumatology';

-- Create index for specialty filtering
CREATE INDEX IF NOT EXISTS idx_education_content_specialty ON public.education_content(specialty);

-- Add specialty to ai_research_pipeline if not exists
ALTER TABLE public.ai_research_pipeline 
ADD COLUMN IF NOT EXISTS specialty text DEFAULT 'Rheumatology';

-- Create index for specialty filtering on pipeline
CREATE INDEX IF NOT EXISTS idx_ai_research_pipeline_specialty ON public.ai_research_pipeline(specialty);

-- Add specialty to research_topic_queue if not exists  
ALTER TABLE public.research_topic_queue
ADD COLUMN IF NOT EXISTS specialty text DEFAULT 'Rheumatology';

-- Create index for specialty filtering on queue
CREATE INDEX IF NOT EXISTS idx_research_topic_queue_specialty ON public.research_topic_queue(specialty);