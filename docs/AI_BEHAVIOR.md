# Esquema de Comportamento das IAs — Rhema Care Flow

## Diagrama do Ciclo

```
┌─────────────────────────────────────────────────────────────┐
│                   CICLO DE QUALIDADE DE IA                  │
└─────────────────────────────────────────────────────────────┘

  INPUT
    │
    ▼
┌──────┐    valid=false    ┌─────────┐
│ DATA │ ─────────────────▶│ CORRECT │
└──────┘                   └────┬────┘
    │ valid=true                │
    │           ┌───────────────┘
    ▼           ▼
┌───────┐
│ BUILD │ ◀────────────────────────────┐
└───┬───┘                              │
    │                                  │
    ▼                                  │
┌──────┐    passed=false               │
│ TEST │ ─────────────────────────────▶┤
└──┬───┘                               │
   │ passed=true                       │
   ▼                                   │
┌───────┐   passed=false               │
│ AUDIT │ ─────────────────────────────┘
└───┬───┘   (max 5 iterações)
    │ passed=true
    ▼
┌────────┐
│ REPORT │ → GitHub Issue criado
└───┬────┘
    │
    ▼
  DONE ✅  (ou ERROR ❌ se atingiu MAX_ITERATIONS)
```

## Estados

| Estado | Agente | Condição de saída |
|--------|--------|------------------|
| `idle` | — | Aguardando input |
| `data` | — | `valid = true` → BUILD \| `valid = false` → CORRECT |
| `correct` | CodeBuilder | Sempre → BUILD |
| `build` | **CodeBuilder** | `code.length > 50` → TEST |
| `test` | — (regras estáticas) | `export + length + sem TODO` → AUDIT |
| `audit` | **CodeAuditor** | `score >= 80 + sem critical/high` → REPORT |
| `report` | — | Sempre → DONE ou ERROR |
| `done` | — | Ciclo bem-sucedido |
| `error` | — | MAX_ITERATIONS atingido |

## Agentes

### 🔍 CodeAuditor (`useCodeAuditor`)
- **Modelo:** `Qwen/Qwen2.5-Coder-32B-Instruct`
- **Função:** Revisar código TypeScript/React
- **Output:** `AuditReport` com score, findings classificados, passed/failed
- **Aprovação:** score ≥ 80 e nenhum finding `critical` ou `high`

### 🔨 CodeBuilder (`useCodeBuilder`)
- **Modelo:** `Qwen/Qwen2.5-Coder-32B-Instruct`  
- **Função:** Construir código faltante ou corrigir código com base nos findings do auditor
- **Output:** `BuildResult` com código gerado, filename, explicação
- **Regras:** Usa `@/contexts/AuthContext`, `@/integrations/supabase/client`, TypeScript estrito

### 🩺 InternalAI (`useInternalAI`)
- **Modelo:** `HuggingFaceH4/zephyr-7b-beta`
- **Função:** Assistente clínico para profissionais de saúde
- **System prompt:** PT-BR, baseado em evidências, sem diagnósticos definitivos

### ⚙️ StateMachine (`useAIStateMachine`)
- **Função:** Orquestra os 3 agentes no ciclo DATA→CORRECT→BUILD→TEST→AUDIT→REPORT
- **MAX_ITERATIONS:** 5 (evita loop infinito)
- **Log:** Cada etapa é registrada com timestamp e status

## Variáveis de Ambiente Necessárias

```env
VITE_HF_TOKEN=hf_xxx              # Token principal (todos os agentes)
VITE_HF_MODEL=HuggingFaceH4/zephyr-7b-beta   # IA clínica
VITE_HF_AUDITOR_MODEL=Qwen/Qwen2.5-Coder-32B-Instruct  # Auditor
VITE_HF_BUILDER_MODEL=Qwen/Qwen2.5-Coder-32B-Instruct  # Builder
```

## Configurar Supabase Edge Function

Para o reporte de issues via servidor (token GitHub seguro):

```bash
# 1. Deploy da Edge Function
npx supabase functions deploy create-github-issue

# 2. Configurar secrets
npx supabase secrets set GITHUB_TOKEN=ghp_xxxx
npx supabase secrets set GITHUB_REPO=JoaoRG-lab/rhema-care-flow
```

## Uso no Frontend

```tsx
import { useAIStateMachine } from '@/hooks/useAIStateMachine';
import { createGitHubIssue, buildIssueTitle, getIssueLabels } from '@/services/aiOrchestrator';

const { run, state, log, running } = useAIStateMachine();

await run(
  codigoFonte,
  'src/hooks/meuHook.ts',
  'Criar hook de agendamento com Supabase e tratamento de erro',
  async (reportBody) => {
    // Cria issue automaticamente quando ciclo termina
    await createGitHubIssue({
      title: buildIssueTitle('meuHook.ts', passed, score),
      body: reportBody,
      labels: getIssueLabels(passed, score),
    });
  }
);
```
