/**
 * useInternalAI — IA interna do Rhema Care Flow
 * Usa Hugging Face Inference API com modelo de linguagem médica.
 * Token deve ser configurado em VITE_HF_TOKEN (env var, nunca commitado).
 *
 * Modelos recomendados (trocar em HF_MODEL conforme necessidade):
 *   - 'mistralai/Mistral-7B-Instruct-v0.3'  (geral, rápido)
 *   - 'microsoft/BiomedNLP-BiomedBERT-base-uncased-abstract-fulltext' (embeddings biomédicos)
 *   - 'HuggingFaceH4/zephyr-7b-beta' (instrução, gratuito na Inference API)
 */

import { useState, useCallback, useRef } from 'react';

const HF_API = 'https://api-inference.huggingface.co/models';
const HF_MODEL = import.meta.env.VITE_HF_MODEL ?? 'HuggingFaceH4/zephyr-7b-beta';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface UseInternalAIReturn {
  ask: (prompt: string, systemPrompt?: string) => Promise<string>;
  messages: AIMessage[];
  loading: boolean;
  error: string | null;
  clearHistory: () => void;
}

const SYSTEM_DEFAULT = `Você é o assistente clínico interno do Rhema Care Flow,
um sistema de gestão de saúde. Responda sempre em português do Brasil.
Seja preciso, conciso e baseado em evidências. Nunca faça diagnósticos definitivos.
Sempre oriente a consultar um profissional de saúde para decisões clínicas.`;

export function useInternalAI(): UseInternalAIReturn {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const ask = useCallback(async (prompt: string, systemPrompt = SYSTEM_DEFAULT): Promise<string> => {
    const token = import.meta.env.VITE_HF_TOKEN;
    if (!token) {
      const msg = 'VITE_HF_TOKEN não configurado. Adicione ao .env e ao Vercel.';
      setError(msg);
      return msg;
    }

    // Cancela requisição anterior se ainda em andamento
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    const userMessage: AIMessage = { role: 'user', content: prompt };
    const updatedMessages: AIMessage[] = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      const response = await fetch(`${HF_API}/${HF_MODEL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          model: HF_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...updatedMessages,
          ],
          max_tokens: 512,
          temperature: 0.4,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HuggingFace API erro ${response.status}: ${errText}`);
      }

      const data = await response.json() as {
        choices: Array<{ message: { content: string } }>;
      };

      const reply = data.choices?.[0]?.message?.content ?? '(sem resposta)';

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      return reply;
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return '';
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      console.error('[useInternalAI]', msg);
      return `Erro: ${msg}`;
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { ask, messages, loading, error, clearHistory };
}
