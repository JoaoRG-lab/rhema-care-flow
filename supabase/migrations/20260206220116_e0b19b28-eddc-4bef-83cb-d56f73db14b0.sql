-- Allow seed_hash to be null during pending_generation state
ALTER TABLE public.ultimate_user_custody 
ALTER COLUMN seed_hash DROP NOT NULL;