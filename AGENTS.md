# AGENTS.md — Governança Multi-Agente UHS Health OS

> **Fonte de verdade:** `JoaoRG-lab/rhema-care-flow` branch `main`
> Este arquivo só deve ser editado via PR a partir de `main` — nunca diretamente em feature branches.
> **Atualizado:** 2026-05-24 · **Autor:** [PERPLEXITY]

---

## Regra de Ouro

**Um agente, uma issue, uma branch, um PR.**
Nunca dois agentes editam o mesmo arquivo ao mesmo tempo.
Nunca ninguém commita direto em `main`.

---

## Responsabilidades por Agente

| Agente | Escopo principal | Labels de issues | Branches |
|---|---|---|---|
| **Perplexity** | Calculadoras clínicas, scores, bibliotecas médicas, AGENTS.md | `[PERPLEXITY]` | `feat/perplexity-*` |
| **GitHub Copilot** | Refatoração TypeScript, testes, lint, acessibilidade UI | `[COPILOT]` | `fix/copilot-*` |
| **ChatGPT / Codex** | Novos componentes React, Edge Functions, integrações Supabase | `[CODEX]` | `feat/codex-*` |
| **Grok** | Blockchain/Solana, URV Privacy Module, scripts Rust/Anchor | `[GROK]` | `feat/grok-*` |
| **Lovable** | UI visual, design system, shadcn/ui tweaks | `[LOVABLE]` | `feat/lovable-*` |
| **DevOps / Infra** | Auditoria DNS/domínio, variáveis de ambiente, workflows CI/CD | `[DEVOPS]` | `fix/devops-*` |

---

## Fluxo Operacional (TMR)

```
main ──► branch curta ──► PR atômico ──► Audit Sentinel ──► Voter 2-of-3 ──► APPROVED ──► deploy Vercel
```

1. Checkout da `main` mais recente
2. Branch com prefixo do agente (ex: `feat/perplexity-calculadoras`)
3. PR pequeno e atômico — máximo 400 linhas de diff
4. Aguardar Audit Sentinel (3 auditors: I1 cache / I2 no-cache / I3 clean)
5. Voter precisa de 2/3 `pass` para `APPROVED`
6. Só após `APPROVED` o deploy vai para Vercel production

---

## Deploy e Domínios

### Plataforma canônica
- **Vercel** — workspace `joaorg-lab's projects`, projeto `rhema-care-flow`
- **Supabase** — `rfsaxstpfpigrjyiochi.supabase.co`
- **GitHub Actions** — `tmr-deploy.yml` é o caminho canônico

### Domínios — todos devem apontar para o mesmo Vercel deployment

| Domínio | Status esperado | Tipo DNS |
|---|---|---|
| `reumatismos.com` | Apex → Vercel | A record / ALIAS |
| `www.reumatismos.com` | CNAME → `cname.vercel-dns.com` | CNAME |
| `orientanovvs.org` | CNAME → `cname.vercel-dns.com` | CNAME |
| `www.orientanovvs.org` | CNAME → `cname.vercel-dns.com` | CNAME |

> ⚠️ Se `reumatismos.com` estiver fora do ar e `orientanovvs.org` funcionando, o problema está na zona DNS do `reumatismos.com` — verificar registros A/CNAME no painel do registrador ou Cloudflare.

### Variáveis de ambiente obrigatórias

As variáveis de ambiente **não devem ser listadas neste arquivo**. Consulte:
- `.env.example` — nomes e descrições de cada variável
- `.github/SECRETS.md` — instruções de onde configurar no Vercel e Supabase

> Regra: nenhum nome de secret ou chave de API deve aparecer no AGENTS.md.

---

## Repos depreciados — NÃO usar

Conforme `.rhema-canonical.json`:

```
rhema-care-flow-e98622f0
rhema-care-flow-65f281f9
medconsult-os-starter
medconsult-os-starter-p2hz
medconsult-os-starter-1ldc
medconsult-os-starter-52l4
```

Nenhum agente deve abrir PR, commitar ou deployar a partir desses repositórios.

---

## Arquivos protegidos (não alterar sem issue específica)

- `.github/workflows/tmr-deploy.yml`
- `.github/workflows/audit-sentinel.yml`
- `supabase/functions/ai-assistant/index.ts`
- `src/data/reumatismosGuides.ts`
- `.rhema-canonical.json`
- `.env` e `.env.example`

---

## Contrato da Edge Function `ai-assistant`

Resposta deve sempre preservar:
```json
{ "reply": "...", "answer": "..." }
```

O campo `site_publico: true` indica widget público — sem diagnóstico individual, sem prescrição.

---

## Issues ativas de referência

| Issue | Título | Responsável |
|---|---|---|
| #40 | Trilho operacional (ponto de entrada) | [PERPLEXITY] |
| #41 | Roadmap de melhoria contínua | [PERPLEXITY] |
| #37 | Auditoria viva pós-merges | [PERPLEXITY] |
| #16 | Vercel domain — configuração e validação | [DEVOPS] |
| #17 | Supabase keys — rotação e variáveis | [DEVOPS] |
| #18 | DNS — auditoria de registros A/CNAME | [DEVOPS] |
| #6  | Sementeira de módulos clínicos | [PERPLEXITY] |

> Issues fechadas devem ser removidas desta tabela no mesmo PR que as encerra.

---

## Checklist pré-PR (todos os agentes)

> O checklist específico de cada agente fica no template de PR (`.github/PULL_REQUEST_TEMPLATE.md`).
> Este checklist é o mínimo universal obrigatório para qualquer PR neste repositório.

- [ ] Branch criada a partir da `main` atual
- [ ] Nenhum arquivo de workflow tocado sem issue `[DEVOPS]` aprovada
- [ ] Nenhum secret, chave real ou token no código
- [ ] Diff ≤ 400 linhas
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` (não `ANON_KEY`)
- [ ] Componentes React com `export default` e tipos TypeScript completos
- [ ] Calculadoras com fórmulas validadas por referência clínica citada
