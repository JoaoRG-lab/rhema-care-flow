-- Idempotency tracking for AI assistant credit debits.
-- A unique (user_id, idempotency_key) ensures the same request_id
-- can never debit credits twice, even on retries or timeouts.
CREATE TABLE IF NOT EXISTS public.ai_assistant_idempotency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  debited boolean NOT NULL DEFAULT false,
  debit_source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_assistant_idempotency_user_key_unique UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS ai_assistant_idempotency_created_at_idx
  ON public.ai_assistant_idempotency (created_at);

ALTER TABLE public.ai_assistant_idempotency ENABLE ROW LEVEL SECURITY;

-- No client access; only the service role (edge function) writes/reads this.
CREATE POLICY "Service role full access"
ON public.ai_assistant_idempotency
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users can read their own idempotency records (for transparency/debugging).
CREATE POLICY "Users read own idempotency records"
ON public.ai_assistant_idempotency
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
