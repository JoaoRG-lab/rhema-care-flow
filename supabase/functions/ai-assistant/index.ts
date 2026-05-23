import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const ALLOWED_ORIGINS = [
  'https://www.reumatismos.com',
  'https://reumatismos.com',
  'https://rhema-care-flow.vercel.app',
  'https://uhs.health',
  'http://localhost:5173',
  'http://localhost:3000',
];

const FUNCTION_VERSION = 'rhema-care-v2.1-public-hardening';
const MAX_MESSAGE_LENGTH = 1400;
const MAX_HISTORY_ITEMS = 6;
const MAX_HISTORY_CONTENT_LENGTH = 900;
const DEFAULT_MODEL = 'sonar-pro';
const SECRET_NAME = 'PERPLEXITY_API_KEY';
const PROVIDER_ENDPOINT = 'https://api.perplexity.ai/chat/completions';

// Rate limiting simples em memória (por IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

type ChatRole = 'user' | 'assistant' | 'system';
type ChatMessage = { role: ChatRole; content: string };
type IncomingMessage = { role?: unknown; content?: unknown };

function getCorsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function jsonResponse(body: Record<string, unknown>, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function sanitizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item: IncomingMessage) => item?.role === 'user' || item?.role === 'assistant')
    .map((item: IncomingMessage) => ({
      role: item.role as 'user' | 'assistant',
      content: normalizeText(item.content, MAX_HISTORY_CONTENT_LENGTH),
    }))
    .filter((item: ChatMessage) => item.content.length > 0)
    .slice(-MAX_HISTORY_ITEMS);
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function buildSystemPrompt(context: string): string {
  return `Você é o Assistente Rhema Care, assistente público do ecossistema Rhema Care Flow / UHS Health OS.

Contexto operacional: ${context || 'public_site'}.

Missão:
- Explicar, em português brasileiro claro, o que é a plataforma e como ela organiza cuidado, educação em saúde e jornada clínica.
- Ajudar visitantes a entender páginas públicas, biblioteca clínica, diferenciais de segurança, privacidade e próximos passos.
- Responder dúvidas gerais sobre temas reumatológicos em linguagem educativa, sem substituir consulta médica.
- Sugerir caminhos seguros dentro do site quando a pergunta for sobre navegação, conteúdo ou funcionalidades públicas.

Limites obrigatórios:
- Nunca colete nome, CPF, telefone, endereço, documentos, número de convênio ou dados identificáveis.
- Não peça histórico clínico detalhado em chat público.
- Nunca forneça diagnóstico individual, prescrição, dose, troca de medicação ou conduta personalizada.
- Quando a pergunta envolver sintomas ou caso pessoal, responda em caráter educativo e oriente avaliação com profissional de saúde.
- Em possível urgência, oriente procurar atendimento de urgência/emergência local.
- Não invente números, parcerias, aprovações regulatórias ou funcionalidades não confirmadas.
- Se não souber, diga que não sabe e ofereça um caminho seguro.

Tom:
- Profissional, humano, objetivo e acolhedor.
- Sem exagero comercial.
- Frases curtas quando a pergunta for simples.
- Estruture em tópicos quando isso facilitar a compreensão.`;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? 'unknown';

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(origin) });
  }

  if (req.method === 'GET') {
    return jsonResponse({ ok: true, function: 'ai-assistant', version: FUNCTION_VERSION }, 200, origin);
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405, origin);
  }

  // Rate limit
  if (!checkRateLimit(ip)) {
    console.warn('ai-assistant rate-limit atingido', { ip });
    return jsonResponse({ error: 'Muitas requisições. Aguarde um momento.' }, 429, origin);
  }

  try {
    const body = await req.json();
    const { message, history = [], context = 'public_site' } = body;
    const userMessage = normalizeText(message, MAX_MESSAGE_LENGTH);

    if (!userMessage) {
      return jsonResponse({ error: 'Mensagem inválida ou vazia.' }, 400, origin);
    }

    const providerKey = Deno.env.get(SECRET_NAME);
    if (!providerKey) {
      console.error('ai-assistant: PERPLEXITY_API_KEY não configurada');
      return jsonResponse({ error: 'Serviço temporariamente indisponível.' }, 503, origin);
    }

    const safeHistory = sanitizeHistory(history);
    const safeContext = normalizeText(context, 80) || 'public_site';
    const model = normalizeText(Deno.env.get('PERPLEXITY_MODEL'), 80) || DEFAULT_MODEL;

    const aiResponse = await fetch(PROVIDER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${providerKey}`,
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

    if (!aiResponse.ok) {
      const details = await aiResponse.text();
      console.error('ai-assistant provider error', {
        status: aiResponse.status,
        details: details.slice(0, 300),
      });
      return jsonResponse({ error: 'Falha ao consultar o assistente de IA.' }, 502, origin);
    }

    const result = await aiResponse.json();
    const answer = result?.choices?.[0]?.message?.content ?? 'Não foi possível gerar uma resposta agora.';

    console.log('ai-assistant ok', { model, historyLen: safeHistory.length, context: safeContext });

    return jsonResponse({
      answer,
      meta: { function: 'ai-assistant', version: FUNCTION_VERSION, model },
    }, 200, origin);

  } catch (error) {
    console.error('ai-assistant erro interno', error instanceof Error ? error.message : String(error));
    return jsonResponse({ error: 'Erro interno no assistente.' }, 500, origin);
  }
});