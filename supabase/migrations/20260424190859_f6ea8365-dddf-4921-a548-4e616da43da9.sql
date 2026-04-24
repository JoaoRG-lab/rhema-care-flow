-- Allow admins to read billing/debug data across all users
CREATE POLICY "Admins read all transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins read all credits"
ON public.user_ai_credits
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins read all idempotency records"
ON public.ai_assistant_idempotency
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));