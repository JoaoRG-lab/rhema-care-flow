# ADR-001: Arquitetura Base do UHS Health OS (Rhema Care Flow)

**Data:** 2026-05-24  
**Status:** Aceito  
**Autores:** JoaoRG-lab (reumatologista criador), Perplexity AI (SQA parceiro)  
**Revisão:** Obrigatória a cada nova especialidade incorporada

---

## Contexto

O UHS Health OS (Projeto Vida) é um CDSS (*Clinical Decision Support System*) open-source criado por um médico reumatologista brasileiro. O problema central que motiva este sistema é a **fragmentação dos dados médicos**: históricos perdidos em papéis, clínicas diferentes e sistemas que não se comunicam. O paciente repete sua história a cada consulta.

O sistema deve suportar:
- Calculadoras clínicas validadas (evidências 2024-2026) em múltiplas especialidades
- Linha do tempo contínua do paciente (inspirada em HL7 FHIR)
- IA copiloto clínico (AIAssistant, TrendAnalysisAssistant, Guardian Agent)
- Prova criptográfica de integridade de prontuários via blockchain (URV Privacy)
- Três personas: `clinical`, `academic`, `patient`
- Conformidade com LGPD/GDPR

---

## Decisão

### Stack Tecnológica (Imutável sem novo ADR)

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | React 18 + TypeScript 5 + Vite 5 | Ecossistema maduro, type-safety, build rápido |
| UI | Tailwind CSS 3 + shadcn/ui (Radix UI) | Componentes acessíveis headless, temas por especialidade via CSS tokens |
| Roteamento | React Router v6 | Roteamento declarativo com `<ProtectedRoute>` |
| Estado servidor | TanStack Query v5 | Cache inteligente, invalidação automática, evita overfetching |
| Formulários | react-hook-form + zod | Validação type-safe, performance superior a Formik |
| Backend/Auth | Supabase (PostgreSQL + RLS + Edge Functions + Auth JWT) | BaaS completo, RLS garante isolamento por médico |
| Blockchain | Solana Devnet/Mainnet + Rust/Anchor | Imutabilidade auditável. **Zero PHI on-chain** — apenas hashes SHA-256 |
| i18n | i18next | PT-BR primário, EN-US fallback |
| Testes | Vitest + Testing Library | Co-localizado com código, watch mode nativo |

### Estrutura Feature-Based (`src/`)

```
src/
├── components/       # Componentes UI reutilizáveis
│   └── scores/       # Cards de calculadoras clínicas
├── config/           # specialties.ts (14 especialidades), routes
├── contexts/         # PersonaContext, AuthContext, SpecialtyContext
├── hooks/            # useLoginPrompt, usePatientTimeline, useGuardianAlert
├── i18n/             # Traduções PT-BR / EN-US
├── idl/              # Interface Definition Language — contrato Anchor/Solana
├── integrations/     # supabase/, memed/, daily/
├── lib/              # Lógica pura (sem React)
│   ├── calculators.ts         # Motor matemático principal
│   ├── calculators_v2.ts      # Motor V2 multi-especialidade (2024-2026)
│   ├── clinicalScores.ts      # Scores complementares
│   ├── crypto.ts              # SHA-256 para URV Privacy
│   ├── safeRedirect.ts        # Anti open-redirect
│   └── __tests__/             # Testes unitários — OBRIGATÓRIOS para lib/
├── pages/            # Páginas por rota
├── services/         # Chamadas Supabase / Edge Functions
├── tests/            # Testes de integração e E2E
└── types/            # Tipos globais TypeScript
```

### Regras de Segurança (Invioláveis)

1. **RLS ativo em todas as tabelas** com dados de pacientes (`patients`, `visits`, `score_entries`, `monitoring_events`)
2. **PHI jamais vai para blockchain** — apenas `SHA-256(visit_id + timestamp + doctor_id)` é ancorando na Solana
3. **XSS**: Todo Markdown renderizado passa por `DOMPurify` + `rehype-sanitize`
4. **Redirecionamentos**: Toda navegação programática usa `safeRedirect.ts`
5. **Rotas privadas**: Envolver em `<ProtectedRoute>` — nunca expor páginas clínicas sem auth
6. **KYC médico**: Tiers `basic → verified → expert` validados via Sumsub antes de acesso a funcionalidades sensíveis

### Design System Multi-Especialidade

Cada especialidade tem um token CSS `--specialty-primary` injetado dinamicamente. O `SpecialtyQuickSwitcher` altera o estado global via `SpecialtyContext`. As 14 especialidades estão em `src/config/specialties.ts`.

Layout responsivo:
- **Desktop**: Sidebar fixa de 256px
- **Mobile**: `BottomNavBar` + `Sheet` (drawer lateral)

### Auth Gate nas Calculadoras

Usuários anônimos podem usar calculadoras. Ao tentar **salvar** um resultado, o hook `useLoginPrompt()` dispara `<LoginPromptDialog>` sem interromper a sessão de cálculo.

---

## Consequências

### Positivas
- Isolamento total de dados por médico via RLS
- Prova de integridade auditável e imutável para prontuários
- Motor matemático testável independentemente da UI
- Onboarding de contribuidores facilitado pela estrutura feature-based

### Negativas / Riscos
- Complexidade do módulo blockchain (Rust/Anchor) eleva a barreira de contribuição
- Zero cobertura de testes atual no motor matemático = **risco clínico crítico** (ver ADR-003)
- Bundle acima de 500kb sem `manualChunks` (ver ADR-002)

### Decisões Dependentes
- [ADR-002] Otimização de bundle Vite com `manualChunks`
- [ADR-003] Estratégia de testes para calculadoras clínicas (pendente)
- [ADR-004] Integração HL7 FHIR para interoperabilidade (roadmap)

---

## Referências
- [Documento Técnico Mestre UHS Health OS V2](../AGENTS.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
- Phoenix Sepsis Score 2024: Schlapbach et al., JAMA 2024
- Critérios McDonald 2024: Thompson et al., Lancet Neurol 2024
- MELD 3.0: Kim et al., Hepatology 2021
