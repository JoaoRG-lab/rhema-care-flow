# Rhema Care Flow

Sistema clinico moderno para gestao de pacientes com reumatologia: prontuario eletronico, scores clinicos (DAS28, SDAI, Wells, BASFI), teleconsulta WebRTC, upload de exames e relatorios PDF.

---

## Stack

| Camada    | Tecnologia                  |
|-----------|-----------------------------|
| Frontend  | React 19 + TypeScript + Vite |
| Estilo    | Tailwind CSS v3             |
| Backend   | Supabase (Postgres + Auth + Storage + Realtime) |
| Deploy #1 | **Cloudflare Pages** (primario) |
| Deploy #2 | Netlify (secundario)        |
| CI/CD     | GitHub Actions              |

---

## Setup Local

```bash
# 1. Clone
git clone https://github.com/JoaoRG-lab/rhema-care-flow.git
cd rhema-care-flow

# 2. Instale dependencias
npm install

# 3. Configure ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais Supabase

# 4. Suba as migrations
npx supabase db push

# 5. Rode localmente
npm run dev
```

---

## Variaveis de Ambiente

| Variavel                   | Onde encontrar                                    |
|----------------------------|---------------------------------------------------|
| `VITE_SUPABASE_URL`        | Supabase > Settings > API > Project URL           |
| `VITE_SUPABASE_ANON_KEY`   | Supabase > Settings > API > anon public key       |
| `TWILIO_ACCOUNT_SID`       | console.twilio.com (secret no Supabase)           |
| `TWILIO_AUTH_TOKEN`        | console.twilio.com (secret no Supabase)           |
| `TWILIO_FROM_NUMBER`       | Numero Twilio no formato +15550000000             |

---

## Deploy

### Primario — Cloudflare Pages

```bash
# Setup unico (primeira vez)
npx wrangler login
npx wrangler pages project create rhema-care-flow

# Deploy manual
npm run build
npx wrangler pages deploy dist --project-name=rhema-care-flow
```

Ou conecte o repo direto no [Cloudflare Dashboard](https://dash.cloudflare.com) > Pages > Connect to Git.

**Variaveis de ambiente no Cloudflare:**
Dashboard > Pages > rhema-care-flow > Settings > Environment variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**GitHub Secrets para CI automatico:**
- `CF_API_TOKEN` — token com permissao `Pages:Edit`
- `CF_ACCOUNT_ID` — seu Account ID

### Secundario — Netlify

1. [app.netlify.com](https://app.netlify.com) > Add new site > Import from GitHub
2. Selecione `JoaoRG-lab/rhema-care-flow`
3. Build: `npm run build` | Publish: `dist`
4. Adicione as variaveis de ambiente

**GitHub Secrets para CI automatico:**
- `NETLIFY_AUTH_TOKEN` — User settings > Applications > New access token
- `NETLIFY_SITE_ID` — Site settings > Site ID

---

## Arquitetura de Banco (Supabase)

```
profiles        — dados do usuario + role
patients        — cadastro de pacientes
visits          — historico de consultas
prontuario      — registro clinico detalhado
scores          — DAS28, SDAI, Wells, BASFI
exams           — metadados de exames
audit_logs      — LGPD compliance
notifications   — alertas em tempo real
```

### Roles e Permissoes RLS

| Role       | Pacientes | Prontuario | Scores | Admin |
|------------|-----------|------------|--------|-------|
| admin      | CRUD      | CRUD       | CRUD   | sim   |
| medico     | CRUD      | CRUD       | CRUD   | nao   |
| enfermeiro | leitura   | leitura    | leitura| nao   |

---

## Estrutura do Projeto

```
src/
├── main.tsx
├── router.tsx
├── index.css
├── lib/supabase.ts
├── contexts/AuthContext.tsx
├── hooks/               (useToast, useAuditLog, usePatients...)
├── services/            (SignalingService WebRTC)
├── components/
│   ├── layout/AppShell.tsx
│   ├── ui/ToastContainer.tsx
│   ├── notifications/
│   └── storage/
└── pages/
    ├── LoginPage.tsx
    ├── DashboardPage.tsx
    ├── PatientsPage.tsx
    ├── PatientDetailPage.tsx
    ├── ProntuarioPage.tsx
    ├── ScorePage.tsx
    ├── TeleconsultaPage.tsx
    ├── ReportsPage.tsx
    ├── SettingsPage.tsx
    └── AdminPage.tsx

supabase/
├── migrations/
└── functions/send-sms/

# Arquivos de deploy
wrangler.toml      — Cloudflare Pages
netlify.toml       — Netlify
_redirects         — SPA fallback (ambos)
_headers           — Security headers Cloudflare
.github/workflows/ — CI/CD GitHub Actions
```

---

## CI/CD — GitHub Actions

Cada push na `main` dispara automaticamente:

1. TypeScript check + ESLint
2. Vite build
3. Salva `dist/` como artefato (30 dias de backup)
4. Deploy no **Cloudflare Pages** (primario)
5. Deploy no **Netlify** (secundario)

---

*Rhema Care Flow v1.0 — Desenvolvido com React 19 + Supabase + Cloudflare*
