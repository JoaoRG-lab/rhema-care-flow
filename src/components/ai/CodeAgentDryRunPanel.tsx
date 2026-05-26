import { useState } from 'react';
import { invokeEdgeFn } from '@/lib/invokeEdgeFn';

interface CodeAgentDryRunResult {
  success: boolean;
  dryRun: boolean;
  changed: boolean;
  repo?: string;
  baseBranch?: string;
  targetFile?: string;
  preview?: string;
  validation?: {
    changed: boolean;
    previousBytes: number;
    nextBytes: number;
  };
}

const DEFAULT_TARGET = 'src/pages/ReumatismosKnowledge.tsx';
const DEFAULT_INSTRUCTION = 'Melhore a clareza do texto preservando imports, rotas e estrutura do arquivo.';

export function CodeAgentDryRunPanel() {
  const [targetFile, setTargetFile] = useState(DEFAULT_TARGET);
  const [instruction, setInstruction] = useState(DEFAULT_INSTRUCTION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CodeAgentDryRunResult | null>(null);

  async function runDryRun() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error } = await invokeEdgeFn<CodeAgentDryRunResult>('code-editor-agent', {
        repo: 'JoaoRG-lab/rhema-care-flow',
        baseBranch: 'main',
        targetFile: targetFile.trim(),
        instruction: instruction.trim(),
        dryRun: true,
        createPullRequest: false,
      });

      if (error || !data) {
        setError(error ?? 'Falha ao executar code-editor-agent.');
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao executar dry-run.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-blue-900">Code Agent · dry-run seguro</h2>
          <p className="text-xs text-blue-700">
            Testa o backend de alteração de código sem criar branch, commit ou PR.
          </p>
        </div>
        <button
          type="button"
          onClick={runDryRun}
          disabled={loading || !targetFile.trim() || !instruction.trim()}
          className="mt-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300 sm:mt-0"
        >
          {loading ? 'Executando…' : 'Rodar dry-run'}
        </button>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <label className="block text-xs font-medium text-blue-900">
          Arquivo-alvo
          <input
            value={targetFile}
            onChange={(event) => setTargetFile(event.target.value)}
            className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-500"
            placeholder="src/pages/ReumatismosKnowledge.tsx"
          />
        </label>

        <label className="block text-xs font-medium text-blue-900">
          Instrução
          <input
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:border-blue-500"
            placeholder="Descreva a alteração desejada"
          />
        </label>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-3 space-y-2 rounded-lg border border-blue-100 bg-white p-3 text-xs text-gray-700">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-800">
              {result.changed ? 'alteração proposta' : 'sem alteração'}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">dry-run</span>
            {result.validation && (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                {result.validation.previousBytes} → {result.validation.nextBytes} bytes
              </span>
            )}
          </div>

          {result.preview && (
            <pre className="max-h-64 overflow-auto rounded-lg bg-gray-950 p-3 text-[11px] leading-relaxed text-gray-100">
              {result.preview}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}
