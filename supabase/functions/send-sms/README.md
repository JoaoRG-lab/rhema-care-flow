# Edge Function: send-sms

Processa a fila de SMS pendentes em `scheduled_sms` e envia via Twilio.

## Deploy

```bash
supabase functions deploy send-sms
```

## Variaveis de ambiente (Supabase Dashboard > Settings > Edge Functions)

| Variavel | Descricao |
|---|---|
| `TWILIO_ACCOUNT_SID` | SID da conta Twilio |
| `TWILIO_AUTH_TOKEN` | Token de autenticacao Twilio |
| `TWILIO_FROM_NUMBER` | Numero Twilio no formato +55119... |
| `SUPABASE_URL` | URL do projeto (auto-injetada) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (auto-injetada) |

## Cron (pg_cron — executa a cada 5 minutos)

```sql
select cron.schedule(
  'send-pending-sms',
  '*/5 * * * *',
  $$
  select net.http_post(
    url    := current_setting('app.supabase_url') || '/functions/v1/send-sms',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body   := '{}'
  );
  $$
);
```

## Agendar SMS via frontend

```ts
import { supabase } from '@/lib/supabase';

await supabase.from('scheduled_sms').insert({
  patient_id:   'uuid-do-paciente',
  phone_number: '+5511999999999',
  message:      'Lembrete: consulta amanha as 14h na Clinica Rhema. Responda S para confirmar.',
  scheduled_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  status:       'pendente',
});
```
