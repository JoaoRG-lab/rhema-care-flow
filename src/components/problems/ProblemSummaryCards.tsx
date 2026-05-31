import type { ProblemInstance } from '../../types';

interface ProblemSummaryCardsProps {
  problems: ProblemInstance[];
}

function Card({ label, value, helper, tone }: { label: string; value: string | number; helper: string; tone: 'teal' | 'amber' | 'red' | 'gray' }) {
  const toneClass = {
    teal: 'border-teal-100 bg-teal-50 text-teal-800',
    amber: 'border-amber-100 bg-amber-50 text-amber-800',
    red: 'border-red-100 bg-red-50 text-red-800',
    gray: 'border-gray-100 bg-gray-50 text-gray-700',
  }[tone];

  return (
    <article className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-relaxed opacity-80">{helper}</p>
    </article>
  );
}

export function ProblemSummaryCards({ problems }: ProblemSummaryCardsProps) {
  const active = problems.filter((problem) => problem.status === 'active').length;
  const critical = problems.filter((problem) => problem.severity === 'critical' || problem.severity === 'high').length;
  const controlled = problems.filter((problem) => problem.status === 'controlled').length;
  const safetyFlags = problems.reduce((count, problem) => count + (problem.safety_flags?.length ?? 0), 0);

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card label="Problemas ativos" value={active} helper="Demandam seguimento e plano longitudinal." tone="teal" />
      <Card label="Alta gravidade" value={critical} helper="High/critical: priorizar risco e segurança." tone="red" />
      <Card label="Controlados" value={controlled} helper="Manter metas e monitorização." tone="gray" />
      <Card label="Alertas de segurança" value={safetyFlags} helper="Flags terapêuticas acumuladas nos problemas." tone="amber" />
    </section>
  );
}
