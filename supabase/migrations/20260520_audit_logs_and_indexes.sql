-- ============================================================
-- Migration: audit_logs padronizacao + indices de performance
-- Versao: rhema-care-v2.0
-- Data: 2026-05-20
-- ============================================================

-- Cria tabela audit_logs se nao existir
CREATE TABLE IF NOT EXISTS audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action        text NOT NULL,
  resource_type text NOT NULL,
  resource_id   text,
  metadata      jsonb,
  ip_address    text,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Indices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_audit_user_id    ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action     ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_resource   ON audit_logs (resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs (created_at DESC);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins podem ler todos os logs
CREATE POLICY "admin_read_audit" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role pode inserir
CREATE POLICY "service_role_insert_audit" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Tabela ai_conversations (para historico persistente de chat)
CREATE TABLE IF NOT EXISTS ai_conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name text NOT NULL DEFAULT 'openai-chat',
  context       text NOT NULL DEFAULT 'plataforma_interna',
  messages      jsonb NOT NULL DEFAULT '[]'::jsonb,
  model         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_user    ON ai_conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_updated ON ai_conversations (updated_at DESC);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_conversations" ON ai_conversations
  FOR ALL USING (auth.uid() = user_id);

-- Trigger updated_at para ai_conversations
CREATE OR REPLACE TRIGGER trg_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View de resumo de atividade por usuario (para admins)
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
  u.id AS user_id,
  u.email,
  COUNT(DISTINCT al.id)   FILTER (WHERE al.created_at > now() - INTERVAL '30 days') AS actions_30d,
  COUNT(DISTINCT ac.id)   FILTER (WHERE ac.created_at > now() - INTERVAL '30 days') AS ai_sessions_30d,
  MAX(al.created_at)      AS last_action_at
FROM auth.users u
LEFT JOIN audit_logs     al ON al.user_id  = u.id
LEFT JOIN ai_conversations ac ON ac.user_id = u.id
GROUP BY u.id, u.email;

GRANT SELECT ON user_activity_summary TO authenticated;
