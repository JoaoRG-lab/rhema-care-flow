-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted column for sensitive notes
ALTER TABLE public.monitoring_events 
ADD COLUMN notes_encrypted bytea;

-- Create encryption function using AES-256
-- Uses a server-side key that should be set via Vault or environment
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(p_data text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key bytea;
BEGIN
  -- Use a fixed key derived from a secret (in production, use Vault)
  -- This key is derived from 'monitoring_encryption_key' concept
  v_key := digest('rheumatology_monitoring_secure_key_v1', 'sha256');
  
  IF p_data IS NULL OR p_data = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_encrypt(p_data, encode(v_key, 'base64'));
END;
$$;

-- Create decryption function
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(p_encrypted bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key bytea;
BEGIN
  v_key := digest('rheumatology_monitoring_secure_key_v1', 'sha256');
  
  IF p_encrypted IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_decrypt(p_encrypted, encode(v_key, 'base64'));
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL if decryption fails (corrupted data or wrong key)
    RETURN NULL;
END;
$$;

-- Migrate existing notes to encrypted column
UPDATE public.monitoring_events
SET notes_encrypted = public.encrypt_sensitive_data(notes)
WHERE notes IS NOT NULL AND notes != '';

-- Create a secure view for reading monitoring events with decrypted notes
CREATE OR REPLACE VIEW public.monitoring_events_secure
WITH (security_invoker = on)
AS
SELECT 
  id,
  user_id,
  patient_card_id,
  event_type,
  due_date,
  status,
  completed_at,
  public.decrypt_sensitive_data(notes_encrypted) as notes,
  created_at
FROM public.monitoring_events;

-- Add trigger to auto-encrypt notes on insert/update
CREATE OR REPLACE FUNCTION public.encrypt_monitoring_notes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encrypt the notes field if provided
  IF NEW.notes IS NOT NULL AND NEW.notes != '' THEN
    NEW.notes_encrypted := public.encrypt_sensitive_data(NEW.notes);
    -- Keep original notes for backward compatibility during transition
    -- In production, you would set NEW.notes := NULL after migration
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER encrypt_monitoring_notes_trigger
BEFORE INSERT OR UPDATE ON public.monitoring_events
FOR EACH ROW
EXECUTE FUNCTION public.encrypt_monitoring_notes();

-- Similarly encrypt notes in patient_cards
ALTER TABLE public.patient_cards 
ADD COLUMN notes_encrypted bytea;

-- Migrate existing patient card notes
UPDATE public.patient_cards
SET notes_encrypted = public.encrypt_sensitive_data(notes)
WHERE notes IS NOT NULL AND notes != '';

-- Create secure view for patient cards
CREATE OR REPLACE VIEW public.patient_cards_secure
WITH (security_invoker = on)
AS
SELECT 
  id,
  user_id,
  patient_code,
  mrn_last4,
  diagnosis_tags,
  therapy_tags,
  risk_flags,
  last_visit_date,
  next_followup_date,
  public.decrypt_sensitive_data(notes_encrypted) as notes,
  created_at,
  updated_at
FROM public.patient_cards;

-- Add trigger for patient cards
CREATE OR REPLACE FUNCTION public.encrypt_patient_notes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.notes IS NOT NULL AND NEW.notes != '' THEN
    NEW.notes_encrypted := public.encrypt_sensitive_data(NEW.notes);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER encrypt_patient_notes_trigger
BEFORE INSERT OR UPDATE ON public.patient_cards
FOR EACH ROW
EXECUTE FUNCTION public.encrypt_patient_notes();