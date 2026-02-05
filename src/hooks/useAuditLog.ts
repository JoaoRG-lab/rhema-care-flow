 import { useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 
 type AuditAction = 'view' | 'create' | 'update' | 'delete' | 'export' | 'download';
 type ResourceType = 'patient_card' | 'visit' | 'score_entry' | 'verification_request' | 'verification_document';
 
 interface AuditLogParams {
   action: AuditAction;
   resourceType: ResourceType;
   resourceId?: string;
   metadata?: Record<string, unknown>;
 }
 
 export function useAuditLog() {
   const { user } = useAuth();
 
   const logAccess = useCallback(async ({ action, resourceType, resourceId, metadata = {} }: AuditLogParams) => {
     if (!user) return;
 
     try {
       await supabase.from('audit_logs').insert({
         user_id: user.id,
         action,
         resource_type: resourceType,
         resource_id: resourceId,
         metadata: metadata as any,
         user_agent: navigator.userAgent,
       });
     } catch (error) {
       // Silently fail - don't block user action for audit logging failures
       console.error('Audit log failed:', error);
     }
   }, [user]);
 
   return { logAccess };
 }