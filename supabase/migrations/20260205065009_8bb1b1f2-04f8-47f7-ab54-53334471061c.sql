-- Add admin access policy for verification documents bucket
CREATE POLICY "Admins can view all verification documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'verification-documents'
  AND public.is_admin(auth.uid())
);