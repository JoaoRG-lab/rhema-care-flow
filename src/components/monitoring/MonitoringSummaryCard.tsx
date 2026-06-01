import { useMemo } from 'react';
import { CalendarClock, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useMonitoringEvents } from '@/hooks/useMonitoringEvents';

interface MonitoringSummaryCardProps {
  patientId?: string;
}

export function MonitoringSummaryCard({ patientId }: MonitoringSummaryCardProps) {
  const { events, loading } = useMonitoringEvents({ patientId });

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const pending = events.filter((event) => event.status !== 'completed' && !event.completed_at);
    const overdue = pending.filter((event) => event.due_date < today);
    const upcoming30 = pending.filter((event) => event.due_date >= today && event.due_date <= in30);
    const completed = events.filter((event) => event.status === 'completed' || event.completed_at);
    return { total: events.length, pending: pending.length, overdue: overdue.length, upcoming30: upcoming30.length, completed: completed.length };
  }, [events]);

  const tone = summary.overdue > 0
    ? 'border-red-100 bg-red-50 text-red-800'
    : summary.upcoming30 > 0
      ? 'border-amber-100 bg-amber-50 text-amber-800'
      : 'border-emerald-100 bg-emerald-50 text-emerald-800';

  return (
    <section className={`rounded-2xl border p-4 shadow-sm ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">Monitoring Dashboard</p>
          <h2 className="mt-1 text-lg font-bold">Monitorização</h2>
          <p className="mt-1 text-xs font-semibold">{summary.total} evento(s) registrados</p>
        </div>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">{summary.overdue} vencido(s)</span>
      </div>

      {loading && <p className="mt-3 text-xs opacity-80">Carregando monitorizações…</p>}

      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <div className="rounded-xl bg-white/70 p-3">
          <AlertTriangle className="mb-1 h-4 w-4" />
          <p className="text-xs font-semibold opacity-75">Vencidos</p>
          <p className="text-lg font-bold">{summary.overdue}</p>
        </div>
        <div className="rounded-xl bg-white/70 p-3">
          <Clock className="mb-1 h-4 w-4" />
          <p className="text-xs font-semibold opacity-75">30 dias</p>
          <p className="text-lg font-bold">{summary.upcoming30}</p>
        </div>
        <div className="rounded-xl bg-white/70 p-3">
          <CalendarClock className="mb-1 h-4 w-4" />
          <p className="text-xs font-semibold opacity-75">Pendentes</p>
          <p className="text-lg font-bold">{summary.pending}</p>
        </div>
        <div className="rounded-xl bg-white/70 p-3">
          <CheckCircle2 className="mb-1 h-4 w-4" />
          <p className="text-xs font-semibold opacity-75">Concluídos</p>
          <p className="text-lg font-bold">{summary.completed}</p>
        </div>
      </div>
    </section>
  );
}
