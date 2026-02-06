-- Create function to check if user is the Ultimate User
CREATE OR REPLACE FUNCTION public.is_ultimate_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND verification_tier = 'ultimate'
  )
$$;

-- Drop existing permissive policies on outreach_contacts
DROP POLICY IF EXISTS "Admins can manage all contacts" ON outreach_contacts;
DROP POLICY IF EXISTS "Users can manage own contacts" ON outreach_contacts;
DROP POLICY IF EXISTS "Require authentication for outreach_contacts" ON outreach_contacts;

-- Create new restrictive policies for Ultimate User only
CREATE POLICY "Only Ultimate User can view contacts"
ON outreach_contacts
FOR SELECT
TO authenticated
USING (public.is_ultimate_user(auth.uid()));

CREATE POLICY "Only Ultimate User can insert contacts"
ON outreach_contacts
FOR INSERT
TO authenticated
WITH CHECK (public.is_ultimate_user(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Only Ultimate User can update contacts"
ON outreach_contacts
FOR UPDATE
TO authenticated
USING (public.is_ultimate_user(auth.uid()));

CREATE POLICY "Only Ultimate User can delete contacts"
ON outreach_contacts
FOR DELETE
TO authenticated
USING (public.is_ultimate_user(auth.uid()));