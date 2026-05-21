# TMR Deployment Auditor — Documentação

## Visão Geral

Sistema de deploy baseado em **Triple Modular Redundancy (TMR)**, inspirado em Byzantine Fault Tolerance.

O objetivo é **nunca deixar um build falho chegar à produção**, rotacionando automaticamente para o último SHA limpo e reportando tudo em uma única Issue consolidada — não 30 notificações.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│  PUSH para main                                                  │
│         │                                                        │
│  ┌──────┴──────────────────────────────────────────────────┐    │
│  │         3 RÉPLICAS em PARALELO (simultâneas)             │    │
│  │                                                          │    │
│  │  R1: Node 20 · Ubuntu · npm cache                       │    │
│  │  R2: Node 18 · Ubuntu · npm cache (compatibilidade)     │    │
│  │  R3: Node 20 · Ubuntu · sem cache (paranoia)            │    │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │ outputs: pass/fail + duração       │
│                             ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  VOTER — Byzantine Majority 2-of-3                       │   │
│  │                                                          │   │
│  │  ≥2 pass → verdict: APPROVED                            │   │
│  │  < 2 pass → verdict: REJECTED                           │   │
│  └──────────┬───────────────────────┬────────────────────────┘  │
│             │                       │                            │
│     APPROVED│               REJECTED│                            │
│             ▼                       ▼                            │
│  ┌──────────────────┐   ┌───────────────────────────────────┐   │
│  │  DEPLOY          │   │  ROTATE TO HEAD                   │   │
│  │  (réplica winner)│   │  git reset --hard <last-good-sha> │   │
│  └──────────────────┘   │  push --force-with-lease          │   │
│                         │  branch tmr/killed-* preservado   │   │
│                         └───────────────────────────────────┘   │
│                                      │                           │
│                                      ▼                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  AUDITOR I3 (paralelo, não bloqueia deploy)              │   │
│  │                                                          │   │
│  │  • Score 0-100 (33 pts/réplica + bonus velocidade)      │   │
│  │  • Score < 85 → Issue automática                        │   │
│  │  • REJECTED → Issue automática                          │   │
│  │  • Comentário no commit (sempre)                        │   │
│  │  • Tag tmr-good-* se aprovado                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Métricas

| Métrica | Valor | Base Teórica |
|---------|-------|---------------|
| Quorum mínimo | 2/3 réplicas | Byzantine: 2f+1, f=1 |
| Score de aprovação | ≥ 85/100 | I3 threshold |
| Pontuação por réplica | 33 pts | TMR equitativo |
| Bônus velocidade | +1 pt | build < 120s |
| Histórico de commits | 50 SHAs | rotate window |
| Retenção de artefatos | 3 dias | custo vs. utilidade |

---

## Labels de Issues

| Label | Condição |
|-------|----------|
| `tmr-killed` | Voter REJECTED |
| `deploy-failure` | Voter REJECTED |
| `tmr-low-score` | Score < 85 mas aprovado |

---

## Branches Gerados

- `tmr/killed-YYYYMMDD-HHMMSS` — preserva SHA falho para diagnóstico
- `tmr-good-YYYYMMDD-HHMMSS` — tag de SHA aprovado

---

## Segredos Necessários

| Secret | Uso |
|--------|-----|
| `CLOUDFLARE_API_TOKEN` | Deploy |
| `CLOUDFLARE_ACCOUNT_ID` | Deploy |
| `VITE_SUPABASE_URL` | Build env |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Build env |
| `GITHUB_TOKEN` | Auto (issues, tags, comentários) |

---

## Você só recebe notificação quando

1. **Build KILLED** — Issue consolidada com diff, erros das 3 réplicas e SHA para onde rotacionou
2. **Score baixo** — Issue de aviso com relatório de qualidade
3. **Tudo OK** — Comentário silencioso no commit (sem notificação push)
