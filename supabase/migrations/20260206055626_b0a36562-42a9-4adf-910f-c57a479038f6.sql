-- Add featured_image_url column to education_content table
ALTER TABLE public.education_content 
ADD COLUMN IF NOT EXISTS featured_image_url TEXT;

-- Create storage bucket for education images
INSERT INTO storage.buckets (id, name, public)
VALUES ('education-images', 'education-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view education images (public bucket)
CREATE POLICY "Anyone can view education images"
ON storage.objects FOR SELECT
USING (bucket_id = 'education-images');

-- Allow authenticated users to upload education images
CREATE POLICY "Authenticated users can upload education images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'education-images' AND auth.role() = 'authenticated');

-- Allow users to update their own uploads
CREATE POLICY "Users can update their own education images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'education-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own education images"
ON storage.objects FOR DELETE
USING (bucket_id = 'education-images' AND auth.uid()::text = (storage.foldername(name))[1]);