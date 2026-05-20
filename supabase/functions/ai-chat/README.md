# Edge Function: ai-chat

Assistente clínico baseado em GPT-4o integrado ao Supabase.

## Deploy

```bash
supabase functions deploy ai-chat --no-verify-jwt
```

## Secrets necessários

```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

## Uso (frontend)

```typescript
const { data, error } = await supabase.functions.invoke('ai-chat', {
  body: {
    message: 'Analise o DAS28 deste paciente: 4.2',
    context: 'Paciente com AR há 5 anos, em uso de MTX',
    patient_id: 'uuid-do-paciente', // opcional
    session_id: 'uuid-da-sessao',   // opcional, para continuar conversa
  },
})

// Resposta:
// data.message    — resposta do GPT-4o
// data.session_id — ID para continuar a conversa
// data.tokens_used — tokens consumidos
```

## Segurança

- JWT obrigatório (autenticação Supabase)
- RLS ativo: usuário só acessa suas próprias conversas
- OPENAI_API_KEY nunca exposta no frontend
- Rate limiting via Supabase
