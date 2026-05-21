/**
 * useCodeAuditor — IA Auditora de Código
 * Agente especializado em revisar código TypeScript/React,
 * detectar problemas de segurança, imports quebrados, padrões ruins.
 *
 * Modelo: Qwen/Qwen2.5-Coder-32B-Instruct (melhor para código)
 * Fallback: HuggingFaceH4/zephyr-7b-beta
 */

import { useState, useCallback, useRef } from 'react';

const HF_API = 'https://api-inference.huggingface.co/models';
const AUDITOR_MODEL =
  import.meta.env.VITE_HF_AUDITOR_MODEL ??
  'Qwen/Qwen2.5-Coder-32B-Instruct';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface AuditFinding {
  file: string;
  line?: number;
  severity: Severity;
  category: 'security' | 'broken-import' | 'missing-file' | 'bad-pattern' | 'type-error' | 'performance';
  description: string;
  suggestion: string;
  autoFixable: boolean;
}

export interface AuditReport {
  passed: boolean;
  score: number; // 0-100
  findings: AuditFinding[];
  summary: string;
  timestamp: string;
}

const AUDITOR_SYSTEM = `Você é um auditor de código sênior especializado em TypeScript, React e Vite.
Sua função é analisar código e retornar APENAS um JSON válido no seguinte formato:
{
  "passed": boolean,
  "score": number (0-100),
  "findings": AuditFinding[],
  "summary": string
}

Critérios de avaliação:
- passed = true apenas se score >= 80 e nenhum finding 'critical' ou 'high'
- Verifique: imports quebrados, hooks mal-usados, ausência de ErrorBoundary,
  secrets hardcoded, ausência de tratamento de erro, chamadas de API sem abort,
  componentes sem tipos, funções com mais de 50 linhas sem decomposição.
- Seja preciso e cirúrgico. Não repita o código, apenas aponte o problema e a solução.
- Responda APENAS com o JSON. Nenhum texto adicional.`;

export function useCodeAuditor() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const audit = useCallback(async (
    code: string,
    filename = 'unknown.tsx'
  ): Promise<AuditReport> => {
    const token = import.meta.env.VITE_HF_TOKEN;
    if (!token) {
      const msg = 'VITE_HF_TOKEN não configurado.';
      setError(msg);
      return { passed: false, score: 0, findings: [], summary: msg, timestamp: new Date().toISOString() };
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${HF_API}/${AUDITOR_MODEL}/v1/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          model: AUDITOR_MODEL,
          messages: [
            { role: 'system', content: AUDITOR_SYSTEM },
            { role: 'user', content: `Arquivo: ${filename}\n\n\`\`\`tsx\n${code}\n\`\`\`` },
          ],
          max_tokens: 1024,
          temperature: 0.1, // baixo para respostas determinísticas
          stream: false,
        }),
      });

      if (!response.ok) throw new Error(`HF API ${response.status}: ${await response.text()}`);

      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      const raw = data.choices?.[0]?.message?.content ?? '{}';

      // Extrai JSON mesmo se houver markdown code fence
      const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) ?? raw.match(/({[\s\S]*})/);
      const parsed: Omit<AuditReport, 'timestamp'> = jsonMatch
        ? JSON.parse(jsonMatch[1] ?? jsonMatch[0])
        : { passed: false, score: 0, findings: [], summary: 'Falha ao parsear resposta da IA' };

      const result: AuditReport = { ...parsed, timestamp: new Date().toISOString() };
      setReport(result);
      return result;
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return { passed: false, score: 0, findings: [], summary: 'Cancelado', timestamp: new Date().toISOString() };
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      return { passed: false, score: 0, findings: [], summary: msg, timestamp: new Date().toISOString() };
    } finally {
      setLoading(false);
    }
  }, []);

  return { audit, report, loading, error };
}
