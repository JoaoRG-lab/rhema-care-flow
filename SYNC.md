# Sync Log

## 2026-04-26 — Teleconsulta + Memed

### Teleconsulta
- `VideoRoom.tsx` — sala de vídeo via Jitsi Meet (gratuito) com fallback Daily.co
- `TeleconsultaRoom.tsx` — integra VideoRoom + painel Memed lateral
- `useTeleconsulta.ts` — `createDailyRoom` retorna null sem API key (sem URL falsa)

### Prescrição Digital Memed
- `useMemedPrescription.ts` — token obtido automaticamente via Edge Function `memed-token`
- `MemedPrescriptionPanel.tsx` — UX sem input manual quando token automático disponível
- `supabase/functions/memed-token/` — Edge Function deployada (MEMED_API_KEY configurada)
- `supabase/migrations/20260426_memed_users.sql` — tabela `memed_users` com RLS
