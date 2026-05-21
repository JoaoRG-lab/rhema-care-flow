import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { getCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import { verifyJWT } from '../_shared/auth.ts';
import { checkRateLimit, getClientIp } from '../_shared/rateLimit.ts';

const FUNCTION_VERSION = 'rhema-care-v2.0';
const MP_API = 'https://api.mercadopago.com/v1/payments';

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

  if (!checkRateLimit(`pix:${auth.userId}:${ip}`, 10, 60_000)) {
    return jsonResponse({ error: 'Muitas tentativas de pagamento. Aguarde.' }, 429, origin);
  }

  try {
    const { amount, description, payer_email, external_reference } = await req.json();

    if (!amount || !payer_email) {
      return jsonResponse({ error: 'Campos obrigatórios: amount, payer_email.' }, 400, origin);
    }

    if (typeof amount !== 'number' || amount <= 0 || amount > 50000) {
      return jsonResponse({ error: 'Valor inválido. Máximo R$ 50.000.' }, 400, origin);
    }

    const mpToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!mpToken) {
      console.error('create-mercadopago-pix: MERCADOPAGO_ACCESS_TOKEN não configurado');
      return jsonResponse({ error: 'Serviço de pagamento não configurado.' }, 503, origin);
    }

    const idempotencyKey = `rhema-${auth.userId}-${Date.now()}`;

    const mpResp = await fetch(MP_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: String(description ?? 'Rhema Care Flow').slice(0, 100),
        payment_method_id: 'pix',
        payer: { email: payer_email },
        external_reference: String(external_reference ?? auth.userId).slice(0, 64),
        notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      }),
    });

    if (!mpResp.ok) {
      const err = await mpResp.text();
      console.error('create-mercadopago-pix MP error', { status: mpResp.status, err: err.slice(0, 300) });
      return jsonResponse({ error: 'Falha ao criar pagamento PIX.' }, 502, origin);
    }

    const mpData = await mpResp.json();
    const qrCode = mpData?.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = mpData?.point_of_interaction?.transaction_data?.qr_code_base64;

    console.log('create-mercadopago-pix ok', {
      paymentId: mpData.id,
      status: mpData.status,
      userId: auth.userId,
    });

    return jsonResponse({
      ok: true,
      payment_id: mpData.id,
      status: mpData.status,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      version: FUNCTION_VERSION,
    }, 200, origin);

  } catch (error) {
    console.error('create-mercadopago-pix erro interno', error instanceof Error ? error.message : String(error));
    return jsonResponse({ error: 'Erro interno.' }, 500, origin);
  }
});
