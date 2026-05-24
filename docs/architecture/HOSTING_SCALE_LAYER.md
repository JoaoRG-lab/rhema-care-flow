# Hosting Scale Layer

Este documento define a arquitetura de hospedagem escalável do Rhema Care Flow.

A decisão estratégica é parar de tratar Vercel, GitHub Pages e Supabase como problemas isolados de debug e tratá-los como camadas especializadas de escala, resiliência e continuidade operacional.

## Fonte de verdade

```txt
JoaoRG-lab/rhema-care-flow → main
```

Nenhum provedor de hospedagem ou backend deve virar fonte independente de código.

## Modelo de camadas

```txt
GitHub main
  ↓
Audit Sentinel / TMR
  ↓
Build artifact confiável
  ↓
Targets de publicação
  ├─ Vercel produção canônica
  ├─ GitHub Pages backup auditado
  └─ futuros mirrors sob issue específica

Backend
  ├─ Supabase gerenciado
  ├─ Edge Functions
  └─ configuração externa no frontend
```

## Papéis

| Camada | Papel | Regra |
|---|---|---|
| GitHub `main` | Fonte de verdade | Todo código nasce e volta aqui |
| Audit Sentinel | Gate de PR | Build deve passar antes de merge |
| TMR | Auditoria/deploy canônico | Voter antes de deploy |
| Vercel | Produção canônica | Recebe domínio quando verde |
| GitHub Pages | Backup auditado | Não disputa domínio com Vercel |
| Supabase | Backend gerenciado | Dados, auth e edge; não fonte de frontend |
| Lovable | Prototipagem/espelho eventual | Fora do caminho crítico sem créditos |

## Vercel como escala, não gargalo

Vercel deve ser usado como camada de produção e rollback.

Diretrizes:

- produção deve sair de artifact auditado;
- preferir deploy prebuilt quando o TMR já validou o build;
- manter rollback documentado;
- não usar o Preview automático como única verdade;
- falha de Preview não deve bloquear evolução se Sentinel/TMR estão verdes;
- domínio só muda com issue específica e rollback claro.

Comandos conceituais de referência:

```bash
vercel build --prod
vercel deploy --prebuilt --prod
vercel rollback
```

## GitHub Pages como backup auditado

GitHub Pages não substitui Vercel.

Uso pretendido:

- backup público derivado de `main` auditada;
- fallback para leitura pública;
- validação de build estático;
- continuidade se Vercel estiver instável.

Restrições:

- não assumir `reumatismos.com` enquanto Vercel for canônico;
- usar apenas URL de backup;
- não fazer mutação de DNS por workflow;
- não publicar branch não auditada.

## Supabase como backend escalável

Supabase deve ser tratado como backend gerenciado, não como bloqueio de produto.

Diretrizes:

- usar projeto existente;
- documentar contratos sem expor valores sensíveis;
- frontend público deve degradar bem se backend falhar;
- admin/dashboard podem exigir backend;
- Edge Functions devem ter mensagens de erro claras;
- não criar novo projeto sem issue específica.

## Frontend resiliente

As rotas públicas precisam continuar úteis mesmo se backend ou IA estiverem indisponíveis.

Prioridades:

- `/reumatismos`
- `/reumatismos/fibromialgia`
- `/reumatismos/artrite-reumatoide`
- `/reumatismos/lupus`
- `/reumatismos/osteoporose`
- `/reumatismos/gota`
- `/reumatismos/dor-lombar-inflamatoria`

Regras:

- conteúdo público deve ser estático e indexável;
- widget de IA é progressivo, não bloqueante;
- falha de IA deve aparecer como aviso amigável;
- CTAs devem funcionar sem exigir login;
- páginas públicas não devem depender de dados sensíveis.

## Estratégia de promoção

### Estado normal

```txt
main auditada → Vercel produção
main auditada → GitHub Pages backup
Supabase → backend gerenciado
```

### Vercel instável

```txt
main continua evoluindo
GitHub Pages mantém backup público
Vercel é recuperado sem bloquear UX/conteúdo
```

### Backend instável

```txt
site público continua renderizando
áreas administrativas mostram erro claro
Edge Functions degradam com mensagem segura
```

## Critérios para mexer em produção

Antes de qualquer ação de produção:

1. PR pequeno mergeado na `main`.
2. Audit Sentinel verde.
3. TMR ou build equivalente verde.
4. Plano de rollback.
5. Registro em issue.
6. Nenhum secret ou dado sensível no diff.

## Próximos trabalhos

1. Melhorar UX da landing `/reumatismos`.
2. Tornar widget público de IA mais resiliente a falhas.
3. Documentar contratos Supabase/Edge sem secrets.
4. Criar checklist de promoção Vercel produção.
5. Criar checklist de validação GitHub Pages backup.

## Referências internas

- Issue #87 — Hosting Scale Layer.
- Issue #40 — orientação de agentes.
- Issue #41 — orquestração geral.
- PR #67 — GitHub Pages backup.
- PR #76 — restauração do build Vite.
