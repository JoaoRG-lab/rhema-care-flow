# 🚀 Deploy — Instruções de Secrets e Ativação

## Por que o TMR está falhando

O job `preflight` bloqueia o build inteiro se algum destes 5 secrets estiver ausente no repositório:

| Secret | Onde encontrar |
|--------|----------------|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | vercel.com → Settings → General → Team ID (ou Personal Account ID) |
| `VERCEL_PROJECT_ID` | vercel.com → Project → Settings → General → Project ID |
| `VITE_SUPABASE_URL` | supabase.com → Project → Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | supabase.com → Project → Settings → API → anon/public key |

## Como cadastrar os secrets (1 vez)

1. Abra: https://github.com/JoaoRG-lab/rhema-care-flow/settings/secrets/actions
2. Clique em **New repository secret** para cada um dos 5 acima
3. Cole o valor exato (sem espaços)
4. Após cadastrar os 5, vá em **Actions → TMR Deployment Auditor → Run workflow**

## Alternativa: Integração Git Nativa do Vercel (mais simples)

Se preferir não usar o workflow, você pode conectar diretamente:

1. vercel.com → Add New Project → Import Git Repository
2. Selecione `JoaoRG-lab/rhema-care-flow`
3. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. O Vercel detecta Vite automaticamente e faz deploy a cada push

## Workflow de emergência

Se precisar forçar um deploy sem o TMR, use o arquivo `.github/workflows/emergency-deploy.yml`
que foi criado junto deste documento. Ele executa build + deploy direto sem quorum.

**Ative apenas com:** Actions → Emergency Direct Deploy → Run workflow
