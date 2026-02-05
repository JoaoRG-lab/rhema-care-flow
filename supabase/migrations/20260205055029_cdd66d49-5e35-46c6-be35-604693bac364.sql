-- Create verification request status enum
CREATE TYPE public.verification_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');

-- Create verification tier enum
CREATE TYPE public.verification_tier AS ENUM ('bronze', 'silver', 'gold', 'expert');

-- Create verification requests table
CREATE TABLE public.verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Personal Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- University Affiliation
  institution TEXT,
  department TEXT,
  position TEXT,
  institutional_email TEXT,
  
  -- Board Certification
  certifying_body TEXT,
  certification_credential TEXT,
  certification_date DATE,
  certification_expiry DATE,
  moc_status TEXT,
  
  -- Medical License
  license_number TEXT,
  license_issuing_authority TEXT,
  license_status TEXT,
  license_expiry DATE,
  
  -- Publications & Research
  orcid_id TEXT,
  publication_count INTEGER DEFAULT 0,
  notable_publications TEXT[],
  clinical_trial_roles TEXT,
  guideline_contributions TEXT,
  
  -- Expertise Areas
  expertise_areas TEXT[],
  years_in_practice INTEGER,
  
  -- Supporting Documentation (file paths in storage)
  documents TEXT[] DEFAULT '{}',
  
  -- Statement
  expertise_statement TEXT,
  
  -- Request Status
  status verification_status NOT NULL DEFAULT 'pending',
  tier verification_tier,
  
  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own verification requests"
ON public.verification_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verification requests"
ON public.verification_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending requests"
ON public.verification_requests
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Create trigger for updated_at
CREATE TRIGGER update_verification_requests_updated_at
BEFORE UPDATE ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false);

-- Create storage policies for verification documents
CREATE POLICY "Users can upload own verification documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own verification documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own verification documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);