
-- 1. Create handle_new_user trigger on auth.users (was missing!)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Ensure custody_audit_log has proper foreign key and indexes
CREATE INDEX IF NOT EXISTS idx_custody_audit_log_custody_id ON public.custody_audit_log(custody_id);
CREATE INDEX IF NOT EXISTS idx_custody_audit_log_created_at ON public.custody_audit_log(created_at DESC);

-- 3. Ensure ultimate_user_custody has proper indexes
CREATE INDEX IF NOT EXISTS idx_ultimate_user_custody_status ON public.ultimate_user_custody(installation_status);
