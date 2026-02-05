-- Create storage bucket for visit attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('visit-attachments', 'visit-attachments', false);

-- Create RLS policies for visit attachments bucket
CREATE POLICY "Users can view own visit attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'visit-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own visit attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'visit-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own visit attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'visit-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add attachments column to visits table
ALTER TABLE public.visits ADD COLUMN attachments text[] DEFAULT '{}'::text[];