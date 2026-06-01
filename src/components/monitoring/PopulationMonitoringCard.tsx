import { useMemo } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMonitoringEvents } from '@/hooks/useMonitoringEvents';

export function PopulationMonitoringCard() {
  const { events, loading } = useMonitoringEvents();

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const pending = events.filter((event) => event.status !== 'completed' && !event.completed_at);
    const overdue = pending.filter((event) => event.due_date < today);
    const upcoming30 = pending.filter((event) => event.due_date >= today && event.due_date <= in30);
    const completed = events.filter((event) => event.status === 'completed' || event.completed_at);
    const patientsWithOverdue = new Set(overdue.map((event) => event.patient_card_id).filter(Boolean)).size;
    return { total: events.length, pending: pending.length, overdue: overdue.length, upcoming30: upcoming30.length, completed: completed.length, patientsWithOverdue };
  }, [events]);

  return (
    <section className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm dark:border-orange-950 dark:from-orange-950/30 dark:to-gray-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Population Monitoring</p>
          <h2 className="mt-1 text-lg font-bold text-gray-950 dark:text-gray-100">Governança de monitorização</h2>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Visão populacional dos eventos de monitorização cadastrados.</p>
        </div>
        <Link to="/therapeutic-safety" className="rounded-full bg-white px-3 py-1 text-xs font-bold text-orange-700 shadow-sm hover:underline dark:bg-gray-900">
          Abrir segurança →
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-orange-100/60 dark:bg-gray-800" />)}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric icon={<AlertTriangle className="h-4 w-4" />} label="Vencidos" value={summary.overdue} tone="text-red-700 bg-red-50" />
          <Metric icon={<Users className="h-4 w-4" />} label="Pacientes com vencidos" value={summary.patientsWithOverdue} tone="text-red-700 bg-red-50" />
          <Metric icon={<CalendarClock className="h-4 w-4" />} label="Próx. 30 dias" value={summary.upcoming30} tone="text-amber-700 bg-amber-50" />
          <Metric icon={<CalendarClock className="h-4 w-4" />} label="Pendentes" value={summary.pending} tone="text-orange-700 bg-orange-50" />
          <Metric icon={<CheckCircle2 className="h-4 w-4" />} label="Concluídos" value={summary.completed} tone="text-emerald-700 bg-emerald-50" />
        </div>
      )}
    </section>
  );
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl bg-white/80 p-3 shadow-sm dark:bg-gray-900/70">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>{icon}</div>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold tabular-nums text-gray-950 dark:text-gray-100">{value}</p>
    </div>
  );
}
