-- Create consultation sessions table for 1:1 patient bookings
CREATE TABLE public.consultation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  patient_card_id uuid REFERENCES public.patient_cards(id) ON DELETE SET NULL,
  
  -- Session details
  title text NOT NULL,
  description text,
  session_type text NOT NULL DEFAULT 'informational', -- informational, follow_up, education, medication_review
  
  -- Scheduling
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  
  -- Status tracking
  status text NOT NULL DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled, no_show
  
  -- Communication
  patient_phone text,
  patient_email text,
  reminder_sent boolean DEFAULT false,
  
  -- Notes
  provider_notes text,
  patient_notes text,
  
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consultation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Require authentication for consultation_sessions"
  ON public.consultation_sessions
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Providers can view own sessions"
  ON public.consultation_sessions
  FOR SELECT
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert own sessions"
  ON public.consultation_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own sessions"
  ON public.consultation_sessions
  FOR UPDATE
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own sessions"
  ON public.consultation_sessions
  FOR DELETE
  USING (auth.uid() = provider_id);

-- Trigger for updated_at
CREATE TRIGGER update_consultation_sessions_updated_at
  BEFORE UPDATE ON public.consultation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_consultation_sessions_provider_date 
  ON public.consultation_sessions(provider_id, scheduled_date);

CREATE INDEX idx_consultation_sessions_status 
  ON public.consultation_sessions(status);