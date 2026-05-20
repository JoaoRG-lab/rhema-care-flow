import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const FUNCTION_VERSION = 'site-agent-hardening-v1';
const MAX_MESSAGE_LENGTH = 1400;
const MAX_HISTORY_ITEMS = 6;
const MAX_HISTORY_CONTENT_LENGTH = 900;
const DEFAULT_MODEL = 'sonar-pro';

type ChatRole = 'user' | 'assistant' | 'system';

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type IncomingMessage = {
  role?: unknown;
  content?: unknown;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function sanitizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter((item: IncomingMessage) => item && (item.role === 'user' || item.role === 'assistant'))
    .map((item: IncomingMessage) => ({
      role: item.role as 'user' | 'assistant',
      content: normalizeText(item.content, MAX_HISTORY_CONTENT_LENGTH),
    }))
    .filter((item: ChatMessage) => item.content.length > 0)
    .slice(-MAX_HISTORY_ITEMS);
}

function buildSystemPrompt(context: string) {
  return `Você é o UHS Site Agent, assistente público do UHS Health OS / Protocolo Vida.

Contexto operacional: ${context || 'public_site'}.

Missão:
- Explicar, em português brasileiro claro, o que é o UHS Health OS / Protocolo Vida.
- Apresentar a plataforma como camada clínica-operacional para jornada assistencial, educação, organização clínica, triagem estruturada e suporte a especialidades.
- Ajudar visitantes a entender funcionalidades públicas, biblioteca clínica, proposta institucional, diferenciais de segurança e próximos passos.

Limites obrigatórios:
- Não colete nome, CPF, telefone, endereço, documentos, número de convênio ou dados identificáveis.
- Não peça histórico clínico detalhado em chat público.
- Não forneça diagnóstico individual, prescrição, dose, troca de medicação ou conduta personalizada.
- Quando a pergunta envolver sintomas ou caso pessoal, responda em caráter educativo e oriente avaliação com profissional de saúde.
- Em possível urgência, recomende procurar atendimento de urgência/emergência local.
- Não invente números, parcerias, aprovações regulatórias ou funcionalidades não confirmadas.
- Se não souber, diga que não sabe e ofereça um caminho seguro.

Tom:
- Profissional, humano, objetivo e acolhedor.
- Sem exagero comercial.
- Frases curtas quando a pergunta for simples.
- Estruture em tópicos quando isso facilitar a compreensão.

Identidade resumida:
O Protocolo Vida / UHS Health OS busca integrar cuidado clínico, educação em saúde, organização longitudinal, biblioteca de conhecimento, indicadores e arquitetura de confiança, com privacidade by design.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (req.method === 'GET') {
    return jsonResponse({ ok: true, function: 'ai-assistant', version: FUNCTION_VERSION });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405);
  }

  try {
    const { message, history = [], context = 'public_site' } = await req.json();
    const userMessage = normalizeText(message, MAX_MESSAGE_LENGTH);

    if (!userMessage) {
      return jsonResponse({ error: 'Mensagem inválida.' }, 400);
    }

    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityKey) {
      return jsonResponse({ error: 'Chave da IA não configurada no Supabase.' }, 500);
    }

    const safeHistory = sanitizeHistory(history);
    const safeContext = normalizeText(context, 80) || 'public_site';
    const model = normalizeText(Deno.env.get('PERPLEXITY_MODEL'), 80) || DEFAULT_MODEL;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: buildSystemPrompt(safeContext) },
          ...safeHistory,
          { role: 'user', content: userMessage },
        ],
        temperature: 0.2,
        max_tokens: 650,
      }),
    });

    if (!response.ok) {
      const providerStatus = response.status;
      const details = await response.text();
      console.error('ai-assistant provider error', { providerStatus, details: details.slice(0, 300) });
      return jsonResponse({ error: 'Falha ao consultar o assistente.' }, 502);
    }

    const result = await response.json();
    const answer = result?.choices?.[0]?.message?.content || 'Não consegui gerar uma resposta agora.';

    return jsonResponse({
      answer,
      meta: {
        function: 'ai-assistant',
        version: FUNCTION_VERSION,
        model,
      },
    });
  } catch (error) {
    console.error('ai-assistant internal error', error instanceof Error ? error.message : error);
    return jsonResponse({ error: 'Erro interno no assistente.' }, 500);
  }
});
