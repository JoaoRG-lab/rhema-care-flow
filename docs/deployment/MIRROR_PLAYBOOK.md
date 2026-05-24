# Mirror Playbook — Lovable + Vercel

Este documento define como manter Lovable e Vercel alinhados a partir da `main` canônica.

## Decisão operacional

Enquanto o Vercel Preview automático estiver instável, o domínio público pode continuar servindo Lovable como vitrine operacional.

A fonte de verdade continua sendo:

```txt
JoaoRG-lab/rhema-care-flow → main
```

## Papel de cada target

| Target | Função | Estado |
|---|---|---|
| GitHub `main` | Fonte de verdade | Canônico |
| Lovable | Espelho público temporário | Deve puxar `main` |
| Vercel/TMR | Produção canônica futura | Recuperar após validação |

## Regra principal

Lovable e Vercel não devem virar fontes independentes de código.

Qualquer alteração gerada por Lovable precisa voltar ao GitHub por commit ou PR rastreável.

## Checklist Lovable

1. Abrir o projeto no Lovable.
2. Confirmar projeto `rhema-care-flow`.
3. Confirmar integração com `JoaoRG-lab/rhema-care-flow`.
4. Confirmar branch `main`.
5. Rodar sync/pull da `main`.
6. Publicar no Lovable.
7. Testar rotas públicas:
   - `/reumatismos`
   - `/reumatismos/fibromialgia`
   - `/reumatismos/artrite-reumatoide`
   - `/reumatismos/lupus`
   - `/reumatismos/osteoporose`
   - `/reumatismos/gota`
   - `/reumatismos/dor-lombar-inflamatoria`
   - `/ai-panel`

## Prompt para Lovable

```txt
Sincronize este projeto com o repositório canônico `JoaoRG-lab/rhema-care-flow`, branch `main`.

Não use forks, não use `joaooz123-png/*`, não use `Mainn`, não use branches `seed/*` e não crie uma fonte paralela de verdade.

Objetivo: fazer o ambiente Lovable espelhar o estado atual da `main`, preservando o app Vite/React existente, as rotas públicas `/reumatismos/*`, o widget de IA pública, o painel `/ai-panel`, o Supabase client atual e o contrato da Edge Function `ai-assistant`.

Antes de alterar código, apenas sincronize/puxe a `main` e mostre quais arquivos ficariam diferentes. Se houver mudança necessária, faça em branch ou commit rastreável para voltar ao GitHub.

Não altere o workflow TMR, `vercel.json`, Supabase project ou domínio.
```

## Checklist Vercel

O `vercel.json` já está configurado para Vite:

```json
{
  "framework": "vite",
  "installCommand": "npm install --legacy-peer-deps",
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Para recuperar Vercel como produção canônica:

1. Confirmar workspace correto.
2. Confirmar projeto `rhema-care-flow`.
3. Confirmar ambiente de build.
4. Rodar TMR/prebuilt.
5. Só mover produção para Vercel quando deploy estiver verde.

## Critério de sucesso

- Lovable mostra a `main` atual.
- Vercel deixa de ser bloqueio operacional.
- Código continua rastreável pelo GitHub.
- Domínio público não fica preso a build antigo.

Refs: #40 #41 #43
