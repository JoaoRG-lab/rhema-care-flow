-- Drop existing policies on scheduled_sms
DROP POLICY IF EXISTS "Users can delete own scheduled SMS" ON scheduled_sms;
DROP POLICY IF EXISTS "Users can insert own scheduled SMS" ON scheduled_sms;
DROP POLICY IF EXISTS "Users can update own scheduled SMS" ON scheduled_sms;
DROP POLICY IF EXISTS "Users can view own scheduled SMS" ON scheduled_sms;

-- Create new restrictive policies for Ultimate User only
CREATE POLICY "Only Ultimate User can view SMS"
ON scheduled_sms
FOR SELECT
TO authenticated
USING (public.is_ultimate_user(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Only Ultimate User can insert SMS"
ON scheduled_sms
FOR INSERT
TO authenticated
WITH CHECK (public.is_ultimate_user(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Only Ultimate User can update SMS"
ON scheduled_sms
FOR UPDATE
TO authenticated
USING (public.is_ultimate_user(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Only Ultimate User can delete SMS"
ON scheduled_sms
FOR DELETE
TO authenticated
USING (public.is_ultimate_user(auth.uid()) OR auth.uid() = user_id);