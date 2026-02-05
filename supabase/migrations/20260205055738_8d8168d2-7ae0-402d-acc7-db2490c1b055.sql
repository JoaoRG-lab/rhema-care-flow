-- Add new verification tiers for developers and partners
ALTER TYPE public.verification_tier ADD VALUE IF NOT EXISTS 'developer';
ALTER TYPE public.verification_tier ADD VALUE IF NOT EXISTS 'partner';

-- Add a contributor_type column to distinguish clinical vs technical contributors
ALTER TABLE public.verification_requests 
ADD COLUMN IF NOT EXISTS contributor_type TEXT DEFAULT 'clinical' CHECK (contributor_type IN ('clinical', 'developer', 'partner'));

-- Add developer/partner specific fields
ALTER TABLE public.verification_requests
ADD COLUMN IF NOT EXISTS github_username TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS partnership_type TEXT,
ADD COLUMN IF NOT EXISTS technical_expertise TEXT[];