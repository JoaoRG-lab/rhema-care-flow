# 🚀 Guia de Deploy — Rhema Care Flow

> Siga **exatamente esta ordem**. Leva ~10 minutos.

---

## ⚠️ ATENÇÃO: Workspace Vercel correto

Existem **dois workspaces** Vercel associados à conta. Use SOMENTE:

```
Workspace CORRETO:  joaorg-lab's projects
Projeto:            rhema-care-flow
Domínio:           https://www.reumatismos.com
```

❌ **NÃO use** o workspace `João's projects` (slug: `joao-s-projects13`) — esse é o workspace errado.

---

## Passo 1 — Supabase (banco de dados)

**Projeto já existe:** `rfsaxstpfpigrjyiochi` — não criar outro!

1. Acesse [supabase.com](https://supabase.com) → projeto `Rhema-care-flow`
2. Vá em **Project Settings → API** e copie:
   - **Project URL:** `https://rfsaxstpfpigrjyiochi.supabase.co`
   - **anon public key:** `eyJhbGci...`

---

## Passo 2 — Vercel: Environment Variables

1. Acesse [vercel.com](https://vercel.com) → workspace **joaorg-lab's projects**
2. Abra o projeto **rhema-care-flow**
3. Vá em **Settings → Environment Variables**
4. Adicione/confirme as 3 variáveis abaixo, marcando **Production + Preview + Development**:

| Variável | Valor | Nota |
|----------|-------|------|
| `VITE_SUPABASE_URL` | `https://rfsaxstpfpigrjyiochi.supabase.co` | — |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `<anon public key>` | — |
| `PERPLEXITY_API_KEY` | `<valor da GPTESTE>` | `aquigpt` |

5. Clique **Save** em cada uma

---

## Passo 3 — Vercel: Corrigir "Ignored Build Step"

Este é o motivo do erro `Skipped/Ignored`:

1. Vá em **Settings → Git**
2. Encontre **Ignored Build Step**
3. Se houver qualquer regra (ex: `exit 0` ou script personalizado), **apague**
4. Deixe o campo **vazio** (o `vercel.json` já gerencia isso com `"ignoreCommand": "exit 1"`)
5. Confirme que **Production Branch = `main`**

---

## Passo 4 — Vercel: Redeploy

1. Vá em **Deployments**
2. No último deploy, clique nos **3 pontos (...)**
3. Clique em **Redeploy**
4. Marque **Use existing Build Cache: NO** (redeploy limpo)
5. Aguarde — o build deve completar sem `Ignored`

---

## Passo 5 — GitHub Secrets (para CI automático)

Vá em **GitHub → Settings → Secrets → Actions** e adicione:

| Secret | Valor |
|--------|-------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create |
| `VITE_SUPABASE_URL` | `https://rfsaxstpfpigrjyiochi.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon key do Supabase |
| `PERPLEXITY_API_KEY` | valor da GPTESTE |

---

## Resumo do Fluxo

```
git push main
    │
    ▼
GitHub Actions
 ├── Lint + TypeScript
 ├── Build de produção
 └── Deploy → Vercel ──► https://www.reumatismos.com
```

---

## Problemas Conhecidos

| Erro | Causa | Solução |
|------|-------|---------|
| `Skipped/Ignored` | `Ignored Build Step` com regra bloqueando | Apagar regra em Settings → Git |
| `Skipped/Ignored` | Workspace errado (`joao-s-projects13`) | Usar workspace `joaorg-lab's projects` |
| Página em branco | Env vars ausentes na Vercel | Adicionar as 3 vars e fazer redeploy |
| Erro 404 ao navegar | SPA sem rewrite | Já corrigido no `vercel.json` |
| Build falha no CI | Secrets do GitHub ausentes | Adicionar os 4 secrets acima |
