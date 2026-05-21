import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface NotifSummary {
  unread: number;
}

/**
 * Hook leve para qualquer componente que precisa saber
 * quantas notificacoes nao lidas o usuario tem.
 * Atualiza em tempo real via Supabase Realtime.
 */
export function useNotifications(): NotifSummary {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'nao_lida');
    setUnread(count ?? 0);
  }, [user]);

  useEffect(() => { fetchCount(); }, [fetchCount]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('notif-badge')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchCount()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchCount]);

  return { unread };
}
