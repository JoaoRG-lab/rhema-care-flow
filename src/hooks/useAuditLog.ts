 import { useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';
 
 type AuditAction = 'view' | 'create' | 'update' | 'delete' | 'export' | 'download';
 type ResourceType = 'patient_card' | 'visit' | 'score_entry' | 'verification_request' | 'verification_document';
 
 interface AuditLogParams {
   action: AuditAction;
   resourceType: ResourceType;
   resourceId?: string;
   metadata?: Record<string, unknown>;
 }
 
const MAX_METADATA_SIZE = 5000;
const MAX_STRING_LENGTH = 500;
const MAX_DEPTH = 3;

function sanitizeValue(value: unknown, depth: number = 0): unknown {
  if (depth > MAX_DEPTH) return '[nested]';
  
  if (value === null || value === undefined) return value;
  
  if (typeof value === 'string') {
    return value.slice(0, MAX_STRING_LENGTH);
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  
  if (Array.isArray(value)) {
    return value.slice(0, 10).map(item => sanitizeValue(item, depth + 1));
  }
  
  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    const keys = Object.keys(value as Record<string, unknown>).slice(0, 20);
    for (const key of keys) {
      const sanitizedKey = key.slice(0, 50);
      sanitized[sanitizedKey] = sanitizeValue((value as Record<string, unknown>)[key], depth + 1);
    }
    return sanitized;
  }
  
  return String(value).slice(0, MAX_STRING_LENGTH);
}

function validateAndSanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> | null {
  try {
    const sanitized = sanitizeValue(metadata, 0) as Record<string, unknown>;
    const jsonStr = JSON.stringify(sanitized);
    
    if (jsonStr.length > MAX_METADATA_SIZE) {
      console.warn('Audit metadata too large, truncating');
      return { _truncated: true, _originalSize: jsonStr.length };
    }
    
    return sanitized;
  } catch (error) {
    console.error('Failed to sanitize audit metadata:', error);
    return { _error: 'Invalid metadata' };
  }
}

 export function useAuditLog() {
   const { user } = useAuth();
 
   const logAccess = useCallback(async ({ action, resourceType, resourceId, metadata = {} }: AuditLogParams) => {
     if (!user) return;
 
    const sanitizedMetadata = validateAndSanitizeMetadata(metadata);
    if (!sanitizedMetadata) return;

     try {
       await supabase.from('audit_logs').insert({
         user_id: user.id,
         action,
         resource_type: resourceType,
         resource_id: resourceId,
        metadata: sanitizedMetadata as Json,
         user_agent: navigator.userAgent,
       });
     } catch (error) {
       // Silently fail - don't block user action for audit logging failures
       console.error('Audit log failed:', error);
     }
   }, [user]);
 
   return { logAccess };
 }