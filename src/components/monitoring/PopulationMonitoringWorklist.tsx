import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useMonitoringEvents } from '@/hooks/useMonitoringEvents';

export function PopulationMonitoringWorklist() {
  const { events, loading, markComplete } = useMonitoringEvents();

  const overdue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events
      .filter((event) => event.status !== 'completed' && !event.completed_at && event.due_date < today)
      .slice(0, 8);
  }, [events]);

  return (
    <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm dark:border-red-950 dark:bg-gray-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Overdue Worklist</p>
          <h2 className="mt-1 text-lg font-bold text-gray-950 dark:text-gray-100">Monitorizações vencidas</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Primeiros eventos pendentes por data de vencimento.</p>
        </div>
        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">{overdue.length}</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}
        </div>
      ) : overdue.length === 0 ? (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          Nenhuma monitorização vencida no momento.
        </div>
      ) : (
        <div className="space-y-2">
          {overdue.map((event) => {
            const patientCode = event.patient_cards?.patient_code ?? 'Paciente';
            return (
              <article key={event.id} className="rounded-xl border border-red-100 bg-red-50/70 p-3 dark:border-red-950 dark:bg-red-950/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                      {event.patient_card_id ? (
                        <Link to={`/patients/${event.patient_card_id}`} className="truncate text-sm font-bold text-red-900 hover:underline dark:text-red-200">
                          {patientCode}
                        </Link>
                      ) : (
                        <span className="truncate text-sm font-bold text-red-900 dark:text-red-200">Sem paciente vinculado</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-semibold text-red-800 dark:text-red-300">{event.event_type} · vencido em {event.due_date}</p>
                    {event.notes && <p className="mt-1 line-clamp-2 text-xs text-red-700/80 dark:text-red-300/80">{event.notes}</p>}
                  </div>
                  <button
                    onClick={() => markComplete(event.id)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-bold text-red-700 shadow-sm hover:bg-red-100 dark:bg-gray-900 dark:text-red-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Concluir
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
