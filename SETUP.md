# 🚀 Guia de Deploy — Rhema Care Flow

> Siga **exatamente esta ordem**. Leva ~10 minutos.

---

## Passo 1 — Supabase (banco de dados)

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em **New Project**
3. Dê um nome (ex: `rhema-care`) e escolha uma senha forte
4. Aguarde criar (~2 min)
5. Vá em **Project Settings → API**
6. Copie os dois valores abaixo — você vai precisar deles:

```
Project URL  →  https://xxxxxx.supabase.co
anon public  →  eyJhbGci...
```

7. No menu lateral, clique em **SQL Editor**
8. Cole e execute cada arquivo na ordem:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_schedules.sql`
   - `supabase/migrations/003_rls.sql`
   - `supabase/migrations/004_realtime.sql`
   - `supabase/migrations/005_notifications.sql`

---

## Passo 2 — Vercel (hospedagem)

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em **Add New → Project**
3. Selecione o repositório **rhema-care-flow**
4. Clique em **Environment Variables** e adicione:

| Nome | Valor |
|------|-------|
| `VITE_SUPABASE_URL` | URL copiada no Passo 1 |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon key copiada no Passo 1 |

5. Clique em **Deploy** ✅

O Vercel vai buildar e te dar uma URL tipo:
`https://rhema-care-flow.vercel.app`

---

## Passo 3 — GitHub Secrets (para CI automático)

1. No Vercel, vá em **Account Settings → Tokens → Create Token**
   - Nome: `github-ci`
   - Copie o token gerado

2. No GitHub, vá em:
   **Settings → Secrets and variables → Actions → New repository secret**

   Adicione estes 3 secrets:

| Secret | Valor |
|--------|-------|
| `VERCEL_TOKEN` | Token do passo acima |
| `VITE_SUPABASE_URL` | Mesma URL do Passo 1 |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Mesma anon key do Passo 1 |

3. Pronto! A partir de agora:
   - Todo `git push` na `main` → **deploy automático**
   - Todo Pull Request → **preview com URL comentada automaticamente**

---

## Passo 4 — Testar localmente (opcional)

```bash
git clone https://github.com/JoaoRG-lab/rhema-care-flow
cd rhema-care-flow
npm install

# Crie o arquivo .env.local com:
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_aqui

npm run dev
# Abre em http://localhost:5173
```

---

## Resumo visual

```
Você faz push no GitHub
        │
        ▼
  GitHub Actions
  ├── Lint + TypeScript
  ├── Testes automáticos
  ├── Build de produção
  └── Deploy na Vercel ──► URL pública ao vivo
```

---

## Problemas comuns

| Erro | Solução |
|------|---------|
| Página em branco após deploy | Verifique se as env vars foram adicionadas na Vercel |
| Build falha no CI | Confirme que os 3 GitHub Secrets foram criados |
| Erro 404 ao navegar | Já corrigido no `vercel.json` automaticamente |
| Banco sem tabelas | Execute as migrations SQL no Supabase (Passo 1) |
