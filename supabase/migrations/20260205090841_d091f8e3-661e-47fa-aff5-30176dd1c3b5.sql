-- Create table for scheduled SMS messages
CREATE TABLE public.scheduled_sms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_card_id UUID REFERENCES public.patient_cards(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  template_id TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'appointment',
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT scheduled_sms_status_check CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  CONSTRAINT scheduled_sms_reminder_type_check CHECK (reminder_type IN ('24h', '1h', 'custom')),
  CONSTRAINT scheduled_sms_source_type_check CHECK (source_type IN ('followup', 'infusion', 'monitoring', 'shift'))
);

-- Create index for efficient querying of pending messages
CREATE INDEX idx_scheduled_sms_pending ON public.scheduled_sms (scheduled_for, status) WHERE status = 'pending';
CREATE INDEX idx_scheduled_sms_user ON public.scheduled_sms (user_id);
CREATE INDEX idx_scheduled_sms_source ON public.scheduled_sms (source_type, source_id);

-- Enable RLS
ALTER TABLE public.scheduled_sms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own scheduled SMS"
  ON public.scheduled_sms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scheduled SMS"
  ON public.scheduled_sms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled SMS"
  ON public.scheduled_sms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled SMS"
  ON public.scheduled_sms FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_scheduled_sms_updated_at
  BEFORE UPDATE ON public.scheduled_sms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for user SMS preferences
CREATE TABLE public.sms_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  auto_schedule_24h BOOLEAN NOT NULL DEFAULT true,
  auto_schedule_1h BOOLEAN NOT NULL DEFAULT true,
  default_phone_field TEXT DEFAULT 'phone',
  twilio_phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own SMS preferences"
  ON public.sms_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);