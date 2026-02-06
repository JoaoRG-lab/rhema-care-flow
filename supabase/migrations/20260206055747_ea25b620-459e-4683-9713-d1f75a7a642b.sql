-- Add linkedin_url column to verification_requests table
ALTER TABLE public.verification_requests 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;