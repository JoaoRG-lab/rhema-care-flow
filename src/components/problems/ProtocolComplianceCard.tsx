import { useMemo } from 'react';
import { useProblemProtocolStatus } from '../../hooks/useProblemProtocolStatus';
import { getProtocolForProblem } from '../../lib/clinicalProtocolRegistry';
import type { ProblemInstance } from '../../types';

interface ProtocolComplianceCardProps {
  problem: ProblemInstance;
  patientId: string;
}

function tone(percent: number, criticalPending: number) {
  if (criticalPending > 0 || percent < 70) return 'border-red-100 bg-red-50 text-red-800';
  if (percent < 90) return 'border-amber-100 bg-amber-50 text-amber-800';
  return 'border-emerald-100 bg-emerald-50 text-emerald-800';
}

export function ProtocolComplianceCard({ problem, patientId }: ProtocolComplianceCardProps) {
  const protocol = getProtocolForProblem(problem.template_id, problem.title);
  const { byItemId, loading, error } = useProblemProtocolStatus(patientId, problem.id);

  const stats = useMemo(() => {
    const items = protocol?.sections.flatMap((section) => section.items) ?? [];
    const completed = items.filter((item) => byItemId.get(item.id)?.completed).length;
    const pendingCritical = items.filter((item) => item.priority === 'critical' && !byItemId.get(item.id)?.completed);
    const percent = items.length ? Math.round((completed / items.length) * 100) : 0;
    return { total: items.length, completed, pendingCritical, percent };
  }, [protocol, byItemId]);

  if (!protocol) return null;

  return (
    <section className={`rounded-2xl border p-4 shadow-sm ${tone(stats.percent, stats.pendingCritical.length)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">Protocol Compliance</p>
          <h2 className="mt-1 text-lg font-bold">{stats.percent}%</h2>
          <p className="mt-1 text-xs font-semibold">{stats.completed}/{stats.total} itens concluídos</p>
        </div>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">{stats.pendingCritical.length} críticos</span>
      </div>
      {loading && <p className="mt-3 text-xs opacity-80">Carregando checklist…</p>}
      {error && <p className="mt-3 text-xs font-semibold">{error}</p>}
      {stats.pendingCritical.length > 0 && (
        <div className="mt-3 rounded-xl bg-white/70 p-3">
          <p className="text-xs font-bold">Críticos pendentes</p>
          <ul className="mt-2 space-y-1 text-xs">
            {stats.pendingCritical.slice(0, 4).map((item) => <li key={item.id}>• {item.label}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
