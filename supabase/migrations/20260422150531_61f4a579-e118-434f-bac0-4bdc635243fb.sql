
-- Tighten RLS on patient_chain_anchors: every operation must verify
-- both the caller is user_id AND owns the linked patient_card. Anchors
-- are immutable (no UPDATE allowed) and must carry a non-empty hash.

-- Drop old, looser policies
DROP POLICY IF EXISTS "Doctors view own patient anchors" ON public.patient_chain_anchors;
DROP POLICY IF EXISTS "Doctors insert own patient anchors" ON public.patient_chain_anchors;
DROP POLICY IF EXISTS "Doctors delete own patient anchors" ON public.patient_chain_anchors;

-- SELECT: must own anchor row AND own the linked patient card
CREATE POLICY "Doctors view own patient anchors"
  ON public.patient_chain_anchors FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.patient_cards pc
      WHERE pc.id = patient_chain_anchors.patient_card_id
        AND pc.user_id = auth.uid()
    )
  );

-- INSERT: must own anchor row AND own the linked patient card
CREATE POLICY "Doctors insert own patient anchors"
  ON public.patient_chain_anchors FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.patient_cards pc
      WHERE pc.id = patient_chain_anchors.patient_card_id
        AND pc.user_id = auth.uid()
    )
  );

-- DELETE: same defense-in-depth
CREATE POLICY "Doctors delete own patient anchors"
  ON public.patient_chain_anchors FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.patient_cards pc
      WHERE pc.id = patient_chain_anchors.patient_card_id
        AND pc.user_id = auth.uid()
    )
  );

-- UPDATE: anchors are immutable on-chain proofs — explicitly deny
DROP POLICY IF EXISTS "Deny updates on patient anchors" ON public.patient_chain_anchors;
CREATE POLICY "Deny updates on patient anchors"
  ON public.patient_chain_anchors FOR UPDATE
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- Data quality: ensure non-empty SHA-256 hex hash and at least one variable code
ALTER TABLE public.patient_chain_anchors
  DROP CONSTRAINT IF EXISTS patient_chain_anchors_hash_format_chk;
ALTER TABLE public.patient_chain_anchors
  ADD CONSTRAINT patient_chain_anchors_hash_format_chk
  CHECK (timeline_hash ~ '^[0-9a-f]{64}$' AND array_length(variable_codes, 1) >= 1);
