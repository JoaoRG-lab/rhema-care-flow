import { useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

let _addToast: ((t: Omit<Toast, 'id'>) => void) | null = null;

// Singleton imperativo — pode ser chamado fora de componentes React
export function toast(t: Omit<Toast, 'id'>) {
  _addToast?.(t);
}

export function useToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const add = useCallback((t: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    const duration = t.duration ?? (t.type === 'error' ? 6000 : 4000);
    setToasts((prev) => [...prev.slice(-4), { ...t, id }]);
    const timer = setTimeout(() => remove(id), duration);
    timers.current.set(id, timer);
  }, [remove]);

  // Registra singleton
  _addToast = add;

  return { toasts, add, remove };
}

export function useToast() {
  return {
    toast: (t: Omit<Toast, 'id'>) => _addToast?.(t),
    success: (title: string, description?: string) =>
      _addToast?.({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      _addToast?.({ type: 'error', title, description }),
    warning: (title: string, description?: string) =>
      _addToast?.({ type: 'warning', title, description }),
    info: (title: string, description?: string) =>
      _addToast?.({ type: 'info', title, description }),
  };
}
