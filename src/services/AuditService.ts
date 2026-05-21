import { supabase } from '../lib/supabase';
import type { AuditLog, PaginatedResult } from '../types';

export const AuditService = {
  async log(action: string, resource: string, resourceId?: string, meta?: Record<string, unknown>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action,
      resource,
      resource_id: resourceId ?? null,
      meta: meta ?? null,
    });
  },

  async list(page = 1, perPage = 20): Promise<PaginatedResult<AuditLog>> {
    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);
    if (error) throw error;
    return {
      data: data ?? [],
      count: count ?? 0,
      page,
      perPage,
      totalPages: Math.ceil((count ?? 0) / perPage),
    };
  },
};
