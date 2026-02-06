-- Add Sumsub-specific columns to verification_requests
ALTER TABLE public.verification_requests 
ADD COLUMN IF NOT EXISTS sumsub_applicant_id text,
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_requests_sumsub_id 
ON public.verification_requests(sumsub_applicant_id) 
WHERE sumsub_applicant_id IS NOT NULL;

-- Add verification_tier to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'verification_tier'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN verification_tier text;
  END IF;
END $$;