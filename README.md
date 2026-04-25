<div align="center">

<img src="https://jiswutjmmoirkoarpbpf.supabase.co/storage/v1/object/public/avatars/rhema-logo.png" alt="Rhema Care Flow" width="120" onerror="this.style.display='none'"/>

# Rhema Care Flow

**Plataforma clínica open source para reumatologia e especialidades médicas**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-backend-3ECF8E?logo=supabase)](https://supabase.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[🌐 Ver Demo ao Vivo](https://www.perplexity.ai/computer/a/rhema-care-flow-vmTlYyliQR6c6F0hVko4EA) · [🐛 Reportar Bug](https://github.com/JoaoRG-lab/rhema-care-flow/issues) · [💡 Sugerir Feature](https://github.com/JoaoRG-lab/rhema-care-flow/issues/new?template=feature_request.md) · [🤝 Contribuir](CONTRIBUTING.md)

</div>

---

## 🩺 O que é o Rhema Care Flow?

Rhema Care Flow é uma plataforma web clínica de código aberto focada em **reumatologia**, com suporte a múltiplas especialidades médicas. Desenvolvida por médicos, para médicos — priorizando privacidade de dados, segurança e usabilidade em ambiente clínico real.

### Funcionalidades principais

| Módulo | Descrição |
|--------|-----------|
| 📋 **Prontuário Integrado** | Acesso seguro por código do paciente (sem expor dados sensíveis) |
| 📹 **Teleconsulta** | Videoconsulta integrada via Daily.co com prescrição Memed |
| 📊 **Scores Clínicos** | DAS28, CDAI, SDAI, SLEDAI, HAQ e 15+ calculadoras |
| 💊 **Monitorização** | Planos de monitoramento por medicamento (DMARDs, biológicos) |
| 🏥 **Multi-especialidade** | Reumatologia, Pediatria, Ginecologia, Neurologia e mais 10+ |
| 🔗 **Blockchain (URV)** | Integridade de dados via Solana — nenhum PHI on-chain |
| 📚 **Biblioteca Clínica** | Conteúdo educacional com versionamento |
| 🤖 **Assistente IA** | Chat clínico contextualizado por especialidade |

---

## 🚀 Começar em 3 passos

```bash
# 1. Clone o repositório
git clone https://github.com/JoaoRG-lab/rhema-care-flow.git
cd rhema-care-flow

# 2. Instale as dependências
npm install

# 3. Configure o ambiente e inicie
cp .env.example .env   # preencha com suas chaves Supabase
npm run dev
```

> A aplicação roda em `http://localhost:5173`

### Variáveis de ambiente necessárias

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-anon-key
VITE_DAILY_CO_API_KEY=opcional-para-teleconsulta
```

---

## 🛠️ Stack Tecnológica

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** shadcn/ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- **Video:** Daily.co
- **Prescrição:** Memed SDK
- **Blockchain:** Solana/Anchor (Devnet)
- **Deploy:** Qualquer host estático (Vercel, Netlify, S3)

---

## 🤝 Contribuir — precisamos de você!

Este projeto é mantido por um médico e está crescendo rapidamente. **Se você é desenvolvedor e quer impactar a saúde de verdade**, sua contribuição faz diferença direta no cuidado de pacientes.

### Áreas com mais necessidade de ajuda

- 🔴 **Performance** — chunks grandes (>500kb), lazy loading, otimização de bundle
- 🔴 **Testes** — zero cobertura de testes (Vitest/Testing Library)
- 🟡 **Mobile** — paridade total web/mobile ainda incompleta
- 🟡 **Acessibilidade** — WCAG 2.1 AA para ambiente clínico
- 🟡 **i18n** — PT-BR completo; EN-US em progresso
- 🟢 **Novos scores clínicos** — BASDAI, PASI, ACR/EULAR
- 🟢 **Documentação** — JSDoc, Storybook, guias de uso

### Como contribuir

1. Leia o [CONTRIBUTING.md](CONTRIBUTING.md)
2. Veja as [issues abertas](https://github.com/JoaoRG-lab/rhema-care-flow/issues) — filtre por `good first issue`
3. Fork → branch → PR para `main`

> ⭐ Se o projeto te interessa, deixa uma estrela — ajuda muito na visibilidade!

---

## 🗄️ Banco de Dados (Supabase)

Execute as migrations em ordem:

```bash
# Via Supabase CLI
supabase db push

# Ou manualmente via painel SQL do Supabase
# Arquivos em: supabase/migrations/ (ordem cronológica)
```

### Privacidade e RLS

**Todos os dados clínicos têm Row Level Security ativado.** Cada médico acessa apenas seus próprios pacientes. O prontuário integrado expõe evoluções anonimizadas (só iniciais + especialidade) mediante código do paciente.

---

## 🔗 Blockchain — URV Health Value Chain

Registro de integridade de dados em Solana Devnet. **Nenhum dado de paciente vai on-chain** — apenas hashes SHA-256.

```bash
cd anchor
anchor build && anchor deploy
```

---

## 📄 Licença

MIT © [JoaoRG-lab](https://github.com/JoaoRG-lab) — use, modifique e distribua livremente.

---

<div align="center">

**Construído com ❤️ para médicos, por médicos.**

[⭐ Deixar uma estrela](https://github.com/JoaoRG-lab/rhema-care-flow) · [🐛 Abrir issue](https://github.com/JoaoRG-lab/rhema-care-flow/issues) · [🤝 CONTRIBUTING.md](CONTRIBUTING.md)

</div>
