-- ============================================================
-- PRONTUÁRIO INTEGRADO POR CÓDIGO DO PACIENTE
-- Permite que outros profissionais acessem evoluções
-- APENAS com o patient_code, sem expor user_id ou dados de ID
-- ============================================================

-- 1. View pública de evoluções por código (sem expor user_id do médico)
CREATE OR REPLACE VIEW public.pron_evolucoes AS
SELECT
  v.id,
  pc.patient_code,
  v.visit_date,
  v.actions,
  v.labs_ordered,
  v.imaging,
  v.next_steps,
  v.disease_activity,
  v.created_at,
  -- Médico identificado só pela especialidade do perfil (sem nome ou ID)
  COALESCE(p.specialty, 'Não informado') AS specialty_do_medico,
  -- Iniciais anônimas do médico (ex: "Dr. C.M.")
  CASE 
    WHEN p.full_name IS NOT NULL AND length(trim(p.full_name)) > 0
    THEN 'Dr(a). ' || left(split_part(trim(p.full_name), ' ', 1), 1) || '.' ||
         CASE WHEN array_length(string_to_array(trim(p.full_name), ' '), 1) > 1
              THEN left(split_part(trim(p.full_name), ' ', 2), 1) || '.'
              ELSE '' END
    ELSE 'Profissional'
  END AS medico_iniciais
FROM visits_secure v
JOIN patient_cards pc ON pc.id = v.patient_card_id
LEFT JOIN profiles p ON p.user_id = v.user_id
ORDER BY v.visit_date DESC;

-- RLS da view — qualquer pessoa autenticada pode consultar por código
-- (a filtragem por patient_code é feita na query, não na policy)
-- A view já remove user_id e dados sensíveis do médico

-- 2. Tabela de log de acessos ao prontuário compartilhado
CREATE TABLE IF NOT EXISTS public.prontuario_access_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code  TEXT NOT NULL,
  accessor_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accessor_name TEXT,
  accessor_crm  TEXT,
  accessor_specialty TEXT,
  accessed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hint       TEXT -- últimos 4 chars do IP para auditoria mínima
);

-- RLS: o médico dono do paciente pode ver quem acessou
ALTER TABLE public.prontuario_access_log ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode inserir (registrar acesso)
CREATE POLICY "Auth users can insert access log"
  ON public.prontuario_access_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- O médico dono do paciente pode ler os logs dos seus pacientes
CREATE POLICY "Owner sees access log for own patients"
  ON public.prontuario_access_log FOR SELECT
  TO authenticated
  USING (
    patient_code IN (
      SELECT patient_code FROM patient_cards
      WHERE user_id = auth.uid()
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_pron_log_code ON public.prontuario_access_log(patient_code, accessed_at DESC);

-- 3. Função RPC segura: busca evoluções por código
-- Retorna dados sem expor IDs internos
CREATE OR REPLACE FUNCTION public.get_evolucoes_by_code(p_code TEXT)
RETURNS TABLE (
  id              UUID,
  visit_date      TEXT,
  actions         TEXT[],
  labs_ordered    TEXT[],
  imaging         TEXT[],
  next_steps      TEXT,
  disease_activity JSONB,
  specialty_do_medico TEXT,
  medico_iniciais TEXT,
  created_at      TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Normaliza código (uppercase, sem espaços)
  p_code := upper(trim(p_code));
  
  -- Verifica se código existe
  IF NOT EXISTS (SELECT 1 FROM patient_cards WHERE patient_code = p_code) THEN
    RAISE EXCEPTION 'Código de paciente não encontrado';
  END IF;

  RETURN QUERY
  SELECT
    v.id::UUID,
    v.visit_date::TEXT,
    v.actions,
    v.labs_ordered,
    v.imaging,
    v.next_steps::TEXT,
    v.disease_activity::JSONB,
    COALESCE(p.specialty, 'Não informado') AS specialty_do_medico,
    CASE 
      WHEN p.full_name IS NOT NULL AND length(trim(p.full_name)) > 0
      THEN 'Dr(a). ' || left(split_part(trim(p.full_name), ' ', 1), 1) || '.' ||
           CASE WHEN array_length(string_to_array(trim(p.full_name), ' '), 1) > 1
                THEN left(split_part(trim(p.full_name), ' ', 2), 1) || '.'
                ELSE '' END
      ELSE 'Profissional'
    END AS medico_iniciais,
    v.created_at::TEXT
  FROM visits_secure v
  JOIN patient_cards pc ON pc.id = v.patient_card_id
  LEFT JOIN profiles p ON p.user_id = v.user_id
  WHERE pc.patient_code = p_code
  ORDER BY v.visit_date DESC;
END;
$$;

-- Grant para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_evolucoes_by_code(TEXT) TO authenticated;
