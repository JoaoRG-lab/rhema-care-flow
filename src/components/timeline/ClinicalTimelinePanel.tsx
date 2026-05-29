import type { ClinicalTimelineEvent } from '../../hooks/useClinicalTimeline';

interface ClinicalTimelinePanelProps {
  events: ClinicalTimelineEvent[];
  loading?: boolean;
  error?: string | null;
}

const EVENT_LABELS: Record<ClinicalTimelineEvent['event_type'], string> = {
  score: 'Score',
  prescription: 'Prescrição',
  safety: 'Segurança',
  visit: 'Visita',
  note: 'Nota',
};

const EVENT_CLASS: Record<ClinicalTimelineEvent['event_type'], string> = {
  score: 'bg-purple-50 text-purple-800 border-purple-100',
  prescription: 'bg-teal-50 text-teal-800 border-teal-100',
  safety: 'bg-amber-50 text-amber-800 border-amber-100',
  visit: 'bg-blue-50 text-blue-800 border-blue-100',
  note: 'bg-gray-50 text-gray-700 border-gray-100',
};

export function ClinicalTimelinePanel({ events, loading, error }: ClinicalTimelinePanelProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Timeline longitudinal</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Eventos clínicos integrados</h2>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{events.length}</span>
      </div>

      {loading && <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Carregando timeline…</p>}
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!loading && !error && events.length === 0 && <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Sem eventos clínicos registrados ainda.</p>}

      <div className="space-y-3">
        {events.map((event) => (
          <article key={event.id} className="relative rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/40">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${EVENT_CLASS[event.event_type]}`}>{EVENT_LABELS[event.event_type]}</span>
                <h3 className="mt-2 text-sm font-bold text-gray-900 dark:text-gray-100">{event.title}</h3>
                {event.description && <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">{event.description}</p>}
              </div>
              <time className="text-xs text-gray-400" dateTime={event.created_at}>{new Date(event.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</time>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
