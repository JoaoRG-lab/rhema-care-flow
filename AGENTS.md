# AGENTS.md — Governança Multi-Agente UHS Health OS

> **Fonte de verdade:** `JoaoRG-lab/rhema-care-flow` branch `main`  
> **Atualizado:** 2026-05-23 · **Autor:** [PERPLEXITY]

---

## Regra de Ouro

**Um agente, uma issue, uma branch, um PR.**  
Nunca dois agentes editam o mesmo arquivo ao mesmo tempo.  
Nunca ninguém commita direto em `main`.

---

## Responsabilidades por Agente

| Agente | Escopo principal | Labels de issues | Branches |
|---|---|---|---|
| **Perplexity** | Calculadoras clínicas, scores, bibliotecas médicas, auditoria DNS/domínio, AGENTS.md | `[PERPLEXITY]` | `feat/perplexity-*` |
| **GitHub Copilot** | Refatoração TypeScript, testes, lint, acessibilidade UI | `[COPILOT]` | `fix/copilot-*` |
| **ChatGPT / Codex** | Novos componentes React, Edge Functions, integrações Supabase | `[CODEX]` | `feat/codex-*` |
| **Grok** | Blockchain/Solana, URV Privacy Module, scripts Rust/Anchor | `[GROK]` | `feat/grok-*` |
| **Lovable** | UI visual, design system, shadcn/ui tweaks | `[LOVABLE]` | `feat/lovable-*` |

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

### Variáveis de ambiente obrigatórias (Vercel → Settings → Environment Variables)

```
VITE_SUPABASE_URL=https://rfsaxstpfpigrjyiochi.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<chave anon pública>
PERPLEXITY_API_KEY=<chave Perplexity para Edge Function>
```

Não usar `VITE_SUPABASE_ANON_KEY` — nome correto é `VITE_SUPABASE_PUBLISHABLE_KEY`.

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

## Auditoria Interna (Perplexity)

Esta seção é a redundância interna do agente Perplexity.

### Checklist pré-PR
- [ ] Branch criada a partir da `main` atual
- [ ] Nenhum arquivo de workflow tocado
- [ ] Nenhum secret ou valor real no código
- [ ] Diff ≤ 400 linhas
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` (não `ANON_KEY`)
- [ ] Componentes React com `export default` e tipos TypeScript completos
- [ ] Calculadoras com fórmulas validadas por referência clínica citada

### Issues que este agente monitora
- #40 — trilho operacional (ponto de entrada)
- #41 — roadmap de melhoria contínua
- #37 — auditoria viva pós-merges
- #16 / #17 / #18 — pendências Vercel/Supabase/domínio
- #6 — sementeira de módulos
