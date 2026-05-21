import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { getCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import { verifyJWT } from '../_shared/auth.ts';
import { checkRateLimit, getClientIp } from '../_shared/rateLimit.ts';

const FUNCTION_VERSION = 'rhema-care-v2.0';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const ip = getClientIp(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405, origin);
  }

  const auth = await verifyJWT(req);
  if (!auth) {
    return jsonResponse({ error: 'Não autorizado.' }, 401, origin);
  }

  if (!checkRateLimit(`summarize:${auth.userId}:${ip}`, 20, 60_000)) {
    return jsonResponse({ error: 'Muitas requisições. Aguarde.' }, 429, origin);
  }

  try {
    const { visit_notes, patient_id, visit_date } = await req.json();

    if (!visit_notes || typeof visit_notes !== 'string' || visit_notes.trim().length < 10) {
      return jsonResponse({ error: 'Notas da visita inválidas ou muito curtas.' }, 400, origin);
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return jsonResponse({ error: 'Serviço de IA não configurado.' }, 503, origin);
    }

    const safeNotes = visit_notes.trim().slice(0, 4000);

    const aiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente clínico. Resuma as notas de visita médica de forma estruturada: Queixa Principal, Avaliação, Plano. Seja conciso e em português.',
          },
          { role: 'user', content: safeNotes },
        ],
        temperature: 0.2,
        max_tokens: 600,
      }),
    });

    if (!aiResp.ok) {
      console.error('summarize-visits AI error', { status: aiResp.status });
      return jsonResponse({ error: 'Falha ao sumarizar visita.' }, 502, origin);
    }

    const result = await aiResp.json();
    const summary = result?.choices?.[0]?.message?.content ?? 'Resumo indisponível.';

    console.log('summarize-visits ok', { userId: auth.userId, patient_id, visit_date });

    return jsonResponse({
      summary,
      meta: { function: 'summarize-visits', version: FUNCTION_VERSION, patient_id, visit_date },
    }, 200, origin);

  } catch (error) {
    console.error('summarize-visits erro interno', error instanceof Error ? error.message : String(error));
    return jsonResponse({ error: 'Erro interno.' }, 500, origin);
  }
});
