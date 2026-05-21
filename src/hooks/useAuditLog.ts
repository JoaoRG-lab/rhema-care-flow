import { useCallback } from 'react';
import { AuditService } from '../services/AuditService';

export function useAuditLog() {
  const log = useCallback(
    (action: string, resource: string, resourceId?: string, meta?: Record<string, unknown>) =>
      AuditService.log(action, resource, resourceId, meta),
    []
  );
  return { log };
}
