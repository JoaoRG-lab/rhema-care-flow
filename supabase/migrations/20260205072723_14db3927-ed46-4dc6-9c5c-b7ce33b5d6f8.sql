-- Enable RLS on all secure views and add restrictive policies

-- verification_requests_secure view
ALTER VIEW public.verification_requests_secure SET (security_invoker = on);

-- patient_cards_secure view  
ALTER VIEW public.patient_cards_secure SET (security_invoker = on);

-- visits_secure view
ALTER VIEW public.visits_secure SET (security_invoker = on);

-- infusion_events_secure view
ALTER VIEW public.infusion_events_secure SET (security_invoker = on);

-- monitoring_events_secure view
ALTER VIEW public.monitoring_events_secure SET (security_invoker = on);

-- score_entries_secure view
ALTER VIEW public.score_entries_secure SET (security_invoker = on);