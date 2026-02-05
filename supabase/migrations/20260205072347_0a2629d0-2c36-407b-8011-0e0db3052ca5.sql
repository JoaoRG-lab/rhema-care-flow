-- Add missing notes_encrypted column to infusion_events
ALTER TABLE public.infusion_events
ADD COLUMN IF NOT EXISTS notes_encrypted bytea;

-- Update infusion notes to encrypted
UPDATE public.infusion_events
SET notes_encrypted = public.encrypt_sensitive_data(notes)
WHERE notes IS NOT NULL;

-- Create secure view for infusion events using correct column
CREATE OR REPLACE VIEW public.infusion_events_secure
WITH (security_invoker = on)
AS
SELECT 
  id, user_id, patient_card_id, drug, interval_days, next_date,
  public.decrypt_sensitive_data(notes_encrypted) as notes,
  public.decrypt_sensitive_data(pre_checklist_encrypted)::jsonb as pre_checklist,
  created_at, updated_at
FROM public.infusion_events;