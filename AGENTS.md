# AGENTS.md — Protocolo TMR para Agentes de IA

Este arquivo define como agentes de IA (Perplexity, Copilot, qualquer LLM)
devem operar neste repositório. O princípio é o mesmo do TMR Deployment
Auditor: **nenhuma ação chega ao usuário sem passar por verificação interna.**

---

## Princípio Fundamental

> A redundância não é só para o deploy. É para todo comportamento do agente.

O padrão humano que este protocolo elimina:
```
Agente age → Usuário aguarda → Usuário vê resultado → Usuário reporta ao agente
→ Agente verifica → Ciclo repete
```

O padrão correto (TMR aplicado ao agente):
```
Agente R1: executa ação
Agente R2: verifica se ação conflita com estado existente do repo
Agente R3: verifica se ação introduz novo problema
Voter interno: só reporta ao usuário quando as 3 passam
```

---

## Regras Obrigatórias Antes de Qualquer Commit

### R1 — Ler antes de escrever
- SEMPRE ler os arquivos que serão afetados antes de modificar
- SEMPRE ler arquivos relacionados (ex: se modifica workflow, ler todos os workflows)
- Nunca assumir o estado de um arquivo sem lê-lo

### R2 — Verificar conflitos
- SEMPRE verificar se a mudança conflita com arquivos existentes
- Ex: novo workflow de deploy? Verificar se já existe outro fazendo o mesmo
- Ex: nova dependência? Verificar compatibilidade com as existentes
- Ex: novo componente? Verificar se já existe com nome similar

### R3 — Voter interno antes de reportar
- Só reportar ao usuário quando R1 + R2 passaram
- Reportar com estado COMPLETO: o que foi feito, o que foi verificado, o que ainda pode falhar
- NUNCA reportar com "aguarde e me diz o que aconteceu"
- Se o voter interno rejeitar, corrigir internamente e repetir (máx 3 tentativas)
- Se após 3 tentativas ainda falhar → reportar com diagnóstico completo, não pedir para o usuário testar

---

## O que NÃO fazer

- ❌ Commitar sem ler os arquivos relacionados existentes
- ❌ Dizer "aguarde o deploy e me diz o que aconteceu"
- ❌ Criar workflow sem verificar se existe outro com mesmo trigger
- ❌ Adicionar dependência sem verificar peer deps
- ❌ Responder sem processar todo o contexto do chat
- ❌ Ação rápida sem leitura completa

---

## O que fazer

- ✅ Ler TODOS os arquivos relacionados antes de agir
- ✅ Verificar conflitos internamente
- ✅ Commitar apenas quando voter interno aprova
- ✅ Reportar com relatório consolidado
- ✅ Tagear SHAs limpos (tmr-good-*)
- ✅ Preservar estados falhos para diagnóstico (tmr/killed-*)
- ✅ Processar TODO o histórico do chat antes de responder

---

## Arquitetura de Workflows (estado atual)

```
push → main
  └── tmr-deploy.yml     ← ÚNICO ponto de build + deploy (ativo)
        ├── replica-1 (Node 20, cache)
        ├── replica-2 (Node 18, cache)
        ├── replica-3 (Node 20, sem cache)
        ├── voter (2-of-3)
        ├── deploy (se APPROVED)
        ├── rotate-to-head (se REJECTED)
        └── auditor-i3 (relatório + Issue + tag)

pull_request → main
  └── preview.yml        ← deploy de preview por PR (ativo)

tmr REJECTED
  └── ai-reporter.yml   ← Issue consolidada (ativo, via workflow_run)

LEGACY (desativados):
  ├── deploy.yml.disabled
  └── ci.yml.disabled
```

---

## Secrets necessários

| Secret | Usado em |
|--------|----------|
| `CLOUDFLARE_API_TOKEN` | tmr-deploy.yml, preview.yml |
| `CLOUDFLARE_ACCOUNT_ID` | tmr-deploy.yml, preview.yml |
| `VITE_SUPABASE_URL` | tmr-deploy.yml, preview.yml |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | tmr-deploy.yml, preview.yml |
| `VITE_SUPABASE_ANON_KEY` | (legacy, pode remover) |
| `VITE_HF_TOKEN` | (Hugging Face, opcional) |
| `GITHUB_TOKEN` | auto (issues, tags, comentários) |

---

## Score de Qualidade I3

| Faixa | Significado | Ação |
|-------|-------------|------|
| 90–100 | Excelente | Deploy + tag tmr-good |
| 85–89 | Bom | Deploy + tag tmr-good |
| < 85 | Abaixo do threshold | Deploy (se aprovado) + Issue de aviso |
| REJECTED | Falha no voter | Kill + rotate + Issue obrigatória |

---

*Protocolo estabelecido em 2026-05-21 por João Otávio / Rhema Care Flow*
*Inspirado em Byzantine Fault Tolerance e Triple Modular Redundancy*

---

## Protocolo do Agente: Perplexity Comet

### Identificação

- **Agente:** Perplexity Comet
- **Ativação:** Convocado via chat pelo usuário João Otavio
- **Escopo primário:** Auditoria, calculadoras clínicas, libs de conteúdo, issues e PRs
- **Última atualização:** 2026-05-23

### Regras de Não-Conflito

1. **Não edita infra diretamente** — workflows, wrangler.toml, netlify.toml só via PR com discussão em issue
2. **Não meche em branches ativas de outros agentes** — verificar issues abertas antes de criar branch
3. **Sempre usa prefixo `[PERPLEXITY]`** em títulos de PRs e issues
4. **Não fecha issues de outros agentes** — apenas comenta com atualizações
5. **Não faz merge de PRs** — apenas cria; merge é responsabilidade do usuário ou do TMR voter

### Auditoria Interna (Protocolo TMR R1-R2-R3)

**R1 — Ler antes de escrever:**
- Ler todos os arquivos relevantes antes de qualquer modificação
- Verificar issues abertas para evitar duplicatas
- Conferir PRs ativos antes de criar nova branch

**R2 — Verificar conflitos:**
- Conferir imports e exports dos arquivos afetados
- Validar compatibilidade com TypeScript/Vite sem rodar build
- Identificar impacto em outros componentes

**R3 — Voter interno:**
- Relatório final deve conter: o que foi feito, o que foi auditado, problemas encontrados
- Máximo 3 tentativas de auto-correção antes de reportar ao usuário
- Nunca dizer "teste e me diga" — validar internamente antes de reportar

### Escopo de Competência

| Área | Perplexity | Copilot | ChatGPT |
|---|---|---|---|
| Calculadoras clínicas | **Primário** | Suporte | Suporte |
| Libs de conteúdo | **Primário** | Suporte | Suporte |
| Issues e auditoria | **Primário** | Suporte | Suporte |
| CI/CD e workflows | Proposta via PR | **Primário** | Suporte |
| Auth e Supabase | Suporte | Suporte | **Primário** |
| UI/componentes | Suporte | **Primário** | Suporte |

### Issues de Competência Aberta (criadas por Perplexity)

- #46 — P0: Deploy quebrado
- #47 — P0: Domínio reumatismos.com
- #48 — Roadmap calculadoras
- #49 — Enriquecimento libs clínicas

### PR Aberto

- #45 — feat(calculadoras): DAS28, SDAI, CDAI, SLEDAI-2K, BASDAI, ASDAS, FRAX
