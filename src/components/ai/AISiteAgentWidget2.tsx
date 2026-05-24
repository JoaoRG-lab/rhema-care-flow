import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Bot, MessageCircle, Send, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_MESSAGE: Message = {
  id: '1',
  role: 'assistant',
  content:
    'Olá! Sou o Assistente Reumatismos. Posso ajudar com dúvidas educativas sobre doenças reumatológicas, sinais de alerta e jornada até o especialista. Como posso ajudar?',
};

const FALLBACK_MESSAGE =
  'O assistente de IA não respondeu agora. Você ainda pode navegar pelos guias públicos do site. Para sintomas intensos, piora rápida ou dúvida clínica pessoal, procure avaliação presencial.';

const TIMEOUT_MS = 18_000;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('timeout')), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function AISiteAgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTemporarilyUnavailable, setIsTemporarilyUnavailable] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text };
    const history = messages.slice(-8);

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke('ai-assistant', {
          body: {
            message: text,
            history,
            context: 'site_publico',
          },
        }),
        TIMEOUT_MS,
      );

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const answer = (data as any)?.reply || (data as any)?.answer;
      if (!answer) throw new Error('empty-assistant-response');

      setIsTemporarilyUnavailable(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: answer,
        },
      ]);
    } catch {
      setIsTemporarilyUnavailable(true);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: FALLBACK_MESSAGE,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white dark:bg-slate-900 w-80 sm:w-96 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col mb-4 transition-all duration-300 ease-in-out">
          {/* Header */}
          <div className="bg-teal-700 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-teal-200" />
              <div>
                <p className="font-semibold text-sm leading-none">Assistente Reumatismos</p>
                <p className="text-teal-200 text-xs mt-0.5">Orientação educativa &bull; Não substitui consulta</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-teal-200 hover:text-white transition-colors"
              aria-label="Fechar assistente"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isTemporarilyUnavailable && (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
              <div className="flex gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  IA temporariamente indisponível. O site continua funcionando; use os guias públicos para navegação educativa.
                </p>
              </div>
            </div>
          )}

          {/* Mensagens */}
          <div className="p-4 h-80 overflow-y-auto flex flex-col gap-3 bg-slate-50 dark:bg-slate-950/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-lg p-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-teal-700 text-white self-end rounded-br-none'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 self-start rounded-bl-none shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isLoading && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start rounded-lg rounded-bl-none p-3 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isTemporarilyUnavailable ? 'Tente novamente mais tarde...' : 'Pergunte sobre reumatologia...'}
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-sm rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-800 dark:text-slate-200"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white rounded-full p-2 transition-colors flex items-center justify-center w-10 h-10"
              aria-label="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Botão flutuante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-teal-700 hover:bg-teal-800 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-transform duration-200 flex items-center justify-center ring-4 ring-teal-700/20"
          aria-label="Abrir assistente de reumatologia"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
