# Rhema Care Flow

> Sistema de gestão em saúde — prontuários eletrônicos, scores clínicos, teleconsulta WebRTC e notificações em tempo real.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel&logoColor=white)](https://vercel.com/)
[![PWA](https://img.shields.io/badge/PWA-ready-5a0fc8)](https://web.dev/progressive-web-apps/)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript + Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Deploy | Vercel (CI/CD automático via GitHub) |
| CDN / DNS | Cloudflare |
| SMS | Twilio via Supabase Edge Functions |
| PDF | jsPDF (client-side) |
| PWA | vite-plugin-pwa + Workbox |
| Video | WebRTC nativo + sinalização via Supabase Realtime |

---

## Pré-requisitos

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Conta Vercel (deploy)
- Conta Cloudflare (DNS)
- Conta Twilio (SMS — opcional)

---

## Setup local

```bash
# 1. Clone
git clone https://github.com/JoaoRG-lab/rhema-care-flow.git
cd rhema-care-flow

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais Supabase

# 4. Execute as migrations
supabase db push

# 5. Start dev server
npm run dev
```

---

## Variáveis de ambiente

Crie `.env.local` na raiz com:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...

# Twilio (Edge Function send-sms)
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_FROM_NUMBER=+1555xxxxxxx
```

No painel da Vercel, adicione as mesmas variáveis em **Settings → Environment Variables**.

---

## Migrations Supabase

Executar em ordem:

```bash
# Esquema principal
supabase db push --file supabase/migrations/20260520_initial_schema.sql

# RLS policies
supabase db push --file supabase/migrations/20260520_rls_policies.sql

# Storage bucket
supabase db push --file supabase/migrations/20260520_storage_bucket.sql

# Tabela de notificações
supabase db push --file supabase/migrations/20260520_notifications_table.sql
```

Ou tudo de uma vez:
```bash
supabase db push
```

---

## Deploy Edge Function SMS

```bash
supabase functions deploy send-sms
```

Agendamento automático (pg_cron — rode no SQL Editor do Supabase):
```sql
select cron.schedule(
  'send-sms-job',
  '*/5 * * * *',
  $$select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/send-sms',
    headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
  )$$
);
```

---

## Deploy Vercel

```bash
# Via CLI
vercel deploy --prod

# Ou conecte o repositório no painel Vercel:
# vercel.com/new → Import Git Repository → JoaoRG-lab/rhema-care-flow
```

Configurações recomendadas no Vercel:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node.js Version**: 20.x

---

## Cloudflare DNS

1. Adicione o domínio no Cloudflare
2. Aponte os nameservers para Cloudflare
3. Adicione CNAME `@` → `cname.vercel-dns.com` (proxied ☁️)
4. Ative **Always Use HTTPS** e **HTTP/3**
5. Regra de cache: `Cache Level: Standard` para `/assets/*`

---

## Estrutura do projeto

```
src/
├── components/
│   ├── layout/       # AppShell, sidebar
│   ├── ui/           # ToastContainer, botões, inputs
│   ├── notifications/ # NotificationsPanel (Realtime)
│   └── storage/      # FileUpload (drag & drop)
├── contexts/         # AuthContext
├── hooks/            # usePatients, useProntuario, useVisits,
│                     # useScores, useAuditLog, useToast, useWebRTC
├── lib/              # supabase.ts (cliente)
├── pages/            # Todas as páginas (lazy-loaded)
├── services/         # SignalingService (WebRTC P2P)
├── router.tsx        # BrowserRouter + guards de role
└── main.tsx          # Entrada

supabase/
├── functions/send-sms/   # Edge Function Twilio
└── migrations/           # SQL em ordem cronológica
```

---

## Roles e permissões

| Role | Dashboard | Pacientes | Prontuário | Scores | Teleconsulta | Relatórios | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `admin`      | ✅ | ✅ CRUD | ✅ | ✅ | ✅ | ✅ | ✅ |
| `medico`     | ✅ | ✅ CRUD | ✅ | ✅ | ✅ | ✅ | — |
| `enfermeiro` | ✅ | ✅ lê/edita | ✅ | ✅ | ✅ | ✅ | — |
| `recepcao`   | ✅ | ✅ cria/edita | — | — | — | — | — |
| `paciente`   | — | 👁 próprio | — | — | ✅ | — | — |

---

## Licença

Proprietário — © 2026 Rhema Care Flow. Todos os direitos reservados.
