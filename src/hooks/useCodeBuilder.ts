/**
 * useCodeBuilder — IA Construtora de Código
 * Agente especializado em gerar código TypeScript/React faltante,
 * corrigir imports quebrados e preencher gaps de solidez.
 *
 * Modelo: Qwen/Qwen2.5-Coder-32B-Instruct
 */

import { useState, useCallback, useRef } from 'react';
import type { AuditFinding } from './useCodeAuditor';

const HF_API = 'https://api-inference.huggingface.co/models';
const BUILDER_MODEL =
  import.meta.env.VITE_HF_BUILDER_MODEL ??
  'Qwen/Qwen2.5-Coder-32B-Instruct';

export interface BuildResult {
  filename: string;
  code: string;
  explanation: string;
  fixedFindings: string[]; // IDs/descrições dos findings resolvidos
}

const BUILDER_SYSTEM = `Você é um engenheiro de software sênior especializado em TypeScript, React 18, Vite e Supabase.
Sua função é CONSTRUIR ou CORRIGIR código com base nos problemas encontrados.

Regras obrigatórias:
1. Retorne APENAS um JSON válido no formato:
   { "filename": string, "code": string, "explanation": string, "fixedFindings": string[] }
2. O código deve ser TypeScript correto, com tipos explícitos.
3. Use @/contexts/AuthContext para auth — NUNCA ./hooks/useAuth.
4. Use @/integrations/supabase/client para o cliente Supabase.
5. Sempre inclua tratamento de erro com try/catch.
6. Componentes React: sempre exportar como named export.
7. Hooks: sempre começar com 'use', retornar objeto tipado.
8. Responda APENAS com o JSON. Nenhum texto adicional.`;

export function useCodeBuilder() {
  const [result, setResult] = useState<BuildResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const build = useCallback(async (
    description: string,
    findings?: AuditFinding[],
    existingCode?: string
  ): Promise<BuildResult> => {
    const token = import.meta.env.VITE_HF_TOKEN;
    if (!token) {
      const msg = 'VITE_HF_TOKEN não configurado.';
      setError(msg);
      return { filename: '', code: '', explanation: msg, fixedFindings: [] };
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);

    const findingsText = findings?.length
      ? `\n\nProblemas a resolver:\n${findings.map((f, i) =>
          `${i + 1}. [${f.severity.toUpperCase()}] ${f.file} — ${f.description}\n   Sugestão: ${f.suggestion}`
        ).join('\n')}`
      : '';

    const codeContext = existingCode
      ? `\n\nCódigo atual:\n\`\`\`tsx\n${existingCode}\n\`\`\`` 
      : '';

    try {
      const response = await fetch(`${HF_API}/${BUILDER_MODEL}/v1/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          model: BUILDER_MODEL,
          messages: [
            { role: 'system', content: BUILDER_SYSTEM },
            { role: 'user', content: `Tarefa: ${description}${findingsText}${codeContext}` },
          ],
          max_tokens: 2048,
          temperature: 0.2,
          stream: false,
        }),
      });

      if (!response.ok) throw new Error(`HF API ${response.status}: ${await response.text()}`);

      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      const raw = data.choices?.[0]?.message?.content ?? '{}';

      const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) ?? raw.match(/({[\s\S]*})/);
      const parsed: BuildResult = jsonMatch
        ? JSON.parse(jsonMatch[1] ?? jsonMatch[0])
        : { filename: 'generated.tsx', code: raw, explanation: 'Código gerado sem metadados', fixedFindings: [] };

      setResult(parsed);
      return parsed;
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return { filename: '', code: '', explanation: 'Cancelado', fixedFindings: [] };
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      return { filename: '', code: '', explanation: `Erro: ${msg}`, fixedFindings: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  return { build, result, loading, error };
}
