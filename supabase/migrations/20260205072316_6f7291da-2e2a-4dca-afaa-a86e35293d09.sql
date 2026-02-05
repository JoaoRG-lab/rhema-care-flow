-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Recreate encryption function with explicit schema reference
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(p_data text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF p_data IS NULL OR p_data = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN extensions.pgp_sym_encrypt(p_data::text, 'rheumatology_phi_secure_key_v2_aes256'::text);
END;
$$;

-- Recreate decryption function with explicit schema reference
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(p_encrypted bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF p_encrypted IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN extensions.pgp_sym_decrypt(p_encrypted, 'rheumatology_phi_secure_key_v2_aes256'::text);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;