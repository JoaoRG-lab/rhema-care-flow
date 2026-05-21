import { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, string> = {
  success: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  error:   'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  info:    'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
};

const COLORS: Record<ToastVariant, string> = {
  success: 'border-l-green-500  bg-green-50  dark:bg-green-950/60  text-green-800  dark:text-green-200',
  error:   'border-l-red-500    bg-red-50    dark:bg-red-950/60    text-red-800    dark:text-red-200',
  warning: 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-200',
  info:    'border-l-blue-500   bg-blue-50   dark:bg-blue-950/60   text-blue-800   dark:text-blue-200',
};

const ICON_COLORS: Record<ToastVariant, string> = {
  success: 'text-green-500',
  error:   'text-red-500',
  warning: 'text-orange-500',
  info:    'text-blue-500',
};

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onDismiss(t.id), 350);
    }, t.duration ?? 4000);
    return () => { cancelAnimationFrame(show); clearTimeout(timer); };
  }, [t.id, t.duration, onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-xl border-l-4 shadow-lg',
        'transition-all duration-350 ease-out',
        COLORS[t.variant],
        visible && !leaving ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8',
      ].join(' ')}
      style={{ minWidth: 280, maxWidth: 380 }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className={`mt-0.5 shrink-0 ${ICON_COLORS[t.variant]}`} aria-hidden="true">
        <path d={ICONS[t.variant]} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{t.title}</p>
        {t.description && <p className="text-xs mt-0.5 opacity-80 text-wrap-pretty">{t.description}</p>}
      </div>
      <button
        onClick={() => { setLeaving(true); setTimeout(() => onDismiss(t.id), 350); }}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Fechar notificação"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = `toast-${++counter.current}`;
    setToasts(prev => [...prev.slice(-4), { ...opts, id }]); // max 5
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {/* Portal-like fixed container */}
      <div
        aria-label="Notificações"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end"
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
