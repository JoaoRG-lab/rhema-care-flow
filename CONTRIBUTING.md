# Guia de Contribuição — Rhema Care Flow

Obrigado por querer contribuir! Este é um projeto open source de saúde — cada linha de código pode impactar o cuidado de pacientes reais.

> ⚠️ **Importante:** A `main` é protegida. Nenhum push direto é aceito — nem do mantenedor. Todo código passa por Pull Request com revisão obrigatória. Sugestões de funcionalidade ou design devem ser abertas como [Discussion](https://github.com/JoaoRG-lab/rhema-care-flow/discussions) antes de qualquer implementação.

## Índice

- [Código de Conduta](#código-de-conduta)
- [Tenho uma ideia — por onde começo?](#tenho-uma-ideia--por-onde-começo)
- [Como contribuir com código](#como-contribuir-com-código)
- [Setup local](#setup-local)
- [Padrões de código](#padrões-de-código)
- [Áreas prioritárias](#áreas-prioritárias)
- [Processo de PR](#processo-de-pr)

---

## Código de Conduta

Seja respeitoso, construtivo e inclusivo. Este é um espaço para colaboração técnica séria.

---

## Tenho uma ideia — por onde começo?

**Não abra um PR diretamente.** O fluxo correto é:

```
Ideia / sugestão
     ↓
💬 Discussion (https://github.com/JoaoRG-lab/rhema-care-flow/discussions)
     ↓
  Alinhamento com o mantenedor
     ↓
🐛 Issue criada com escopo definido
     ↓
🔧 Fork → branch → PR
     ↓
  Code review pelo mantenedor (@JoaoRG-lab)
     → Aprovado → merge em main
```

Isto garante que **nenhuma alteração entra no código sem revisão clínica e técnica**. Dados de saúde exigem esse rigor.

---

## Como contribuir com código

### 1. Issues primeiro

Antes de abrir um PR, verifique se já existe uma issue para o que você quer resolver. Se não existir, crie uma descrevendo o problema ou a proposta.

Use as labels:
- `bug` — algo quebrado
- `enhancement` — melhoria de feature existente
- `good first issue` — ótimo ponto de entrada para novos contribuidores
- `help wanted` — precisamos de ajuda específica aqui
- `performance` — otimização de bundle/render
- `tests` — cobertura de testes

### 2. Fork e branch

```bash
git fork https://github.com/JoaoRG-lab/rhema-care-flow
git checkout -b feat/nome-descritivo
# ou
git checkout -b fix/descricao-do-bug
```

### 3. Desenvolva

Siga os padrões de código abaixo. Rode os checks antes de abrir o PR.

### 4. Abra o PR

PR para a branch `main`. Descreva:
- O que foi feito
- Como testar
- Screenshots (se houver mudança visual)

---

## Setup local

```bash
git clone https://github.com/JoaoRG-lab/rhema-care-flow.git
cd rhema-care-flow
npm install

# Configure o .env
cp .env.example .env
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY

npm run dev
```

### Supabase local (opcional)

```bash
# Instale o Supabase CLI
npm install -g supabase

# Inicie localmente
supabase start

# Aplique migrations
supabase db push
```

---

## Padrões de código

### TypeScript — 0 erros obrigatório

```bash
npx tsc --noEmit
```

Nenhum PR será aceito com erros TypeScript.

### ESLint — 0 erros (warnings OK)

```bash
npx eslint src --ext .ts,.tsx
```

### Convenções

- Componentes: PascalCase (`PatientCard.tsx`)
- Hooks: camelCase com prefixo `use` (`usePatientData.ts`)
- Tipos: sufixo `Type` ou `Props` (`PatientCardProps`)
- Commits: `feat:`, `fix:`, `chore:`, `docs:`, `perf:`, `test:`

### Privacidade de dados (CRÍTICO)

- **Nunca** log `user_id`, CRM, nome completo de paciente em console
- **Nunca** expor dados de pacientes sem filtro por `user_id` (RLS)
- O prontuário integrado usa apenas `patient_code` — mantenha esse padrão
- Qualquer nova tabela com dados clínicos **precisa de RLS ativado**

---

## Áreas prioritárias

### 🔴 Alta prioridade

**Performance / Bundle size**
- Chunks acima de 500kb: `PatientDetail`, `Scores`, `index`
- Oportunidade: dynamic imports, code splitting por rota
- Arquivo relevante: `vite.config.ts`

**Testes (zero cobertura hoje)**
- Stack sugerida: Vitest + Testing Library
- Começar pelos hooks: `usePatientData`, `useTeleconsulta`, `useSharedRecord`
- Meta: 60% de cobertura nos hooks críticos

### 🟡 Média prioridade

**Acessibilidade**
- Formulários clínicos sem `aria-label` adequado
- Contraste de cores em alguns badges de status
- Keyboard navigation nos modais

**Mobile**
- `PatientDetail` em telas < 375px tem overflow
- Bottom nav bar precisa de área de toque maior
- Teleconsulta: layout do painel lateral em portrait

**i18n**
- PT-BR: completo
- EN-US: ~70% — strings hardcoded ainda em PT-BR em alguns componentes

### 🟢 Baixa prioridade / Boas para começar

**Novos scores clínicos**
- BASDAI (espondilite)
- PASI (psoríase)
- SCORAD (dermatite atópica)
- Padrão: ver `src/pages/Scores.tsx`

**Documentação**
- JSDoc nos hooks principais
- Storybook para componentes de UI
- Guia de especialidades (`src/config/specialties.ts`)

---

## Processo de PR

1. **Obrigatório:** Discussion ou Issue prévia aprovada pelo mantenedor
2. PR abre → CI roda `tsc --noEmit` + `eslint` (0 erros obrigatórios)
3. **Revisão obrigatória** de `@JoaoRG-lab` — nenhum PR entra sem aprovação
4. Arquivos em `.github/CODEOWNERS` exigem revisão do mantenedor independente
5. Review em até 48h úteis
6. Máximo 2 rounds de revisão
7. Merge por squash

### O que bloqueia um PR automaticamente

- TypeScript com erros
- ESLint com erros
- Alterações em `supabase/migrations/` sem discussion prévia
- Remoção ou bypass de RLS (Row Level Security)
- Qualquer dado de paciente exposto sem filtro por `user_id`
- Dependências adicionadas sem justificativa na issue

---

## Dúvidas?

Abra uma [Discussion no GitHub](https://github.com/JoaoRG-lab/rhema-care-flow/discussions) ou uma issue com a label `question`.

---

**Obrigado por contribuir com a saúde open source. 🩺**
