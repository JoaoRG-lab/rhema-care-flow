import { DrugMonitoringPanel } from '@/components/safety/DrugMonitoringPanel';
import { PrescriptionSafetyPanel } from '@/components/safety/PrescriptionSafetyPanel';
import type { MedicationContext } from '@/lib/prescriptionSafetyEngine';
import type { Prescription } from '@/hooks/usePrescriptions';

interface PrescriptionSafetyReviewPanelProps {
  prescriptions: Prescription[];
  protocolCompleted?: Record<string, boolean>;
  problemTitle?: string;
}

export function PrescriptionSafetyReviewPanel({ prescriptions, protocolCompleted, problemTitle }: PrescriptionSafetyReviewPanelProps) {
  const medications: MedicationContext[] = prescriptions
    .filter((prescription) => prescription.status !== 'cancelled')
    .flatMap((prescription) => prescription.items ?? [])
    .filter((item) => Boolean(item?.drug))
    .map((item) => ({
      name: item.drug,
      dose: item.dose || undefined,
      route: item.route || undefined,
      frequency: item.frequency || undefined,
    }));

  return (
    <section className="space-y-4">
      <PrescriptionSafetyPanel medications={medications} protocolCompleted={protocolCompleted} problemTitle={problemTitle} />
      <DrugMonitoringPanel medications={medications} />
    </section>
  );
}
