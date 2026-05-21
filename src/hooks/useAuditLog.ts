import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type AuditAction =
  | 'patient_created'
  | 'patient_updated'
  | 'patient_deactivated'
  | 'prontuario_entry_created'
  | 'prontuario_entry_updated'
  | 'prontuario_entry_deleted'
  | 'score_saved'
  | 'visit_created'
  | 'visit_status_updated'
  | 'file_uploaded'
  | 'file_deleted'
  | 'teleconsulta_started'
  | 'teleconsulta_ended'
  | 'sms_scheduled'
  | 'user_login'
  | 'user_logout';

interface LogParams {
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export function useAuditLog() {
  const { user } = useAuth();

  const log = useCallback(
    async ({ action, resourceType, resourceId, metadata }: LogParams) => {
      if (!user) return;
      try {
        await supabase.from('audit_logs').insert({
          user_id:       user.id,
          action,
          resource_type: resourceType,
          resource_id:   resourceId ?? null,
          metadata:      metadata ?? null,
          ip_address:    null, // IP capturado server-side pelo Edge Function se necessario
        });
      } catch (e) {
        // Audit nao deve quebrar o fluxo principal
        console.warn('[useAuditLog] falha silenciosa:', e);
      }
    },
    [user],
  );

  return { log };
}
