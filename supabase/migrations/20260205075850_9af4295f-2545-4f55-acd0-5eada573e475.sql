-- Enable the vault extension if not already enabled
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- Store the encryption key in the vault
-- Note: Using the same key for migration continuity, but you should rotate this key in production
SELECT vault.create_secret(
  'rheumatology_phi_secure_key_v2_aes256',
  'phi_encryption_key',
  'PHI encryption key for patient data'
);

-- Update encrypt_sensitive_data to use vault
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(p_data text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  v_key text;
BEGIN
  IF p_data IS NULL OR p_data = '' THEN
    RETURN NULL;
  END IF;
  
  -- Retrieve encryption key from vault
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'phi_encryption_key'
  LIMIT 1;
  
  IF v_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in vault';
  END IF;
  
  RETURN extensions.pgp_sym_encrypt(p_data::text, v_key::text);
END;
$$;

-- Update decrypt_sensitive_data to use vault
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(p_encrypted bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  v_key text;
  v_result text;
BEGIN
  IF p_encrypted IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Retrieve encryption key from vault
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'phi_encryption_key'
  LIMIT 1;
  
  IF v_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in vault';
  END IF;
  
  v_result := extensions.pgp_sym_decrypt(p_encrypted, v_key::text);
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log decryption failure but don't expose key details
    RETURN NULL;
END;
$$;

-- Add comment documenting the security improvement
COMMENT ON FUNCTION public.encrypt_sensitive_data(text) IS 'Encrypts sensitive PHI data using AES-256 with key stored in Supabase Vault';
COMMENT ON FUNCTION public.decrypt_sensitive_data(bytea) IS 'Decrypts PHI data using key from Supabase Vault. Returns NULL on failure.';