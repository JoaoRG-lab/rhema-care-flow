import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

type FeedbackType = 'bug' | 'sugestao' | 'elogio' | 'duvida' | 'outro';

const TYPES: { value: FeedbackType; label: string; emoji: string }[] = [
  { value: 'bug',      label: 'Bug',      emoji: '🐛' },
  { value: 'sugestao', label: 'Sugestao', emoji: '💡' },
  { value: 'elogio',   label: 'Elogio',   emoji: '🌟' },
  { value: 'duvida',   label: 'Duvida',   emoji: '❓' },
  { value: 'outro',    label: 'Outro',    emoji: '📝' },
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('sugestao');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 10) return;
    setStatus('sending');
    try {
      const { error } = await supabase.functions.invoke('send-feedback-email', {
        body: {
          type,
          message: message.trim(),
          page_url: window.location.href,
          user_agent: navigator.userAgent,
        },
      });
      if (error) throw error;
      setStatus('success');
      setMessage('');
      setTimeout(() => { setOpen(false); setStatus('idle'); }, 2500);
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Enviar feedback"
        className="fixed bottom-6 left-6 z-50 px-3 py-2 rounded-full bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 text-white text-xs font-medium shadow-lg transition-colors flex items-center gap-1.5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Feedback
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Enviar feedback"
          className="fixed bottom-20 left-6 z-50 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Enviar Feedback</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Fechar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {status === 'success' ? (
            <div className="py-6 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Obrigado pelo feedback!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Tipo */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 block">Tipo</label>
                <div className="flex flex-wrap gap-1.5">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        type === t.value
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mensagem */}
              <div>
                <label htmlFor="feedback-msg" className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                  Mensagem <span className="text-gray-400">(min. 10 caracteres)</span>
                </label>
                <textarea
                  id="feedback-msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Descreva aqui..."
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              {status === 'error' && (
                <p className="text-xs text-red-500">Erro ao enviar. Tente novamente.</p>
              )}

              <button
                type="submit"
                disabled={status === 'sending' || message.trim().length < 10}
                className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {status === 'sending' ? 'Enviando...' : 'Enviar'}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}

export default FeedbackWidget;
