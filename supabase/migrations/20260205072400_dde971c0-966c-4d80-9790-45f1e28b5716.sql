-- Create secure views for visits, score_entries, and verification_requests

CREATE OR REPLACE VIEW public.visits_secure
WITH (security_invoker = on)
AS
SELECT 
  id, patient_card_id, user_id, visit_date,
  public.decrypt_sensitive_data(disease_activity_encrypted)::jsonb as disease_activity,
  actions, labs_ordered, imaging,
  public.decrypt_sensitive_data(next_steps_encrypted) as next_steps,
  attachments, created_at
FROM public.visits;

CREATE OR REPLACE VIEW public.score_entries_secure
WITH (security_invoker = on)
AS
SELECT 
  id, user_id, patient_card_id, visit_id, score_type, calculated_score,
  public.decrypt_sensitive_data(data_json_encrypted)::jsonb as data_json,
  created_at
FROM public.score_entries;

CREATE OR REPLACE VIEW public.verification_requests_secure
WITH (security_invoker = on)
AS
SELECT 
  id, user_id, full_name, email,
  public.decrypt_sensitive_data(license_number_encrypted) as license_number,
  public.decrypt_sensitive_data(institutional_email_encrypted) as institutional_email,
  public.decrypt_sensitive_data(certification_credential_encrypted) as certification_credential,
  institution, department, position, years_in_practice, expertise_areas,
  status, tier, submitted_at, reviewed_at, created_at, updated_at
FROM public.verification_requests;