-- Fix verification_requests RLS: users can only see their own, admins can see all
DROP POLICY IF EXISTS "Users can view their own verification requests" ON public.verification_requests;
DROP POLICY IF EXISTS "Admins can view all verification requests" ON public.verification_requests;

CREATE POLICY "Users can view only their own verification requests" 
ON public.verification_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verification requests" 
ON public.verification_requests 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Fix profiles RLS: users can only see their own profile, unless admin
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view only their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin(auth.uid()));