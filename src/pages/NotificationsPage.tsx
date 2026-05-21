import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';

type NotifType = 'consulta' | 'exame' | 'alerta' | 'sistema';
type NotifStatus = 'lida' | 'nao_lida';

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  status: NotifStatus;
  created_at: string;
  link?: string;
}

const TYPE_ICON: Record<NotifType, string> = {
  consulta: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  exame:    'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2',
  alerta:   'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  sistema:  'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
};

const TYPE_COLOR: Record<NotifType, string> = {
  consulta: 'bg-blue-100   dark:bg-blue-900/30   text-blue-600   dark:text-blue-400',
  exame:    'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  alerta:   'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  sistema:  'bg-gray-100   dark:bg-gray-800       text-gray-500   dark:text-gray-400',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'agora';
  if (mins  < 60) return `${mins}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${days}d atrás`;
}

export default function NotificationsPage() {
  const { user }  = useAuth();
  const { toast } = useToast();
  const [items,   setItems]   = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<'todas' | 'nao_lida'>('todas');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const q = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(60);
    if (filter === 'nao_lida') q.eq('status', 'nao_lida');
    const { data, error } = await q;
    if (error) {
      toast({ variant: 'error', title: 'Erro ao carregar notificações', description: error.message });
    } else {
      setItems(data as Notif[]);
    }
    setLoading(false);
  }, [user, filter, toast]);

  useEffect(() => { load(); }, [load]);

  // Realtime — novas notificacoes chegam sem reload
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notif;
          setItems(prev => [n, ...prev]);
          toast({ variant: 'info', title: n.title, description: n.body, duration: 5000 });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, toast]);

  async function markRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'lida' })
      .eq('id', id);
    if (!error) setItems(prev => prev.map(n => n.id === id ? { ...n, status: 'lida' } : n));
  }

  async function markAllRead() {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'lida' })
      .eq('user_id', user.id)
      .eq('status', 'nao_lida');
    if (!error) {
      setItems(prev => prev.map(n => ({ ...n, status: 'lida' })));
      toast({ variant: 'success', title: 'Todas marcadas como lidas' });
    }
  }

  async function deleteNotif(id: string) {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) {
      setItems(prev => prev.filter(n => n.id !== id));
      toast({ variant: 'success', title: 'Notificação removida' });
    }
  }

  const unreadCount = items.filter(n => n.status === 'nao_lida').length;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Notificações
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-600 text-white text-xs font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{items.length} notificações no total</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-teal-600 dark:text-teal-400 hover:underline font-medium"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        {(['todas', 'nao_lida'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              filter === f
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
            ].join(' ')}
          >
            {f === 'todas' ? 'Todas' : `Não lidas${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            className="text-gray-300 dark:text-gray-700 mb-4" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhuma notificação</p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Você está em dia com tudo!</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map(n => (
            <li
              key={n.id}
              className={[
                'flex items-start gap-4 p-4 rounded-2xl border transition-colors cursor-pointer group',
                n.status === 'nao_lida'
                  ? 'bg-white dark:bg-gray-900 border-teal-100 dark:border-teal-900/40 hover:border-teal-200 dark:hover:border-teal-800'
                  : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/60',
              ].join(' ')}
              onClick={() => n.status === 'nao_lida' && markRead(n.id)}
            >
              {/* Ícone tipo */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${TYPE_COLOR[n.type]}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d={TYPE_ICON[n.type]} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium leading-snug ${
                    n.status === 'nao_lida' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'
                  }`}>{n.title}</p>
                  <span className="text-xs text-gray-400 dark:text-gray-600 shrink-0 tabular-nums">{timeAgo(n.created_at)}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
              </div>

              {/* Indicador não lida */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                {n.status === 'nao_lida' && (
                  <span className="w-2 h-2 rounded-full bg-teal-500 mt-1.5" aria-label="Não lida" />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 dark:text-gray-700 dark:hover:text-red-400 transition-all"
                  aria-label="Remover notificação"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
