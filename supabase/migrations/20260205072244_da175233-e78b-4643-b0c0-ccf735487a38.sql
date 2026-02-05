-- Step 1: Add all missing encrypted columns first
ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS disease_activity_encrypted bytea,
ADD COLUMN IF NOT EXISTS next_steps_encrypted bytea;

ALTER TABLE public.score_entries
ADD COLUMN IF NOT EXISTS data_json_encrypted bytea;

ALTER TABLE public.infusion_events
ADD COLUMN IF NOT EXISTS pre_checklist_encrypted bytea;

ALTER TABLE public.verification_requests
ADD COLUMN IF NOT EXISTS license_number_encrypted bytea,
ADD COLUMN IF NOT EXISTS institutional_email_encrypted bytea,
ADD COLUMN IF NOT EXISTS certification_credential_encrypted bytea;