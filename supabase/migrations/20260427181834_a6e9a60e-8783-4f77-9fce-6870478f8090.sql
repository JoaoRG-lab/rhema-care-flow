
-- 1) Make visits_secure return plain columns when encrypted ones are absent.
-- This prevents data loss for older inserts that only wrote to plain text columns.
DROP VIEW IF EXISTS public.visits_secure;

CREATE VIEW public.visits_secure
WITH (security_invoker = on)
AS
SELECT
  id,
  patient_card_id,
  user_id,
  visit_date,
  COALESCE(
    public.decrypt_sensitive_data(disease_activity_encrypted)::jsonb,
    disease_activity
  ) AS disease_activity,
  actions,
  labs_ordered,
  imaging,
  COALESCE(
    public.decrypt_sensitive_data(next_steps_encrypted),
    next_steps
  ) AS next_steps,
  attachments,
  created_at
FROM public.visits;

GRANT SELECT ON public.visits_secure TO authenticated;

-- 2) Auto-extract numeric scores from visits.disease_activity into score_entries.
-- When a visit row is inserted/updated with disease_activity = { "DAS28-ESR": 3.2, "CDAI": 8 ... },
-- create matching score_entries rows linked by visit_id (idempotent per (visit_id, score_type)).

CREATE OR REPLACE FUNCTION public.aggregate_visit_scores()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  k text;
  v jsonb;
  num_val numeric;
BEGIN
  IF NEW.disease_activity IS NULL OR jsonb_typeof(NEW.disease_activity) <> 'object' THEN
    RETURN NEW;
  END IF;

  FOR k, v IN SELECT * FROM jsonb_each(NEW.disease_activity)
  LOOP
    -- Only persist scalar numeric values (skip "pediatric" object, free-text "score", etc.)
    IF jsonb_typeof(v) = 'number' THEN
      num_val := (v::text)::numeric;
    ELSIF jsonb_typeof(v) = 'string' THEN
      BEGIN
        num_val := (v #>> '{}')::numeric;
      EXCEPTION WHEN others THEN
        num_val := NULL;
      END;
    ELSE
      num_val := NULL;
    END IF;

    IF num_val IS NOT NULL THEN
      INSERT INTO public.score_entries (
        user_id, visit_id, patient_card_id, score_type, data_json, calculated_score
      ) VALUES (
        NEW.user_id, NEW.id, NEW.patient_card_id, k,
        jsonb_build_object('source', 'visit', 'value', num_val),
        num_val
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_aggregate_visit_scores ON public.visits;
CREATE TRIGGER trg_aggregate_visit_scores
AFTER INSERT OR UPDATE OF disease_activity ON public.visits
FOR EACH ROW EXECUTE FUNCTION public.aggregate_visit_scores();
