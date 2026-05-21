import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import { verifyJWT } from '../_shared/auth.ts';
import { checkRateLimit, getClientIp } from '../_shared/rateLimit.ts';

const FUNCTION_VERSION = 'rhema-care-v2.0';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const ip = getClientIp(req);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(origin) });
  if (req.method !== 'POST') return jsonResponse({ error: 'Metodo nao permitido.' }, 405, origin);

  const auth = await verifyJWT(req);
  if (!auth) return jsonResponse({ error: 'Nao autorizado.' }, 401, origin);

  if (!checkRateLimit(`trends:${auth.userId}:${ip}`, 10, 60_000)) {
    return jsonResponse({ error: 'Muitas requisicoes. Aguarde.' }, 429, origin);
  }

  try {
    const { period = '30d', metrics = ['visits', 'patients', 'sms'] } = await req.json().catch(() => ({}));

    const validPeriods = ['7d', '30d', '90d', '365d'];
    const safePeriod = validPeriods.includes(period) ? period : '30d';
    const days = parseInt(safePeriod);
    const since = new Date(Date.now() - days * 86400_000).toISOString();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    // Coleta metricas conforme solicitado
    const data: Record<string, unknown> = {};

    if ((metrics as string[]).includes('visits')) {
      const { data: visits, error } = await adminClient
        .from('visits')
        .select('id, created_at, status')
        .gte('created_at', since);
      if (!error) data.visits = { count: visits?.length ?? 0, period: safePeriod };
    }

    if ((metrics as string[]).includes('patients')) {
      const { data: patients, error } = await adminClient
        .from('patient_cards')
        .select('id, created_at')
        .gte('created_at', since);
      if (!error) data.new_patients = { count: patients?.length ?? 0, period: safePeriod };
    }

    if ((metrics as string[]).includes('sms')) {
      const { data: sms, error } = await adminClient
        .from('scheduled_sms')
        .select('id, status, created_at')
        .gte('created_at', since);
      if (!error) {
        const sent = sms?.filter((s) => s.status === 'sent').length ?? 0;
        const failed = sms?.filter((s) => s.status === 'failed').length ?? 0;
        data.sms = { total: sms?.length ?? 0, sent, failed, period: safePeriod };
      }
    }

    if ((metrics as string[]).includes('payments')) {
      const { data: payments, error } = await adminClient
        .from('payment_transactions')
        .select('id, status, created_at')
        .gte('created_at', since);
      if (!error) {
        const paid = payments?.filter((p) => p.status === 'paid').length ?? 0;
        data.payments = { total: payments?.length ?? 0, paid, period: safePeriod };
      }
    }

    // Analise com GPT-4o se disponivel
    let aiInsight: string | null = null;
    if (openaiKey && Object.keys(data).length > 0) {
      try {
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
                content: 'Voce e um analista clinico-operacional do Rhema Care Flow. Analise os dados e gere um insight executivo em 2-3 frases em portugues. Seja objetivo e acionavel.',
              },
              {
                role: 'user',
                content: `Dados do periodo ${safePeriod}: ${JSON.stringify(data)}`,
              },
            ],
            temperature: 0.3,
            max_tokens: 300,
          }),
        });
        if (aiResp.ok) {
          const aiData = await aiResp.json();
          aiInsight = aiData?.choices?.[0]?.message?.content ?? null;
        }
      } catch (e) {
        console.warn('analyze-trends AI insight error', e instanceof Error ? e.message : String(e));
      }
    }

    console.log('analyze-trends ok', { userId: auth.userId, period: safePeriod, metrics });

    return jsonResponse({
      period: safePeriod,
      metrics: data,
      ai_insight: aiInsight,
      meta: { function: 'analyze-trends', version: FUNCTION_VERSION, generated_at: new Date().toISOString() },
    }, 200, origin);

  } catch (error) {
    console.error('analyze-trends erro interno', error instanceof Error ? error.message : String(error));
    return jsonResponse({ error: 'Erro interno.' }, 500, origin);
  }
});
