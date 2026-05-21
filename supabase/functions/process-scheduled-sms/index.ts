import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonResponse } from '../_shared/cors.ts';

const FUNCTION_VERSION = 'rhema-care-v2.0';
const BATCH_SIZE = 50;

serve(async (req) => {
  // Esta funcao e chamada por cron do Supabase, valida header de autorizacao interna
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return jsonResponse({ error: 'Nao autorizado.' }, 401, null);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioFrom = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!twilioSid || !twilioToken || !twilioFrom) {
    console.error('process-scheduled-sms: credenciais Twilio nao configuradas');
    return jsonResponse({ error: 'SMS nao configurado.' }, 503, null);
  }

  const supabase = createClient(supabaseUrl, serviceRole);
  const now = new Date().toISOString();

  // Busca SMS agendados pendentes ate agora (em lote)
  const { data: messages, error } = await supabase
    .from('scheduled_sms')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('process-scheduled-sms query error', error.message);
    return jsonResponse({ error: 'Erro ao buscar SMS agendados.' }, 500, null);
  }

  if (!messages || messages.length === 0) {
    return jsonResponse({ ok: true, processed: 0, version: FUNCTION_VERSION }, 200, null);
  }

  let sent = 0;
  let failed = 0;

  for (const msg of messages) {
    try {
      // Marca como 'sending' para evitar reprocessamento concorrente
      await supabase
        .from('scheduled_sms')
        .update({ status: 'sending', updated_at: new Date().toISOString() })
        .eq('id', msg.id)
        .eq('status', 'pending');

      const formData = new URLSearchParams();
      formData.append('To', msg.phone_number);
      formData.append('From', twilioFrom);
      formData.append('Body', String(msg.message).slice(0, 160));

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

      if (twilioResp.ok) {
        const td = await twilioResp.json();
        await supabase
          .from('scheduled_sms')
          .update({
            status: 'sent',
            twilio_sid: td.sid,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', msg.id);
        sent++;
      } else {
        const err = await twilioResp.text();
        console.error('process-scheduled-sms Twilio error', { msgId: msg.id, err: err.slice(0, 200) });
        await supabase
          .from('scheduled_sms')
          .update({
            status: 'failed',
            error_message: err.slice(0, 500),
            updated_at: new Date().toISOString(),
          })
          .eq('id', msg.id);
        failed++;
      }
    } catch (e) {
      console.error('process-scheduled-sms item error', { msgId: msg.id, error: e instanceof Error ? e.message : String(e) });
      await supabase
        .from('scheduled_sms')
        .update({ status: 'failed', error_message: String(e).slice(0, 500), updated_at: new Date().toISOString() })
        .eq('id', msg.id);
      failed++;
    }
  }

  console.log('process-scheduled-sms concluido', { sent, failed, total: messages.length });

  return jsonResponse({
    ok: true,
    processed: messages.length,
    sent,
    failed,
    version: FUNCTION_VERSION,
  }, 200, null);
});
