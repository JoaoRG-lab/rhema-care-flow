import { evaluatePrescriptionSafety, type MedicationContext } from '../../lib/prescriptionSafetyEngine';

interface PrescriptionSafetyPanelProps {
  medications: MedicationContext[];
  protocolCompleted?: Record<string, boolean>;
  problemTitle?: string;
}

const severityClass = {
  info: 'border-blue-100 bg-blue-50 text-blue-800',
  warning: 'border-amber-100 bg-amber-50 text-amber-800',
  critical: 'border-red-100 bg-red-50 text-red-800',
};

const severityLabel = {
  info: 'Info',
  warning: 'Alerta',
  critical: 'Crítico',
};

export function PrescriptionSafetyPanel({ medications, protocolCompleted, problemTitle }: PrescriptionSafetyPanelProps) {
  const alerts = evaluatePrescriptionSafety({ medications, protocolCompleted, problemTitle });
  const criticalCount = alerts.filter((alert) => alert.severity === 'critical').length;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Prescription Safety Engine</p>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Segurança terapêutica</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${criticalCount > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{alerts.length} alerta(s)</span>
      </div>

      {medications.length === 0 ? (
        <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Nenhuma medicação informada para análise.</p>
      ) : alerts.length === 0 ? (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Nenhum alerta automático encontrado para as regras atuais.</p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <article key={alert.id} className={`rounded-2xl border p-4 ${severityClass[alert.severity]}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{alert.title}</p>
                  <p className="mt-1 text-xs leading-relaxed opacity-90">{alert.message}</p>
                </div>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold">{severityLabel[alert.severity]}</span>
              </div>
              {alert.requiredAction && <p className="mt-3 rounded-xl bg-white/70 p-2 text-xs font-semibold">Ação: {alert.requiredAction}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
