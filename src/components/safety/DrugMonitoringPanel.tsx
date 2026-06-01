import { evaluateDrugMonitoring, type MonitoringSeverity } from '../../lib/drugMonitoringEngine';
import type { MedicationContext } from '../../lib/prescriptionSafetyEngine';

interface DrugMonitoringPanelProps {
  medications: MedicationContext[];
}

const severityClass: Record<MonitoringSeverity, string> = {
  routine: 'border-gray-100 bg-gray-50 text-gray-700',
  soon: 'border-amber-100 bg-amber-50 text-amber-800',
  overdue: 'border-orange-100 bg-orange-50 text-orange-800',
  critical: 'border-red-100 bg-red-50 text-red-800',
};

const severityLabel: Record<MonitoringSeverity, string> = {
  routine: 'Rotina',
  soon: 'Acompanhar',
  overdue: 'Vencido',
  critical: 'Crítico',
};

export function DrugMonitoringPanel({ medications }: DrugMonitoringPanelProps) {
  const results = evaluateDrugMonitoring(medications);
  const total = results.reduce((sum, result) => sum + result.requirements.length, 0);
  const critical = results.reduce((sum, result) => sum + result.requirements.filter((item) => item.severity === 'critical').length, 0);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Drug Monitoring Engine</p>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Monitorização medicamentosa</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${critical > 0 ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>{total} item(ns)</span>
      </div>

      {medications.length === 0 ? (
        <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Nenhuma medicação ativa para monitorização.</p>
      ) : results.length === 0 ? (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Nenhuma regra específica de monitorização encontrada para as medicações atuais.</p>
      ) : (
        <div className="space-y-3">
          {results.map((result) => (
            <article key={result.medication} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950/40">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{result.medication}</h3>
              <div className="mt-3 space-y-2">
                {result.requirements.map((requirement) => (
                  <div key={`${result.medication}-${requirement.id}`} className={`rounded-xl border p-3 ${severityClass[requirement.severity]}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">{requirement.label}</p>
                        <p className="mt-1 text-xs leading-relaxed opacity-90">{requirement.rationale}</p>
                        {requirement.intervalDays && <p className="mt-1 text-xs font-semibold opacity-80">Intervalo sugerido: {requirement.intervalDays} dias</p>}
                      </div>
                      <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold">{severityLabel[requirement.severity]}</span>
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
