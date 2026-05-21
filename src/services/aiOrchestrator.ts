/**
 * aiOrchestrator — Orquestrador Central das IAs
 *
 * Ponto único de entrada para usar os 3 agentes:
 *   - CodeAuditor:   revisa código existente
 *   - CodeBuilder:   constrói código faltante
 *   - StateMachine:  executa o ciclo completo automaticamente
 *
 * Também expõe createGitHubIssue() para reportar resultados
 * via Supabase Edge Function (mantém o token do GitHub no servidor).
 */

import { supabase } from '@/integrations/supabase/client';

export interface OrchestratorIssuePayload {
  title: string;
  body: string;
  labels?: string[];
}

/**
 * Cria um GitHub Issue via Supabase Edge Function.
 * O token GITHUB_TOKEN deve estar nos secrets da Edge Function,
 * nunca exposto no frontend.
 *
 * Edge Function esperada: /functions/v1/create-github-issue
 * Payload: { title, body, labels }
 */
export async function createGitHubIssue(
  payload: OrchestratorIssuePayload
): Promise<{ url: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('create-github-issue', {
      body: payload,
    });

    if (error) throw error;
    return { url: data?.html_url ?? null, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao criar issue';
    console.error('[aiOrchestrator] createGitHubIssue:', msg);
    return { url: null, error: msg };
  }
}

/**
 * Gera título padronizado para issues de IA
 */
export function buildIssueTitle(
  filename: string,
  passed: boolean,
  score: number
): string {
  const status = passed ? '✅ Aprovado' : '❌ Reprovado';
  return `[AI Report] ${status} — ${filename} (score: ${score}/100)`;
}

/**
 * Labels padrão por status do ciclo
 */
export function getIssueLabels(passed: boolean, score: number): string[] {
  const base = ['ai-report', 'auto-generated'];
  if (!passed) base.push('needs-review');
  if (score < 50) base.push('critical');
  else if (score < 80) base.push('improvement-needed');
  else base.push('passed');
  return base;
}
