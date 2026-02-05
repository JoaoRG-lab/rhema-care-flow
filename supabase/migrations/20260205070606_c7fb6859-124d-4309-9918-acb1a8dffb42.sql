-- Add explicit DENY policies for UPDATE and DELETE on audit_logs
-- This ensures the audit trail cannot be modified or deleted

-- Deny all UPDATE operations on audit_logs
CREATE POLICY "Deny all updates to audit logs"
ON public.audit_logs
FOR UPDATE
USING (false);

-- Deny all DELETE operations on audit_logs  
CREATE POLICY "Deny all deletes from audit logs"
ON public.audit_logs
FOR DELETE
USING (false);