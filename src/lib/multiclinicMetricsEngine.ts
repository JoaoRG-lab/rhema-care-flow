export interface MulticlinicMetricsInput {
  activePatients: number;
  activeProblems: number;
  overdueMonitoring: number;
  upcomingMonitoring30d: number;
  criticalSafetyAlerts: number;
  incompleteProtocols: number;
  completedProtocols: number;
  scheduledFollowups: number;
  overdueFollowups: number;
  prescriptions: number;
  signedPrescriptions: number;
}

export interface MulticlinicMetrics {
  activePatients: number;
  activeProblems: number;
  monitoringBurden: number;
  safetyBurden: number;
  protocolCompliancePercent: number;
  prescriptionSignaturePercent: number;
  followupOverduePercent: number;
  operationalRiskScore: number;
  growthReadinessScore: number;
}

function percent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function calculateMulticlinicMetrics(input: MulticlinicMetricsInput): MulticlinicMetrics {
  const totalProtocols = input.completedProtocols + input.incompleteProtocols;
  const protocolCompliancePercent = percent(input.completedProtocols, totalProtocols);
  const prescriptionSignaturePercent = percent(input.signedPrescriptions, input.prescriptions);
  const followupOverduePercent = percent(input.overdueFollowups, input.scheduledFollowups);

  const monitoringBurden = input.overdueMonitoring + input.upcomingMonitoring30d;
  const safetyBurden = input.criticalSafetyAlerts + input.incompleteProtocols;

  const operationalRiskScore = clamp(
    input.criticalSafetyAlerts * 12 +
    input.overdueMonitoring * 6 +
    input.incompleteProtocols * 4 +
    input.overdueFollowups * 5 -
    protocolCompliancePercent * 0.25,
  );

  const growthReadinessScore = clamp(
    protocolCompliancePercent * 0.35 +
    prescriptionSignaturePercent * 0.2 +
    Math.max(0, 100 - followupOverduePercent) * 0.25 +
    Math.max(0, 100 - operationalRiskScore) * 0.2,
  );

  return {
    activePatients: input.activePatients,
    activeProblems: input.activeProblems,
    monitoringBurden,
    safetyBurden,
    protocolCompliancePercent,
    prescriptionSignaturePercent,
    followupOverduePercent,
    operationalRiskScore: Math.round(operationalRiskScore),
    growthReadinessScore: Math.round(growthReadinessScore),
  };
}

export function classifyClinicRisk(score: number) {
  if (score >= 70) return 'high';
  if (score >= 35) return 'moderate';
  return 'low';
}

export function classifyGrowthReadiness(score: number) {
  if (score >= 80) return 'ready';
  if (score >= 55) return 'developing';
  return 'fragile';
}
