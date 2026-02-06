-- Add evidence grading and AI review columns to pipeline
ALTER TABLE public.ai_research_pipeline
ADD COLUMN IF NOT EXISTS evidence_level text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS evidence_grade text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS requires_human_review boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS judge_decision text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS judge_confidence numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS judge_reasoning text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sentinel_flagged boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sentinel_last_check timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sentinel_flags jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS academic_reviewer_email text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS academic_review_requested_at timestamp with time zone DEFAULT NULL;

-- Create AI review logs table for audit trail
CREATE TABLE IF NOT EXISTS public.ai_review_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid REFERENCES public.ai_research_pipeline(id) ON DELETE CASCADE,
  reviewer_type text NOT NULL CHECK (reviewer_type IN ('judge', 'sentinel')),
  action text NOT NULL,
  evidence_level text,
  evidence_grade text,
  confidence_score numeric,
  reasoning text,
  decision text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create sentinel alerts table for flagged content
CREATE TABLE IF NOT EXISTS public.sentinel_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid REFERENCES public.ai_research_pipeline(id) ON DELETE CASCADE,
  content_id uuid REFERENCES public.education_content(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text NOT NULL,
  suggested_action text,
  is_resolved boolean DEFAULT false,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentinel_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_review_logs
CREATE POLICY "Require authentication for ai_review_logs"
ON public.ai_review_logs AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all review logs"
ON public.ai_review_logs FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view logs for their pipeline items"
ON public.ai_review_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ai_research_pipeline p
    WHERE p.id = ai_review_logs.pipeline_id AND p.user_id = auth.uid()
  )
);

-- RLS policies for sentinel_alerts
CREATE POLICY "Require authentication for sentinel_alerts"
ON public.sentinel_alerts AS RESTRICTIVE FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all sentinel alerts"
ON public.sentinel_alerts FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view alerts for their content"
ON public.sentinel_alerts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.ai_research_pipeline p
    WHERE p.id = sentinel_alerts.pipeline_id AND p.user_id = auth.uid()
  )
);