-- Drop existing policies on verification_requests
DROP POLICY IF EXISTS "Admins can manage all requests" ON verification_requests;
DROP POLICY IF EXISTS "Users can insert own requests" ON verification_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON verification_requests;
DROP POLICY IF EXISTS "Require authentication for verification_requests" ON verification_requests;

-- Create new restrictive policies for Ultimate User only (plus user can see their own)
CREATE POLICY "Ultimate User can view all requests"
ON verification_requests
FOR SELECT
TO authenticated
USING (public.is_ultimate_user(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Users can insert own requests"
ON verification_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Ultimate User can update all requests"
ON verification_requests
FOR UPDATE
TO authenticated
USING (public.is_ultimate_user(auth.uid()));

CREATE POLICY "Ultimate User can delete requests"
ON verification_requests
FOR DELETE
TO authenticated
USING (public.is_ultimate_user(auth.uid()));