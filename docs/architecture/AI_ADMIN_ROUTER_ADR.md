# ADR — AI Admin Router / Multi-Agent Control Plane

## Status
Proposto

## Contexto
Uma branch legada (`fix/ai-admin-connectors`) continha a ideia de um plano de controle de IA para administradores com:
- `ai-admin-router`
- `openai-chat`
- `grok-chat`

A implementação estava >200 commits atrás e não deve ser portada diretamente para produção.

## Ideia arquitetural válida
Criar um control plane autenticado para administradores com:
- provider routing (`openai`, `xai/grok`, futuros `anthropic`, `perplexity`)
- allowlist de modelos por papel
- admin-only privileged routing
- streaming opcional
- auditoria de uso
- rate limiting por usuário/endpoint
- segregação entre chat público e chat operacional

## Não portar da branch legada
Não reutilizar diretamente:
- CORS `*`
- dependências remotas antigas sem pinning estratégico
- acoplamento implícito a RPCs não auditadas (`check_rate_limit`)
- trust em metadata de role sem revisão de auth policy

## Caminho recomendado
Fase 1:
- manter `ai-assistant` público como endpoint educativo
- manter providers externos desacoplados

Fase 2:
- implementar `ai-admin-router` novo em branch limpa
- auth baseada em Supabase JWT validado
- provider abstraction layer
- audit log
- quotas
- observability

## Fonte conceitual
Branch histórica: `fix/ai-admin-connectors`

## Decisão
Preservar a arquitetura como ADR; não mergear runtime legado.
