import { getProtocolForProblem } from '../../lib/clinicalProtocolRegistry';
import type { ProblemInstance } from '../../types';

interface ProblemProtocolPanelProps {
  problem: ProblemInstance;
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

export function ProblemProtocolPanel({ problem }: ProblemProtocolPanelProps) {
  const protocol = getProtocolForProblem(problem.template_id, problem.title);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Protocol Engine</p>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Protocolo clínico estruturado</h2>
        </div>
        {protocol && <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{protocol.sections.length}</span>}
      </div>

      {!protocol ? (
        <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Nenhum protocolo específico mapeado para este problema ainda.</p>
      ) : (
        <div className="space-y-4">
          <p className="rounded-2xl bg-indigo-50 p-3 text-sm font-semibold text-indigo-900">{protocol.title}</p>
          {protocol.sections.map((section) => (
            <article key={section.type} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/40">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{section.title}</h3>
              <div className="mt-3 space-y-2">
                {section.items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.label}</p>
                        {item.note && <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.note}</p>}
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityClass[item.priority]}`}>{priorityLabel[item.priority]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
