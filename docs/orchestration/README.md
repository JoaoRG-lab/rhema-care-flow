# Rhema Care Flow — Orchestration Playbook

Este playbook define o fluxo operacional para evoluir o website/app/software com segurança, usando GitHub como fonte de verdade e conectores externos apenas como apoio.

## Fonte de verdade

- Repo: `JoaoRG-lab/rhema-care-flow`
- Branch final: `main`
- Fluxo padrão: branch curta → PR pequeno → Audit Sentinel → merge → TMR/prebuilt quando aplicável
- Issue de agentes: `#40`
- Issue de auditoria viva: `#37`
- Roadmap de orquestração: `#41`
- Laboratório auxiliar: `tools/colab/Rhema_Care_Flow_Audit_Lab.ipynb`

## Princípios

1. Não commitar diretamente em `main`.
2. Não usar branches antigas como base direta.
3. Não reabrir PRs antigos sem rebase limpo.
4. Não expor credenciais, tokens ou valores reais.
5. Não alterar workflows de deploy sem issue específica.
6. Não tocar em arquivos médicos/core estáveis sem escopo explícito.
7. Cada PR deve resolver uma única tarefa.

## Trilhas da orquestra

### 1. Audit / Sentinel

Objetivo: manter build e contrato de integração confiáveis.

Checklist:

- `npm install --legacy-peer-deps`
- `npm run build`
- `npx tsc --noEmit` como sinal de alerta
- `npm run lint --if-present` como sinal de alerta
- contrato `ai-assistant` preservando `reply` e `answer`
- contexto público `site_publico` preservado

Ferramentas:

- GitHub Actions: `audit-sentinel.yml`
- Colab Audit Lab: `tools/colab/Rhema_Care_Flow_Audit_Lab.ipynb`

### 2. Encoding / Infra

Objetivo: reduzir divergência de ambiente e configuração.

Padrões:

- frontend usa `VITE_SUPABASE_URL`
- frontend usa `VITE_SUPABASE_PUBLISHABLE_KEY`
- Edge Functions usam secrets de runtime
- variáveis sem prefixo `VITE_` não devem ir para o navegador
- `VITE_SUPABASE_ANON_KEY` é nome antigo e não deve voltar

### 3. IA / Assistente

Objetivo: manter separação entre assistente público, painel multi-IA e fluxos internos.

Regras:

- assistente público é educativo
- não fornecer diagnóstico individual
- não prescrever
- não coletar dados identificáveis no chat público
- preservar resposta com `reply` e `answer`
- preservar CORS canônico e rate limit

Arquivos principais:

- `supabase/functions/ai-assistant/index.ts`
- `src/components/ai/AISiteAgentWidget2.tsx`
- `src/components/ai/AIIntegrationPanel.tsx`

### 4. UX / Website público

Objetivo: melhorar clareza, navegação e conversão sem prejudicar leitura.

Rotas principais:

- `/reumatismos`
- `/reumatismos/fibromialgia`
- `/reumatismos/artrite-reumatoide`
- `/reumatismos/lupus`
- `/reumatismos/osteoporose`
- `/reumatismos/gota`
- `/reumatismos/dor-lombar-inflamatoria`

Checklist:

- headings claros
- CTA coerente
- widget não invasivo no mobile
- conteúdo médico educativo
- sem promessa terapêutica exagerada

### 5. SEO / Conteúdo

Objetivo: fortalecer indexação e conteúdo estruturado.

Checklist:

- `public/sitemap.xml`
- `public/robots.txt`
- FAQ/schema quando aplicável
- metatags por página
- coerência editorial por doença
- linguagem educativa, sem conduta individualizada

### 6. Backend / Supabase

Objetivo: preservar contrato e segurança.

Regras:

- não criar outro projeto Supabase sem necessidade
- não alterar banco sem issue específica
- Edge Function pública deve continuar sem PHI
- secrets ficam no runtime Supabase/GitHub/Vercel, não no código

### 7. Vercel / Deploy

O Vercel Preview automático pode falhar e não é o gate canônico atual.

Caminho canônico:

1. Audit Sentinel em PR
2. merge na `main`
3. TMR em GitHub Actions
4. build local da saída Vercel
5. deploy prebuilt

O conector Vercel do ChatGPT pode retornar `403 Forbidden` para o workspace correto. Isso é limitação de permissão externa do conector e não deve bloquear PRs ou desenvolvimento enquanto o TMR estiver funcional.

## Como abrir um novo trabalho

Modelo de issue:

```md
## Objetivo

## Arquivos-alvo

## Fora de escopo

## Critério de aceite

## Validação esperada
```

Modelo de PR:

```md
## O que muda

## Por que

## O que não muda

## Validação

Refs #41
```

## Ordem recomendada de próximos PRs

1. Documentar caminho canônico Vercel/TMR.
2. Criar checklist SEO para páginas públicas.
3. Criar checklist de contrato do assistente IA.
4. Revisar UX mobile do widget.
5. Melhorar documentação de Supabase Edge Function.

## Regra final

Melhorar rápido, mas sempre em blocos pequenos, auditáveis e reversíveis.
