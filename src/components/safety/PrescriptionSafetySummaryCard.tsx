import { usePrescriptionSafety } from '@/hooks/usePrescriptionSafety';

interface PrescriptionSafetySummaryCardProps {
  patientId?: string;
}

export function PrescriptionSafetySummaryCard({ patientId }: PrescriptionSafetySummaryCardProps) {
  const {
    medications,
    safetyAlerts,
    criticalSafetyCount,
    monitoringItemCount,
    criticalMonitoringCount,
    loading,
    lastError,
  } = usePrescriptionSafety(patientId);

  const tone = criticalSafetyCount > 0 || criticalMonitoringCount > 0
    ? 'border-red-100 bg-red-50 text-red-800'
    : safetyAlerts.length > 0 || monitoringItemCount > 0
      ? 'border-amber-100 bg-amber-50 text-amber-800'
      : 'border-emerald-100 bg-emerald-50 text-emerald-800';

  return (
    <section className={`rounded-2xl border p-4 shadow-sm ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">Prescription Safety</p>
          <h2 className="mt-1 text-lg font-bold">Segurança terapêutica</h2>
          <p className="mt-1 text-xs font-semibold">{medications.length} medicação(ões) em prescrições ativas</p>
        </div>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold">
          {criticalSafetyCount + criticalMonitoringCount} crítico(s)
        </span>
      </div>

      {loading && <p className="mt-3 text-xs opacity-80">Carregando prescrições…</p>}
      {lastError && <p className="mt-3 text-xs font-semibold">{lastError.message}</p>}

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-xs font-semibold opacity-75">Alertas</p>
          <p className="text-lg font-bold">{safetyAlerts.length}</p>
        </div>
        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-xs font-semibold opacity-75">Monitorizações</p>
          <p className="text-lg font-bold">{monitoringItemCount}</p>
        </div>
        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-xs font-semibold opacity-75">Críticos</p>
          <p className="text-lg font-bold">{criticalSafetyCount + criticalMonitoringCount}</p>
        </div>
      </div>

      {safetyAlerts.length > 0 && (
        <div className="mt-3 rounded-xl bg-white/70 p-3">
          <p className="text-xs font-bold">Principais alertas</p>
          <ul className="mt-2 space-y-1 text-xs">
            {safetyAlerts.slice(0, 4).map((alert) => <li key={alert.id}>• {alert.title}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
