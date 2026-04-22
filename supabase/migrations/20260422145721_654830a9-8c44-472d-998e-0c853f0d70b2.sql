
CREATE TABLE public.patient_chain_anchors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  patient_card_id UUID NOT NULL REFERENCES public.patient_cards(id) ON DELETE CASCADE,
  timeline_hash TEXT NOT NULL,
  variable_codes TEXT[] NOT NULL DEFAULT '{}',
  record_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  anchor_type TEXT NOT NULL DEFAULT 'patient_timeline',
  tx_signature TEXT,
  cluster TEXT NOT NULL DEFAULT 'devnet',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pca_patient ON public.patient_chain_anchors(patient_card_id, created_at DESC);
CREATE INDEX idx_pca_user ON public.patient_chain_anchors(user_id);

ALTER TABLE public.patient_chain_anchors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors view own patient anchors"
  ON public.patient_chain_anchors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors insert own patient anchors"
  ON public.patient_chain_anchors FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.patient_cards pc
      WHERE pc.id = patient_card_id AND pc.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors delete own patient anchors"
  ON public.patient_chain_anchors FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Require auth for patient_chain_anchors"
  ON public.patient_chain_anchors AS RESTRICTIVE
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
