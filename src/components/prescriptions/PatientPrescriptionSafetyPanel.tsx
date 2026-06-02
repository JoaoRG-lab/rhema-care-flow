import { useEffect, useMemo } from 'react';
import { DrugMonitoringPanel } from '@/components/safety/DrugMonitoringPanel';
import { PrescriptionSafetyPanel } from '@/components/safety/PrescriptionSafetyPanel';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import type { MedicationContext } from '@/lib/prescriptionSafetyEngine';

interface PatientPrescriptionSafetyPanelProps {
  patientId: string;
  protocolCompleted?: Record<string, boolean>;
  problemTitle?: string;
}

export function PatientPrescriptionSafetyPanel({ patientId, protocolCompleted, problemTitle }: PatientPrescriptionSafetyPanelProps) {
  const { prescriptions, loading, lastError, fetchPrescriptions } = usePrescriptions(patientId);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const medications = useMemo<MedicationContext[]>(() => prescriptions
    .filter((prescription) => prescription.status !== 'cancelled')
    .flatMap((prescription) => prescription.items ?? [])
    .filter((item) => Boolean(item?.drug))
    .map((item) => ({
      name: item.drug,
      dose: item.dose || undefined,
      route: item.route || undefined,
      frequency: item.frequency || undefined,
    })), [prescriptions]);

  return (
    <section className="space-y-4">
      {loading && <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Carregando prescrições para análise de segurança…</p>}
      {lastError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{lastError.message}</p>}
      <PrescriptionSafetyPanel medications={medications} protocolCompleted={protocolCompleted} problemTitle={problemTitle} />
      <DrugMonitoringPanel medications={medications} />
    </section>
  );
}
