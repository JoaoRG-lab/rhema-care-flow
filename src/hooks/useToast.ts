import { useCallback } from 'react';
import type { ToastType } from '../types';

// Singleton event bus — funciona fora de componentes React
const listeners = new Set<(t: { type: ToastType; title: string; message?: string }) => void>();

export const toastBus = {
  emit(type: ToastType, title: string, message?: string) {
    listeners.forEach((fn) => fn({ type, title, message }));
  },
  subscribe(fn: (t: { type: ToastType; title: string; message?: string }) => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function useToast() {
  const success = useCallback((title: string, message?: string) => toastBus.emit('success', title, message), []);
  const error   = useCallback((title: string, message?: string) => toastBus.emit('error',   title, message), []);
  const warning = useCallback((title: string, message?: string) => toastBus.emit('warning', title, message), []);
  const info    = useCallback((title: string, message?: string) => toastBus.emit('info',    title, message), []);
  return { success, error, warning, info };
}
