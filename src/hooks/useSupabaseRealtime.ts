import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface UseRealtimeOptions<T extends Record<string, unknown>> {
  table: string;
  schema?: string;
  filter?: string;
  event?: RealtimeEvent;
  onData: (payload: RealtimePostgresChangesPayload<T>) => void;
  enabled?: boolean;
}

export function useSupabaseRealtime<T extends Record<string, unknown>>(
  options: UseRealtimeOptions<T>
): void {
  const { table, schema = 'public', filter, event = '*', onData, enabled = true } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onDataRef = useRef(onData);

  useEffect(() => { onDataRef.current = onData; }, [onData]);

  const subscribe = useCallback(() => {
    if (!enabled) return;
    const channelName = `rt-${schema}-${table}-${filter ?? 'all'}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as Parameters<typeof channel.on>[0],
        { event, schema, table, ...(filter ? { filter } : {}) } as Parameters<typeof channel.on>[1],
        (payload: RealtimePostgresChangesPayload<T>) => { onDataRef.current(payload); }
      )
      .subscribe();
    channelRef.current = channel;
  }, [table, schema, filter, event, enabled]);

  useEffect(() => {
    subscribe();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [subscribe]);
}

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export function useNotificationsRealtime(
  userId: string | undefined,
  onNew: (n: NotificationRow) => void
): void {
  useSupabaseRealtime<NotificationRow>({
    table: 'notifications',
    filter: userId ? `user_id=eq.${userId}` : undefined,
    event: 'INSERT',
    enabled: !!userId,
    onData: (payload) => {
      if (payload.new && 'id' in payload.new) onNew(payload.new as NotificationRow);
    },
  });
}

export function usePatientsRealtime(
  onChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
): void {
  useSupabaseRealtime({ table: 'patients', event: '*', onData: onChange });
}
