import type { ProblemInstance } from '../../types';

interface ProblemListPanelProps {
  problems: ProblemInstance[];
  loading?: boolean;
  error?: string | null;
  onSelect?: (problem: ProblemInstance) => void;
}

const statusLabel: Record<ProblemInstance['status'], string> = {
  active: 'Ativo',
  controlled: 'Controlado',
  monitoring: 'Monitorando',
  resolved: 'Resolvido',
  uncertain: 'Incerto',
};

const severityClass: Record<ProblemInstance['severity'], string> = {
  low: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  moderate: 'border-amber-100 bg-amber-50 text-amber-800',
  high: 'border-orange-100 bg-orange-50 text-orange-800',
  critical: 'border-red-100 bg-red-50 text-red-800',
};

export function ProblemListPanel({ problems, loading, error, onSelect }: ProblemListPanelProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">POMR</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Problemas clínicos</h2>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{problems.length}</span>
      </div>
      {loading && <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Carregando problemas…</p>}
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!loading && !error && problems.length === 0 && <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Nenhum problema clínico registrado ainda.</p>}
      <div className="space-y-3">
        {problems.map((problem) => (
          <button key={problem.id} type="button" onClick={() => onSelect?.(problem)} className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left transition hover:border-teal-200 hover:bg-teal-50 dark:border-gray-800 dark:bg-gray-950/40">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{problem.title}</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{problem.specialty}</p>
                {problem.summary && <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">{problem.summary}</p>}
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">{statusLabel[problem.status]}</span>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${severityClass[problem.severity]}`}>{problem.severity}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
