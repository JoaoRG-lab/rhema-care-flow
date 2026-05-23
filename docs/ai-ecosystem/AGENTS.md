# AGENTS.md — Ecossistema Multi-IA Rhema Care Flow

> Versão 2.0 · Atualizado 2026-05-23

## Agentes Ativos

| Agente | Papel | Contexto API | Status |
|--------|-------|-------------|--------|
| **Perplexity** | Supervisor TMR + Monitor GitHub | `supervisor_tmr` | 🟢 Ativo |
| **Codex** | Engenheiro de Código Autônomo | `engenheiro_codigo` | 🟢 Ativo |
| **ChatGPT** | Agente Vercel + Edge Functions | `agente_vercel` | 🟢 Ativo |
| **Grok** | Auditor de Segurança | `auditor_seguranca` | 🟢 Ativo |
| **Gemini** | Analista Clínico Multimodal | `analista_clinico` | 🟢 Ativo |

## Rota do Painel

```
/ai-panel  →  AIIntegrationPage.tsx  →  AIIntegrationPanel.tsx
```

Acesso: login obrigatório (PrivateRoute). Lazy-loaded.

## Arquitetura de Comunicação

```
Frontend (AIIntegrationPanel)
    │
    ├── POST /functions/v1/ai-assistant
    │       ├── body: { message, context, agent }
    │       └── header: Authorization: Bearer VITE_SUPABASE_PUBLISHABLE_KEY
    │
    └── Supabase Edge Function ai-assistant
            ├── context: supervisor_tmr    → Perplexity API
            ├── context: engenheiro_codigo → Perplexity API (modo código)
            ├── context: agente_vercel     → Perplexity API (modo deploy)
            ├── context: auditor_seguranca → Perplexity API (modo segurança)
            └── context: analista_clinico  → Google Gemini API
```

## Modo Broadcast

Quando ativado, a mesma mensagem é enviada para todos os 5 agentes em paralelo (`Promise.all`).
Útil para coordenação cross-agente e levantamento de perspectivas múltiplas.

## Protocolo TMR (Byzantine Fault Tolerance)

- ❌ Não reativar `deploy.yml` ou `ci.yml`
- ❌ Não criar workflow paralelo ao TMR
- ❌ Não alterar `src/lib/medical*.ts`, `clinicalScores.ts`, `healthCycleEngine.ts`
- ✅ Commits atômicos: `fix(scope): descrição` ou `feat(scope): descrição`
- ✅ Comentar no Issue de coordenação ao concluir cada fase
- ✅ Verificar que o TMR passou antes de reportar sucesso

## Gemini — Configuração necessária

Para ativar o Gemini como analista clínico multimodal:

```bash
# Supabase Edge Functions → Secrets
GEMINI_API_KEY=<Google AI Studio API Key>

# Vercel → Environment Variables
VITE_GEMINI_ENABLED=true
```

A Edge Function deve rotear `context: analista_clinico` para a Gemini API
(`generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro`).

## Stack de Referência

```
Repo:        JoaoRG-lab/rhema-care-flow
Branch:      main
Domínio:     https://www.reumatismos.com
Node:        20.x
Build:       Vite 5 + React + TypeScript
Install:     npm install --legacy-peer-deps
```
