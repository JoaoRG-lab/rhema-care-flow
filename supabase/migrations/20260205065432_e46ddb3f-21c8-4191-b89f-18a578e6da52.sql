-- Drop existing SELECT policies and recreate with explicit auth check
DROP POLICY IF EXISTS "Users can view own verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Admins can view all verification requests" ON public.verification_requests;

-- Recreate with explicit authentication requirement
CREATE POLICY "Users can view own verification requests"
ON public.verification_requests
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Admins can view all verification requests"
ON public.verification_requests
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND public.is_admin(auth.uid())
);