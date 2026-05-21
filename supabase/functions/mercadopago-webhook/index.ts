import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

const FUNCTION_VERSION = 'rhema-care-v2.0';

function parseSignatureHeader(header: string): Record<string, string> {
  return Object.fromEntries(
    header.split(',').map((part) => {
      const [key, ...rest] = part.trim().split('=');
      return [key, rest.join('=')];
    })
  );
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

async function verifySignature(req: Request, dataId: string): Promise<boolean> {
  const secret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');
  if (!secret) { console.error('MERCADOPAGO_WEBHOOK_SECRET nao configurado'); return false; }
  const xSig = req.headers.get('x-signature');
  const xReqId = req.headers.get('x-request-id');
  if (!xSig || !xReqId) return false;
  const { ts, v1 } = parseSignatureHeader(xSig);
  if (!ts || !v1) return false;
  const manifest = `id:${dataId};request-id:${xReqId};ts:${ts};`;
  const expected = await hmacSha256Hex(secret, manifest);
  return timingSafeEqual(expected, v1);
}

serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo nao permitido.' }), {
      status: 405,
      headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }

  try {
    const mpToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!mpToken) throw new Error('MERCADOPAGO_ACCESS_TOKEN nao configurado');

    const supabase = createClient(supabaseUrl, serviceRole);
    const url = new URL(req.url);

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* body vazio */ }

    const paymentId = String(
      body?.data?.id ||
      String(body?.resource ?? '').split('/').pop() ||
      url.searchParams.get('id') ||
      url.searchParams.get('data.id') ||
      ''
    ).trim();

    const topic = String(body?.type || body?.topic || url.searchParams.get('topic') || 'payment');

    if (!paymentId || (topic && topic !== 'payment')) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // Verificacao de assinatura HMAC
    const validSig = await verifySignature(req, paymentId);
    if (!validSig) {
      console.warn('mercadopago-webhook: assinatura invalida', { paymentId });
      return new Response(JSON.stringify({ error: 'Assinatura invalida.' }), {
        status: 401,
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // Busca detalhes do pagamento na API do MP
    const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${mpToken}` },
    });
    const payment = await mpResp.json();

    if (!mpResp.ok) {
      console.error('mercadopago-webhook MP fetch error', { status: mpResp.status });
      return new Response(JSON.stringify({ ok: true, error: 'MP fetch failed' }), {
        status: 200,
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const externalId = String(payment.id);
    const status = String(payment.status);

    // Audit log
    await supabase.from('payment_audit_log').insert({
      external_id: externalId,
      status,
      raw_payload: payment,
      received_at: new Date().toISOString(),
    }).then(({ error }) => { if (error) console.warn('audit log error', error.message); });

    // Busca transacao local
    const { data: tx, error: txError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('external_id', externalId)
      .maybeSingle();

    if (txError) console.error('mercadopago-webhook tx lookup error', txError.message);

    if (!tx) {
      console.warn('mercadopago-webhook: transacao nao encontrada', { externalId });
      return new Response(JSON.stringify({ ok: true, notFound: true }), {
        status: 200,
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    // Idempotencia: creditar apenas uma vez
    if (status === 'approved' && tx.status !== 'paid') {
      const { data: creditRow } = await supabase
        .from('user_ai_credits')
        .select('*')
        .eq('user_id', tx.user_id)
        .maybeSingle();

      if (creditRow) {
        await supabase
          .from('user_ai_credits')
          .update({ credits_balance: creditRow.credits_balance + tx.credits_amount, updated_at: new Date().toISOString() })
          .eq('user_id', tx.user_id);
      } else {
        await supabase.from('user_ai_credits').insert({
          user_id: tx.user_id,
          credits_balance: tx.credits_amount,
        });
      }

      await supabase
        .from('payment_transactions')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', tx.id);

      console.log('mercadopago-webhook: pagamento aprovado e creditos aplicados', {
        externalId, userId: tx.user_id, credits: tx.credits_amount,
      });
    } else if (status === 'rejected' || status === 'cancelled') {
      await supabase
        .from('payment_transactions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', tx.id);
    }

    return new Response(JSON.stringify({ ok: true, status, version: FUNCTION_VERSION }), {
      status: 200,
      headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('mercadopago-webhook erro interno', error instanceof Error ? error.message : String(error));
    // Retorna 200 para evitar reprocessamento infinito pelo MP
    return new Response(JSON.stringify({ ok: false, error: 'Erro interno.' }), {
      status: 200,
      headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
    });
  }
});
