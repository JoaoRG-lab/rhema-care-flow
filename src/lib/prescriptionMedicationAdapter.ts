import type { Prescription, PrescriptionItem } from '../hooks/usePrescriptions';
import type { MedicationContext } from './prescriptionSafetyEngine';

export function prescriptionItemToMedication(item: PrescriptionItem): MedicationContext {
  return {
    name: item.drug,
    dose: item.dose || undefined,
    route: item.route || undefined,
    frequency: item.frequency || undefined,
  };
}

export function prescriptionToMedications(prescription: Prescription): MedicationContext[] {
  if (prescription.status === 'cancelled') return [];
  return (prescription.items ?? [])
    .filter((item) => item.drug?.trim())
    .map(prescriptionItemToMedication);
}

export function prescriptionsToMedications(prescriptions: Prescription[]): MedicationContext[] {
  const seen = new Set<string>();
  const result: MedicationContext[] = [];

  prescriptions.flatMap(prescriptionToMedications).forEach((medication) => {
    const key = [medication.name, medication.dose, medication.route, medication.frequency]
      .filter(Boolean)
      .join('|')
      .toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(medication);
    }
  });

  return result;
}
