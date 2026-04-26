
CREATE TABLE public.teleconsultas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  patient_card_id uuid REFERENCES public.patient_cards(id) ON DELETE SET NULL,
  patient_name text,
  specialty text,
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'scheduled',
  daily_room_name text,
  daily_room_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teleconsultas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Require authentication for teleconsultas"
  ON public.teleconsultas AS RESTRICTIVE FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Providers view own teleconsultas"
  ON public.teleconsultas FOR SELECT
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers insert own teleconsultas"
  ON public.teleconsultas FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers update own teleconsultas"
  ON public.teleconsultas FOR UPDATE
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers delete own teleconsultas"
  ON public.teleconsultas FOR DELETE
  USING (auth.uid() = provider_id);

CREATE TRIGGER update_teleconsultas_updated_at
  BEFORE UPDATE ON public.teleconsultas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_teleconsultas_provider ON public.teleconsultas(provider_id);
CREATE INDEX idx_teleconsultas_date ON public.teleconsultas(scheduled_date, start_time);
