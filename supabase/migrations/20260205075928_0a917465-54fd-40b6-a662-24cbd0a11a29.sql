-- Add encrypted columns for sensitive fields that don't have them yet
ALTER TABLE public.verification_requests 
  ADD COLUMN IF NOT EXISTS email_encrypted bytea,
  ADD COLUMN IF NOT EXISTS full_name_encrypted bytea,
  ADD COLUMN IF NOT EXISTS orcid_id_encrypted bytea;

-- Create encryption trigger function for verification_requests
CREATE OR REPLACE FUNCTION public.encrypt_verification_sensitive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encrypt email
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    NEW.email_encrypted := public.encrypt_sensitive_data(NEW.email);
  END IF;
  
  -- Encrypt full_name
  IF NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN
    NEW.full_name_encrypted := public.encrypt_sensitive_data(NEW.full_name);
  END IF;
  
  -- Encrypt orcid_id
  IF NEW.orcid_id IS NOT NULL AND NEW.orcid_id != '' THEN
    NEW.orcid_id_encrypted := public.encrypt_sensitive_data(NEW.orcid_id);
  END IF;
  
  -- Encrypt institutional_email
  IF NEW.institutional_email IS NOT NULL AND NEW.institutional_email != '' THEN
    NEW.institutional_email_encrypted := public.encrypt_sensitive_data(NEW.institutional_email);
  END IF;
  
  -- Encrypt license_number
  IF NEW.license_number IS NOT NULL AND NEW.license_number != '' THEN
    NEW.license_number_encrypted := public.encrypt_sensitive_data(NEW.license_number);
  END IF;
  
  -- Encrypt certification_credential
  IF NEW.certification_credential IS NOT NULL AND NEW.certification_credential != '' THEN
    NEW.certification_credential_encrypted := public.encrypt_sensitive_data(NEW.certification_credential);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic encryption on insert/update
DROP TRIGGER IF EXISTS encrypt_verification_requests_trigger ON public.verification_requests;
CREATE TRIGGER encrypt_verification_requests_trigger
  BEFORE INSERT OR UPDATE ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_verification_sensitive();

-- Backfill existing data with encrypted values
UPDATE public.verification_requests
SET 
  email_encrypted = public.encrypt_sensitive_data(email),
  full_name_encrypted = public.encrypt_sensitive_data(full_name),
  orcid_id_encrypted = public.encrypt_sensitive_data(orcid_id),
  institutional_email_encrypted = public.encrypt_sensitive_data(institutional_email),
  license_number_encrypted = public.encrypt_sensitive_data(license_number),
  certification_credential_encrypted = public.encrypt_sensitive_data(certification_credential)
WHERE email_encrypted IS NULL OR full_name_encrypted IS NULL;

-- Update the secure view to decrypt all sensitive fields
DROP VIEW IF EXISTS public.verification_requests_secure;
CREATE VIEW public.verification_requests_secure
WITH (security_invoker = on)
AS
SELECT
  id,
  user_id,
  -- Decrypt sensitive fields from encrypted columns
  public.decrypt_sensitive_data(email_encrypted) AS email,
  public.decrypt_sensitive_data(full_name_encrypted) AS full_name,
  public.decrypt_sensitive_data(orcid_id_encrypted) AS orcid_id,
  public.decrypt_sensitive_data(institutional_email_encrypted) AS institutional_email,
  public.decrypt_sensitive_data(license_number_encrypted) AS license_number,
  public.decrypt_sensitive_data(certification_credential_encrypted) AS certification_credential,
  -- Non-sensitive fields
  institution,
  department,
  position,
  expertise_areas,
  years_in_practice,
  status,
  tier,
  submitted_at,
  reviewed_at,
  created_at,
  updated_at
FROM public.verification_requests;

-- Add comment documenting the encryption
COMMENT ON TRIGGER encrypt_verification_requests_trigger ON public.verification_requests 
  IS 'Automatically encrypts sensitive PII fields (email, full_name, orcid_id, institutional_email, license_number, certification_credential) on insert/update';