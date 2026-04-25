-- Tabela de teleconsultas
CREATE TABLE IF NOT EXISTS public.teleconsultas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_card_id UUID REFERENCES public.patient_cards(id) ON DELETE SET NULL,
  patient_name  TEXT,
  specialty     TEXT,
  scheduled_date DATE NOT NULL,
  start_time    TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status        TEXT NOT NULL DEFAULT 'scheduled'
                CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
  daily_room_name TEXT,
  daily_room_url  TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.teleconsultas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinicians see own teleconsultas"
  ON public.teleconsultas FOR ALL
  USING (provider_id = auth.uid());

-- Index
CREATE INDEX IF NOT EXISTS idx_teleconsultas_provider ON public.teleconsultas(provider_id, scheduled_date);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_teleconsultas_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS teleconsultas_updated_at ON public.teleconsultas;
CREATE TRIGGER teleconsultas_updated_at
  BEFORE UPDATE ON public.teleconsultas
  FOR EACH ROW EXECUTE FUNCTION public.handle_teleconsultas_updated_at();
