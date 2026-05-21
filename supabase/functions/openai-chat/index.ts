import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { getCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import { checkRateLimit, getClientIp } from '../_shared/rateLimit.ts';
import { verifyJWT } from '../_shared/auth.ts';

const FUNCTION_VERSION = 'rhema-care-v2.0';
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 10;
const DEFAULT_MODEL = 'gpt-4o';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const ip = getClientIp(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(origin) });
  }

  if (req.method === 'GET') {
    return jsonResponse({ ok: true, function: 'openai-chat', version: FUNCTION_VERSION }, 200, origin);
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405, origin);
  }

  // Auth obrigatório para openai-chat (função interna)
  const auth = await verifyJWT(req);
  if (!auth) {
    return jsonResponse({ error: 'Não autorizado.' }, 401, origin);
  }

  if (!checkRateLimit(`${auth.userId}:${ip}`, 50, 60_000)) {
    return jsonResponse({ error: 'Muitas requisições. Aguarde um momento.' }, 429, origin);
  }

  try {
    const { message, history = [], context = 'internal' } = await req.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return jsonResponse({ error: 'Mensagem inválida.' }, 400, origin);
    }

    const userMessage = message.trim().slice(0, MAX_MESSAGE_LENGTH);
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiKey) {
      console.error('openai-chat: OPENAI_API_KEY não configurada');
      return jsonResponse({ error: 'Serviço temporariamente indisponível.' }, 503, origin);
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter((m: { role?: unknown }) => m?.role === 'user' || m?.role === 'assistant')
          .slice(-MAX_HISTORY_ITEMS)
          .map((m: { role: string; content: string }) => ({
            role: m.role,
            content: String(m.content ?? '').slice(0, 1000),
          }))
      : [];

    const systemPrompt = `Você é o assistente clínico-operacional do Rhema Care Flow.
Ajude profissionais de saúde com agendamentos, prontuários, teleconsultas e operações da plataforma.
Contexto: ${String(context).slice(0, 80)}.
Responda sempre em português brasileiro. Seja objetivo e preciso.`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL') || DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...safeHistory,
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!aiResponse.ok) {
      const details = await aiResponse.text();
      console.error('openai-chat provider error', { status: aiResponse.status, details: details.slice(0, 300) });
      return jsonResponse({ error: 'Falha ao consultar OpenAI.' }, 502, origin);
    }

    const result = await aiResponse.json();
    const answer = result?.choices?.[0]?.message?.content ?? 'Sem resposta disponível.';

    console.log('openai-chat ok', { userId: auth.userId, model: result?.model });

    return jsonResponse({
      answer,
      meta: { function: 'openai-chat', version: FUNCTION_VERSION, model: result?.model },
    }, 200, origin);

  } catch (error) {
    console.error('openai-chat erro interno', error instanceof Error ? error.message : String(error));
    return jsonResponse({ error: 'Erro interno.' }, 500, origin);
  }
});
