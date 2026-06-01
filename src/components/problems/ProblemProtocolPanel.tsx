import { useMemo } from 'react';
import { useProblemProtocolStatus } from '../../hooks/useProblemProtocolStatus';
import { getProtocolForProblem } from '../../lib/clinicalProtocolRegistry';
import type { ProblemInstance } from '../../types';

interface ProblemProtocolPanelProps {
  problem: ProblemInstance;
  patientId?: string;
}

const priorityClass = {
  routine: 'border-gray-100 bg-gray-50 text-gray-700',
  important: 'border-amber-100 bg-amber-50 text-amber-800',
  critical: 'border-red-100 bg-red-50 text-red-800',
};

const priorityLabel = {
  routine: 'Rotina',
  important: 'Importante',
  critical: 'Crítico',
};

export function ProblemProtocolPanel({ problem, patientId }: ProblemProtocolPanelProps) {
  const protocol = getProtocolForProblem(problem.template_id, problem.title);
  const { byItemId, loading, error, toggleItem } = useProblemProtocolStatus(patientId, problem.id);

  const stats = useMemo(() => {
    const items = protocol?.sections.flatMap((section) => section.items) ?? [];
    const completed = items.filter((item) => byItemId.get(item.id)?.completed).length;
    const criticalPending = items.filter((item) => item.priority === 'critical' && !byItemId.get(item.id)?.completed).length;
    const percent = items.length ? Math.round((completed / items.length) * 100) : 0;
    return { total: items.length, completed, criticalPending, percent };
  }, [protocol, byItemId]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Protocol Engine</p>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Protocolo clínico estruturado</h2>
        </div>
        {protocol && <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{stats.percent}%</span>}
      </div>

      {loading && <p className="mb-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Carregando checklist…</p>}
      {error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!protocol ? (
        <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Nenhum protocolo específico mapeado para este problema ainda.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-2 rounded-2xl bg-indigo-50 p-3 text-sm text-indigo-900 sm:grid-cols-3">
            <p><strong>{stats.completed}/{stats.total}</strong> concluídos</p>
            <p><strong>{stats.percent}%</strong> compliance</p>
            <p><strong>{stats.criticalPending}</strong> críticos pendentes</p>
          </div>
          <p className="rounded-2xl bg-gray-50 p-3 text-sm font-semibold text-gray-800">{protocol.title}</p>
          {protocol.sections.map((section) => (
            <article key={section.type} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/40">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{section.title}</h3>
              <div className="mt-3 space-y-2">
                {section.items.map((item) => {
                  const status = byItemId.get(item.id);
                  const completed = Boolean(status?.completed);
                  return (
                    <div key={item.id} className="rounded-xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input type="checkbox" checked={completed} disabled={!patientId} onChange={(event) => toggleItem(item.id, event.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                          <span>
                            <span className={`block text-sm font-semibold ${completed ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'}`}>{item.label}</span>
                            {item.note && <span className="mt-1 block text-xs leading-relaxed text-gray-500">{item.note}</span>}
                            {status?.completed_at && <span className="mt-1 block text-xs text-teal-700">Concluído em {new Date(status.completed_at).toLocaleDateString('pt-BR')}</span>}
                          </span>
                        </label>
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityClass[item.priority]}`}>{priorityLabel[item.priority]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
