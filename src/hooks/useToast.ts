import { useCallback, useEffect, useRef, useState } from 'react';
import type { Toast, ToastType } from '../types';

type Listener = (t: { type: ToastType; title: string; message?: string }) => void;

// Singleton event bus — funciona fora de componentes React
const listeners = new Set<Listener>();

export const toastBus = {
  emit(type: ToastType, title: string, message?: string) {
    listeners.forEach((fn) => fn({ type, title, message }));
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

// Re-exporta para compatibilidade com imports diretos de useToast
export type { Toast, ToastType };

// Hook para disparar toasts (usado em qualquer componente)
export function useToast() {
  const success = useCallback((title: string, message?: string) => toastBus.emit('success', title, message), []);
  const error   = useCallback((title: string, message?: string) => toastBus.emit('error',   title, message), []);
  const warning = useCallback((title: string, message?: string) => toastBus.emit('warning', title, message), []);
  const info    = useCallback((title: string, message?: string) => toastBus.emit('info',    title, message), []);
  return { success, error, warning, info };
}

// Hook para o ToastContainer — mantém a lista de toasts visíveis
export function useToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const unsub = toastBus.subscribe(({ type, title, message }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const toast: Toast = { id, type, title, description: message };

      setToasts((prev) => [...prev, toast]);

      timers.current[id] = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        delete timers.current[id];
      }, 4000);
    });

    return () => {
      unsub();
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  const remove = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, remove };
}
