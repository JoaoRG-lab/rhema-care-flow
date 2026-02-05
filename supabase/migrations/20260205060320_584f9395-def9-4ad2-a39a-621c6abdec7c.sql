-- Add linkedin_url field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;