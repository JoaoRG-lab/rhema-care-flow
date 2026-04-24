import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-config-assistant`;

export function useAIAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    if (!user) {
      toast.error('Faça login para usar o assistente.');
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = '';

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: assistantContent,
            timestamp: new Date(),
          },
        ];
      });
    };

    try {
      const conversationHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        toast.error('Sessão expirada. Faça login novamente.');
        setIsLoading(false);
        return;
      }

      const response = await fetch(AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'x-idempotency-key': userMessage.id,
        },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error('Limite de requisições. Aguarde um momento.');
        } else if (response.status === 402) {
          setPaywallOpen(true);
          toast.error(errorData.error || 'Cota grátis esgotada. Compre créditos via PIX.');
        } else if (response.status === 401) {
          toast.error('Faça login para usar o assistente.');
        } else {
          toast.error(errorData.error || 'Falha ao obter resposta da IA');
        }
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim()) {
        for (const raw of buffer.split('\n')) {
          if (!raw || raw.startsWith(':') || !raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch { /* no-op */ }
        }
      }
    } catch (error) {
      console.error('AI assistant error:', error);
      toast.error('Failed to communicate with AI assistant');
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, user]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    paywallOpen,
    setPaywallOpen,
  };
}
