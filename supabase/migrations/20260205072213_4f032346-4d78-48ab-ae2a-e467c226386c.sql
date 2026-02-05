-- First, fix the encrypt_sensitive_data function to not use digest()
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(p_data text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_data IS NULL OR p_data = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use pgp_sym_encrypt with a passphrase directly
  RETURN pgp_sym_encrypt(p_data, 'rheumatology_phi_secure_key_v2_aes256');
END;
$$;

-- Fix decrypt function as well
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(p_encrypted bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_encrypted IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_decrypt(p_encrypted, 'rheumatology_phi_secure_key_v2_aes256');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;