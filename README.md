# Rhema Care Flow

> Plataforma clinica inteligente — gestao de pacientes, prontuarios, teleconsulta e IA assistiva.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JoaoRG-lab/rhema-care-flow)

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Edge Functions | Supabase Edge Functions (Deno) |
| Deploy | Vercel (frontend) + Supabase Cloud (backend) |
| IA | OpenAI GPT-4o |
| Email | Resend API |
| SMS | Twilio |
| Pagamentos | Stripe |

## Inicio Rapido

```bash
# 1. Clone o repositorio
git clone https://github.com/JoaoRG-lab/rhema-care-flow.git
cd rhema-care-flow

# 2. Instale dependencias
npm install

# 3. Configure variaveis de ambiente
cp .env.example .env.local
# Edite .env.local com seus valores do Supabase, OpenAI, Resend etc.

# 4. Inicie em modo desenvolvimento
npm run dev
```

## Supabase — Setup

```bash
# Instale a CLI do Supabase
npm install -g supabase

# Login
supabase login

# Link com seu projeto
supabase link --project-ref SEU_PROJECT_REF

# Execute as migrations
supabase db push

# Deploy de todas as Edge Functions
supabase functions deploy
```

## Edge Functions Disponíveis

| Funcao | Metodo | Descricao |
|---|---|---|
| `openai-chat` | POST | Chat com GPT-4o (autenticado) |
| `ai-assistant` | POST | Assistente publico (site) |
| `analyze-trends` | POST | Analise de tendencias + insight IA |
| `audit-data-export` | GET/POST | Exportacao de dados (admin) |
| `admin-signout-all-sessions` | POST | Encerrar sessoes (admin) |
| `send-feedback-email` | POST | Envio de feedback por email |
| `schedule-sms` | POST | Agendamento de SMS |
| `process-payment` | POST | Processamento de pagamento |

## Componentes Principais

- `AppShell` — Layout com sidebar + topbar + widgets flutuantes
- `ChatWidget` — Chat de IA flutuante (bottom-right)
- `FeedbackWidget` — Widget de feedback (bottom-left)
- `AIDashboard` — Painel de KPIs com insights de IA
- `useAIAssistant` — Hook React para integracao com chat

## Variaveis de Ambiente

Veja `.env.example` para a lista completa de variaveis necessarias.

## Deploy na Vercel

1. Conecte o repositorio na [Vercel](https://vercel.com/new)
2. Configure as variaveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`)
3. Deploy automatico a cada push na branch `main`

## Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- JWT verificado em todas as Edge Functions
- Rate limiting por usuario + IP
- PII mascarado nos exports de dados
- Headers de segurança configurados no `vercel.json`

## Licença

Proprietario — Rhema Care Flow © 2026
