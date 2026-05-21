-- ============================================================
-- Migration: payment_audit_log + scheduled_sms melhorias
-- Versao: rhema-care-v2.0
-- Data: 2026-05-20
-- ============================================================

-- Tabela de auditoria de pagamentos (webhooks MP)
CREATE TABLE IF NOT EXISTS payment_audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id   text NOT NULL,
  status        text NOT NULL,
  raw_payload   jsonb,
  received_at   timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_audit_external ON payment_audit_log (external_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_status   ON payment_audit_log (status);
CREATE INDEX IF NOT EXISTS idx_payment_audit_received ON payment_audit_log (received_at DESC);

-- RLS: somente service_role pode inserir/ler audit log
ALTER TABLE payment_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only_audit" ON payment_audit_log
  USING (auth.role() = 'service_role');

-- Adiciona colunas faltantes em payment_transactions se nao existirem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_transactions' AND column_name = 'updated_at') THEN
    ALTER TABLE payment_transactions ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Adiciona colunas faltantes em user_ai_credits
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ai_credits' AND column_name = 'updated_at') THEN
    ALTER TABLE user_ai_credits ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Tabela scheduled_sms (cria se nao existir)
CREATE TABLE IF NOT EXISTS scheduled_sms (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number   text NOT NULL,
  message        text NOT NULL CHECK (length(message) <= 160),
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','sending','sent','failed','cancelled')),
  scheduled_at   timestamptz NOT NULL,
  sent_at        timestamptz,
  twilio_sid     text,
  error_message  text,
  patient_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sms_status_scheduled ON scheduled_sms (status, scheduled_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_sms_patient ON scheduled_sms (patient_id);

ALTER TABLE scheduled_sms ENABLE ROW LEVEL SECURITY;

-- Profissionais autenticados podem gerenciar SMS
CREATE POLICY "authenticated_manage_sms" ON scheduled_sms
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "service_role_sms" ON scheduled_sms
  USING (auth.role() = 'service_role');

-- Funcao para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sms_updated_at
  BEFORE UPDATE ON scheduled_sms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
