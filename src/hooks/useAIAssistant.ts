import { useState, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export type AIMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type AIContext =
  | 'plataforma_interna'
  | 'agendamento'
  | 'prontuario'
  | 'teleconsulta'
  | 'public_site';

interface UseAIAssistantOptions {
  context?: AIContext;
  maxHistory?: number;
  onError?: (error: string) => void;
}

export function useAIAssistant({
  context = 'plataforma_interna',
  maxHistory = 10,
  onError,
}: UseAIAssistantOptions = {}) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    // Cancela requisicao anterior se ainda pendente
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const functionName = session ? 'openai-chat' : 'ai-assistant';

      const history = messages
        .slice(-maxHistory)
        .map((m) => ({ role: m.role, content: m.content }));

      const { data, error: fnError } = await supabase.functions.invoke(functionName, {
        body: { message: trimmed, history, context },
      });

      if (fnError) throw new Error(fnError.message);

      const assistantMsg: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data?.answer ?? 'Sem resposta disponivel.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      return assistantMsg;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      const msg = e instanceof Error ? e.message : 'Erro ao conectar com o assistente.';
      setError(msg);
      onError?.(msg);
      console.error('useAIAssistant error', msg);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, context, maxHistory, onError]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const cancelRequest = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    cancelRequest,
  };
}
