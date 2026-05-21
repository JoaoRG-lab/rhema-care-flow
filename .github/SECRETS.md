# GitHub Secrets necessários

Vá em **Settings → Secrets and variables → Actions** e adicione:

## Vercel

| Secret | Como obter |
|--------|------------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_ORG_ID` | `vercel env pull` ou painel Vercel → Settings → General |
| `VERCEL_PROJECT_ID` | Painel Vercel → seu projeto → Settings → General |

## Supabase (para build/testes no CI)

| Secret | Onde encontrar |
|--------|----------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Project Settings → API → anon public key |

## Linkar projeto no Vercel (uma vez, localmente)

```bash
npm i -g vercel
vercel login
vercel link   # dentro da pasta do projeto
# Isso cria .vercel/project.json com org_id e project_id
```

Depois copie os IDs para os secrets acima.
