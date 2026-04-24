
-- Credits balance per user
CREATE TABLE public.user_ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  credits_balance INTEGER NOT NULL DEFAULT 0,
  free_quota_used INTEGER NOT NULL DEFAULT 0,
  free_quota_limit INTEGER NOT NULL DEFAULT 10,
  quota_reset_at TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_ai_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credits"
  ON public.user_ai_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own credits row"
  ON public.user_ai_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_ai_credits_updated_at
  BEFORE UPDATE ON public.user_ai_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Payment transactions (PIX)
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  payment_method TEXT NOT NULL DEFAULT 'pix',
  external_id TEXT UNIQUE,
  amount_brl NUMERIC(10,2) NOT NULL,
  credits_amount INTEGER NOT NULL,
  package_label TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  qr_code TEXT,
  qr_code_base64 TEXT,
  ticket_url TEXT,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions"
  ON public.payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_payment_transactions_user ON public.payment_transactions(user_id, created_at DESC);
CREATE INDEX idx_payment_transactions_external ON public.payment_transactions(external_id);

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
