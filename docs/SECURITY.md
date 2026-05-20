# Política de Segurança — Rhema Care Flow

## Credenciais expostas — Ação imediata

Se você suspeita que credenciais foram expostas no repositório:

1. **GitHub PAT**: https://github.com/settings/tokens → Revogar todos → Gerar novo
2. **Supabase keys**: Dashboard → Settings → API → Rotate `anon` e `service_role`
3. **OpenAI key**: https://platform.openai.com/api-keys → Revogar → Gerar nova

## Regras de segurança

- NUNCA commitar `.env`, `.env.local` ou qualquer arquivo com credenciais
- Variáveis de ambiente do frontend: apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
- Chaves secretas (OpenAI, Resend, Mercado Pago, SumSub): apenas via `supabase secrets set`
- Edge Functions usam `Deno.env.get()` — nunca recebem keys pelo frontend

## Acesso ao repositório

- Apenas `JoaoRG-lab` deve ter acesso de escrita ao branch `main`
- Revogar acesso de: `joaooz123-png` se ainda estiver como colaborador
- Revisar GitHub Apps instalados: https://github.com/settings/installations

## Verificação periódica

Use `git log --author=joaooz123-png` para auditar commits externos.
