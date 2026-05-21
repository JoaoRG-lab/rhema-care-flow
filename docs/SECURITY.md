# Segurança — Rhema Care Flow

## Cabeçalhos HTTP

Todos configurados via `vercel.json`:

| Header | Valor | Propósito |
|---|---|---|
| `Content-Security-Policy` | restricts sources | Bloqueia XSS e injeção de scripts |
| `X-Frame-Options` | `DENY` | Impede clickjacking via iframe |
| `X-Content-Type-Options` | `nosniff` | Impede MIME sniffing |
| `Strict-Transport-Security` | 2 anos + preload | Força HTTPS |
| `Referrer-Policy` | strict-origin | Oculta URL em cross-origin |
| `Permissions-Policy` | bloqueia câmera/mic/geo | Princípio do menor privilégio |

## Autenticação

- Gerenciada pelo **Supabase Auth** (JWT RS256)
- `AuthContext.tsx` — provider central com `session`, `user`, `profile`, `role`
- Row-Level Security (RLS) deve estar habilitado em **todas** as tabelas do Supabase
- Tokens não são armazenados manualmente — Supabase gerencia via `httpOnly` cookie ou `localStorage` com `PKCE`

## IA Interna (Hugging Face)

- Token `VITE_HF_TOKEN` configurado como variável de ambiente no Vercel (nunca no código)
- Modelo: `HuggingFaceH4/zephyr-7b-beta` por padrão (substituível via `VITE_HF_MODEL`)
- Chamadas feitas do **cliente** com o token exposto apenas em runtime — para produção com dados sensíveis, migrar para Supabase Edge Function como proxy

## CI/CD

- GitHub Actions roda `tsc --noEmit` + `vite build` + `npm audit` em todo PR
- Secrets do GitHub: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_HF_TOKEN`

## Vulnerabilidades Conhecidas

Rodar periodicamente:
```bash
npm audit fix
```

Relatório atual: 14 vulnerabilidades (7 moderate, 7 high) — monitorar via CI.

## Contato

Reportar vulnerabilidades: security@gruporghealthcare.com
