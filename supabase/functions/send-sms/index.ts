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

  if (!checkRateLimit(`sms:${auth.userId}:${ip}`, 20, 60_000)) {
    return jsonResponse({ error: 'Muitas requisições de SMS. Aguarde.' }, 429, origin);
  }

  try {
    const { to, message, patient_id } = await req.json();

    if (!to || !message) {
      return jsonResponse({ error: 'Campos obrigatórios: to, message.' }, 400, origin);
    }

    // Validação simples de telefone brasileiro
    const phoneRegex = /^\+55\d{10,11}$/;
    if (!phoneRegex.test(to.replace(/\s/g, ''))) {
      return jsonResponse({ error: 'Número de telefone inválido. Use formato +55...' }, 400, origin);
    }

    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioSid || !twilioToken || !twilioFrom) {
      console.error('send-sms: credenciais Twilio não configuradas');
      return jsonResponse({ error: 'Serviço de SMS não configurado.' }, 503, origin);
    }

    const formData = new URLSearchParams();
    formData.append('To', to);
    formData.append('From', twilioFrom);
    formData.append('Body', String(message).slice(0, 160));

    const twilioResp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      }
    );

    if (!twilioResp.ok) {
      const err = await twilioResp.text();
      console.error('send-sms Twilio error', { status: twilioResp.status, err: err.slice(0, 200) });
      return jsonResponse({ error: 'Falha ao enviar SMS.' }, 502, origin);
    }

    const twilioData = await twilioResp.json();
    console.log('send-sms ok', { sid: twilioData.sid, to, userId: auth.userId, patient_id });

    return jsonResponse({ ok: true, sid: twilioData.sid, version: FUNCTION_VERSION }, 200, origin);

  } catch (error) {
    console.error('send-sms erro interno', error instanceof Error ? error.message : String(error));
    return jsonResponse({ error: 'Erro interno.' }, 500, origin);
  }
});
