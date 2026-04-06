
-- ============================================
-- EPIDEMIOLOGICAL MATRIX SYSTEM
-- ============================================

-- Variable catalog: defines what clinical variables exist
CREATE TABLE public.epi_variable_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'custom',
  data_type TEXT NOT NULL DEFAULT 'numeric',
  value_range JSONB,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Encrypted feature vectors per patient contribution
CREATE TABLE public.epi_feature_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_card_id UUID REFERENCES public.patient_cards(id) ON DELETE CASCADE,
  vector_hash TEXT NOT NULL,
  vector_encrypted BYTEA NOT NULL,
  variable_codes TEXT[] NOT NULL,
  dimension INT NOT NULL,
  noise_added BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Population-level aggregated statistics (no individual data)
CREATE TABLE public.epi_aggregated_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_key TEXT NOT NULL,
  variable_code TEXT NOT NULL REFERENCES public.epi_variable_definitions(code),
  sample_size INT NOT NULL DEFAULT 0,
  stat_type TEXT NOT NULL DEFAULT 'mean',
  stat_value NUMERIC,
  confidence_interval JSONB,
  noise_epsilon NUMERIC NOT NULL DEFAULT 1.0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cohort_key, variable_code, stat_type)
);

-- Risk prediction results (per-vector, encrypted)
CREATE TABLE public.epi_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_vector_id UUID REFERENCES public.epi_feature_vectors(id) ON DELETE CASCADE NOT NULL,
  risk_model TEXT NOT NULL,
  risk_score NUMERIC,
  risk_category TEXT,
  contributing_factors JSONB,
  model_version TEXT NOT NULL DEFAULT 'v1',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Solana audit anchors for matrix computations
CREATE TABLE public.epi_chain_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anchor_type TEXT NOT NULL,
  data_hash TEXT NOT NULL,
  tx_signature TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.epi_variable_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epi_feature_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epi_aggregated_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epi_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epi_chain_anchors ENABLE ROW LEVEL SECURITY;

-- Variable definitions: public read, admin write
CREATE POLICY "Anyone can read variable definitions"
  ON public.epi_variable_definitions FOR SELECT USING (true);
CREATE POLICY "Admins can manage variable definitions"
  ON public.epi_variable_definitions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Feature vectors: only owner can CRUD
CREATE POLICY "Users manage own feature vectors"
  ON public.epi_feature_vectors FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Aggregated stats: public read (population data, no PII)
CREATE POLICY "Anyone can read aggregated stats"
  ON public.epi_aggregated_stats FOR SELECT USING (true);
CREATE POLICY "Admins can manage aggregated stats"
  ON public.epi_aggregated_stats FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Risk scores: only owner via feature vector
CREATE POLICY "Users read own risk scores"
  ON public.epi_risk_scores FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.epi_feature_vectors fv
    WHERE fv.id = feature_vector_id AND fv.user_id = auth.uid()
  ));

-- Chain anchors: public read
CREATE POLICY "Anyone can read chain anchors"
  ON public.epi_chain_anchors FOR SELECT USING (true);
CREATE POLICY "Admins can manage chain anchors"
  ON public.epi_chain_anchors FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed system variable definitions (rheumatology + general)
INSERT INTO public.epi_variable_definitions (code, label, category, data_type, value_range, is_system, sort_order) VALUES
  ('AGE', 'Age (years)', 'demographics', 'numeric', '{"min": 0, "max": 120}', true, 1),
  ('SEX', 'Biological sex', 'demographics', 'categorical', '{"values": ["M", "F"]}', true, 2),
  ('ETHNICITY', 'Ethnicity/Race', 'demographics', 'categorical', '{"values": ["WHITE", "BLACK", "BROWN", "ASIAN", "INDIGENOUS", "OTHER"]}', true, 3),
  ('BMI', 'Body Mass Index', 'anthropometry', 'numeric', '{"min": 10, "max": 80}', true, 4),
  ('SMOKING', 'Smoking status', 'lifestyle', 'categorical', '{"values": ["NEVER", "FORMER", "CURRENT"]}', true, 5),
  ('HAS', 'Hypertension', 'comorbidity', 'binary', '{"values": [0, 1]}', true, 10),
  ('DM', 'Diabetes mellitus', 'comorbidity', 'binary', '{"values": [0, 1]}', true, 11),
  ('DLP', 'Dyslipidemia', 'comorbidity', 'binary', '{"values": [0, 1]}', true, 12),
  ('CKD', 'Chronic kidney disease', 'comorbidity', 'binary', '{"values": [0, 1]}', true, 13),
  ('FH_CV', 'Family history: cardiovascular', 'family_history', 'binary', '{"values": [0, 1]}', true, 20),
  ('FH_DM', 'Family history: diabetes', 'family_history', 'binary', '{"values": [0, 1]}', true, 21),
  ('FH_AI', 'Family history: autoimmune', 'family_history', 'binary', '{"values": [0, 1]}', true, 22),
  ('FH_CANCER', 'Family history: cancer', 'family_history', 'binary', '{"values": [0, 1]}', true, 23),
  ('DAS28', 'DAS28 score', 'rheumatology', 'numeric', '{"min": 0, "max": 10}', true, 30),
  ('HAQ', 'HAQ-DI score', 'rheumatology', 'numeric', '{"min": 0, "max": 3}', true, 31),
  ('BASDAI', 'BASDAI score', 'rheumatology', 'numeric', '{"min": 0, "max": 10}', true, 32),
  ('RF_POS', 'Rheumatoid factor positive', 'rheumatology', 'binary', '{"values": [0, 1]}', true, 33),
  ('ACPA_POS', 'Anti-CCP positive', 'rheumatology', 'binary', '{"values": [0, 1]}', true, 34),
  ('DISEASE_DURATION', 'Disease duration (years)', 'rheumatology', 'numeric', '{"min": 0, "max": 80}', true, 35),
  ('SBP', 'Systolic blood pressure', 'vitals', 'numeric', '{"min": 60, "max": 300}', true, 40),
  ('DBP', 'Diastolic blood pressure', 'vitals', 'numeric', '{"min": 30, "max": 200}', true, 41),
  ('TOTAL_CHOL', 'Total cholesterol', 'labs', 'numeric', '{"min": 50, "max": 500}', true, 42),
  ('HDL', 'HDL cholesterol', 'labs', 'numeric', '{"min": 10, "max": 150}', true, 43),
  ('LDL', 'LDL cholesterol', 'labs', 'numeric', '{"min": 10, "max": 400}', true, 44),
  ('CREATININE', 'Serum creatinine', 'labs', 'numeric', '{"min": 0.1, "max": 20}', true, 45),
  ('CRP', 'C-reactive protein', 'labs', 'numeric', '{"min": 0, "max": 300}', true, 46),
  ('ESR', 'Erythrocyte sedimentation rate', 'labs', 'numeric', '{"min": 0, "max": 150}', true, 47);

-- Triggers for updated_at
CREATE TRIGGER update_epi_variables_updated_at BEFORE UPDATE ON public.epi_variable_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_epi_vectors_updated_at BEFORE UPDATE ON public.epi_feature_vectors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
