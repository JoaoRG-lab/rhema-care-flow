import { useState } from 'react';
import { invokeEdgeFn } from '@/lib/invokeEdgeFn';

interface CodeAgentResult {
  success: boolean;
  dryRun: boolean;
  changed: boolean;
  repo?: string;
  baseBranch?: string;
  branch?: string;
  targetFile?: string;
  preview?: string;
  fileUrl?: string;
  commit?: { sha: string; html_url: string };
  pullRequest?: { number: number; html_url: string } | null;
  validation?: {
    changed: boolean;
    previousBytes: number;
    nextBytes: number;
  };
}

const DEFAULT_TARGET = 'src/pages/ReumatismosKnowledge.tsx';
const DEFAULT_INSTRUCTION = 'Melhore a clareza do texto preservando imports, rotas e estrutura do arquivo.';
const CONFIRM_TEXT = 'CRIAR PR';

export function CodeAgentDryRunPanel() {
  const [targetFile, setTargetFile] = useState(DEFAULT_TARGET);
  const [instruction, setInstruction] = useState(DEFAULT_INSTRUCTION);
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState<'dry-run' | 'draft-pr' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CodeAgentResult | null>(null);

  async function runAgent(mode: 'dry-run' | 'draft-pr') {
    setLoading(mode);
    setError(null);
    setResult(null);

    try {
      const createsDraftPr = mode === 'draft-pr';
      if (createsDraftPr && confirmation.trim() !== CONFIRM_TEXT) {
        setError(`Digite ${CONFIRM_TEXT} para liberar a criação de um PR rascunho.`);
        return;
      }

      const { data, error } = await invokeEdgeFn<CodeAgentResult>('code-editor-agent', {
        repo: 'JoaoRG-lab/rhema-care-flow',
        baseBranch: 'main',
        targetFile: targetFile.trim(),
        instruction: instruction.trim(),
        dryRun: !createsDraftPr,
        createPullRequest: createsDraftPr,
      });

      if (error || !data) {
        setError(error ?? 'Falha ao executar code-editor-agent.');
        return;
      }

      setResult(data);
      if (data.pullRequest?.html_url) setConfirmation('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao executar a ação.');
    } finally {
      setLoading(null);
    }
  }

  const canRun = Boolean(targetFile.trim() && instruction.trim() && !loading);
  const canCreateDraftPr = canRun && confirmation.trim() === CONFIRM_TEXT;

  return (
    <section className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-blue-900">Code Agent · revisão segura</h2>
          <p className="text-xs text-blue-700">
            Primeiro testa em dry-run. Depois pode criar uma branch e um PR rascunho para revisão, sem merge automático.
          </p>
        </div>
        <button
          type="button"
          onClick={() => runAgent('dry-run')}
          disabled={!canRun}
          className="mt-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300 sm:mt-0"
        >
          {loading === 'dry-run' ? 'Executando…' : 'Rodar dry-run'}
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

      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <label className="block flex-1 text-xs font-medium text-amber-900">
            Confirmação para criar PR rascunho
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:border-amber-500"
              placeholder={`Digite ${CONFIRM_TEXT}`}
            />
          </label>
          <button
            type="button"
            onClick={() => runAgent('draft-pr')}
            disabled={!canCreateDraftPr}
            className="rounded-lg bg-amber-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:bg-amber-300"
          >
            {loading === 'draft-pr' ? 'Criando PR…' : 'Criar draft PR'}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-amber-800">
          Segurança: essa ação cria branch e PR rascunho. Ela não faz merge e não altera a main diretamente.
        </p>
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
            <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
              {result.dryRun ? 'dry-run' : 'draft PR'}
            </span>
            {result.branch && (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">{result.branch}</span>
            )}
            {result.validation && (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                {result.validation.previousBytes} → {result.validation.nextBytes} bytes
              </span>
            )}
          </div>

          {result.pullRequest?.html_url && (
            <a
              href={result.pullRequest.html_url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              Abrir PR rascunho #{result.pullRequest.number}
            </a>
          )}

          {result.commit?.html_url && (
            <a
              href={result.commit.html_url}
              target="_blank"
              rel="noreferrer noopener"
              className="ml-2 inline-flex rounded-lg bg-gray-700 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
            >
              Abrir commit
            </a>
          )}

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
