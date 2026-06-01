import { useEffect, useMemo } from 'react';
import { evaluateDrugMonitoring } from '@/lib/drugMonitoringEngine';
import { prescriptionsToMedications } from '@/lib/prescriptionMedicationAdapter';
import { evaluatePrescriptionSafety } from '@/lib/prescriptionSafetyEngine';
import { usePrescriptions } from './usePrescriptions';

export function usePrescriptionSafety(patientId?: string) {
  const { prescriptions, loading, lastError, fetchPrescriptions } = usePrescriptions(patientId);

  useEffect(() => {
    if (patientId) fetchPrescriptions();
  }, [patientId, fetchPrescriptions]);

  const medications = useMemo(() => prescriptionsToMedications(prescriptions), [prescriptions]);

  const safetyAlerts = useMemo(
    () => evaluatePrescriptionSafety({ medications }),
    [medications],
  );

  const monitoringResults = useMemo(
    () => evaluateDrugMonitoring(medications),
    [medications],
  );

  const criticalSafetyCount = safetyAlerts.filter((alert) => alert.severity === 'critical').length;
  const monitoringItemCount = monitoringResults.reduce((sum, result) => sum + result.requirements.length, 0);
  const criticalMonitoringCount = monitoringResults.reduce(
    (sum, result) => sum + result.requirements.filter((item) => item.severity === 'critical').length,
    0,
  );

  return {
    prescriptions,
    medications,
    safetyAlerts,
    monitoringResults,
    loading,
    lastError,
    refetch: fetchPrescriptions,
    criticalSafetyCount,
    monitoringItemCount,
    criticalMonitoringCount,
  };
}
