import { useState, useEffect } from 'react';
import { NotificationService } from '../services/NotificationService';
import { useAuth } from '../contexts/AuthContext';
import type { Notification } from '../types';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread,         setUnread]        = useState(0);
  const [loading,        setLoading]       = useState(true);

  useEffect(() => {
    if (!user) return;

    NotificationService.list(user.id).then((ns) => {
      setNotifications(ns);
      setUnread(ns.filter((n) => !n.read).length);
      setLoading(false);
    });

    const channel = NotificationService.subscribeToUser(user.id, (n) => {
      setNotifications((prev) => [n, ...prev]);
      setUnread((c) => c + 1);
    });

    return () => { channel.unsubscribe(); };
  }, [user]);

  async function markRead(id: string) {
    await NotificationService.markRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnread((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    if (!user) return;
    await NotificationService.markAllRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  }

  return { notifications, unread, loading, markRead, markAllRead };
}
