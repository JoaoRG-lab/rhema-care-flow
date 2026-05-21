# Edge Function: ai-assistant

Assistente público do UHS Health OS / Protocolo Vida para o widget do site.

## Objetivo

Responder visitantes do site com informações institucionais, educativas e seguras sobre o UHS Health OS, sem coletar dados sensíveis e sem oferecer orientação médica individualizada.

## Segurança e limites

- Função pública: `verify_jwt = false`, pois o widget é aberto.
- Chave da Perplexity deve existir apenas como secret no Supabase.
- Nunca usar `PERPLEXITY_API_KEY` no frontend ou com prefixo `VITE_`.
- Não solicitar CPF, telefone, endereço, convênio ou dados identificáveis.
- Não diagnosticar, prescrever ou ajustar tratamento.

## Secrets

```bash
supabase secrets set PERPLEXITY_API_KEY=...
```

Opcional:

```bash
supabase secrets set PERPLEXITY_MODEL=sonar-pro
```

## Deploy

```bash
supabase functions deploy ai-assistant --no-verify-jwt
```

## Healthcheck

```bash
curl https://rfsaxstpfpigrjyiochi.supabase.co/functions/v1/ai-assistant
```

Resposta esperada:

```json
{
  "ok": true,
  "function": "ai-assistant",
  "version": "site-agent-hardening-v1"
}
```

## Payload do frontend

```ts
await supabase.functions.invoke('ai-assistant', {
  body: {
    message: text,
    history: messages.slice(-8),
    context: 'public_site',
  },
});
```
