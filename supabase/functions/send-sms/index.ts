import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TWILIO_SID   = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_FROM  = Deno.env.get('TWILIO_FROM_NUMBER')!;

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function sendTwilio(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const params = new URLSearchParams({ To: to, From: TWILIO_FROM, Body: body });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, error: err?.message ?? `HTTP ${res.status}` };
  }
  return { ok: true };
}

serve(async (req) => {
  // Valida metodo
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // Valida JWT interno (chamada via Supabase Cron ou direto)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const now = new Date().toISOString();

    // Busca SMSes pendentes agendados para ate agora
    const { data: messages, error: fetchErr } = await supabaseAdmin
      .from('scheduled_sms')
      .select('*')
      .eq('status', 'pendente')
      .lte('scheduled_at', now)
      .limit(50);

    if (fetchErr) throw fetchErr;
    if (!messages?.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'Nenhum SMS pendente.' }), { status: 200 });
    }

    let sent = 0;
    let failed = 0;

    for (const sms of messages) {
      const { ok, error: smsErr } = await sendTwilio(sms.phone_number, sms.message);

      await supabaseAdmin
        .from('scheduled_sms')
        .update({
          status:        ok ? 'sent' : 'failed',
          sent_at:       ok ? new Date().toISOString() : null,
          error_message: ok ? null : smsErr,
        })
        .eq('id', sms.id);

      // Audit
      await supabaseAdmin.from('audit_logs').insert({
        user_id:       null,
        action:        ok ? 'sms_sent' : 'sms_failed',
        resource_type: 'scheduled_sms',
        resource_id:   sms.id,
        metadata:      { phone: sms.phone_number, error: smsErr ?? null },
      });

      ok ? sent++ : failed++;
    }

    return new Response(
      JSON.stringify({ sent, failed, total: messages.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('[send-sms]', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Erro interno' }),
      { status: 500 },
    );
  }
});
