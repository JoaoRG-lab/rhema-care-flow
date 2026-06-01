import type { MedicationContext } from './prescriptionSafetyEngine';

export type MonitoringSeverity = 'routine' | 'soon' | 'overdue' | 'critical';

export interface MonitoringRequirement {
  id: string;
  label: string;
  intervalDays?: number;
  severity: MonitoringSeverity;
  rationale: string;
}

export interface DrugMonitoringResult {
  medication: string;
  requirements: MonitoringRequirement[];
}

function medName(medication: MedicationContext) {
  return medication.name.toLowerCase();
}

function matches(medication: MedicationContext, terms: string[]) {
  const name = medName(medication);
  return terms.some((term) => name.includes(term.toLowerCase()));
}

export function getMonitoringForMedication(medication: MedicationContext): MonitoringRequirement[] {
  if (matches(medication, ['metotrexato', 'methotrexate'])) {
    return [
      { id: 'cbc', label: 'Hemograma', intervalDays: 60, severity: 'soon', rationale: 'Monitorar citopenias durante uso de metotrexato.' },
      { id: 'ast-alt', label: 'TGO/TGP', intervalDays: 60, severity: 'soon', rationale: 'Monitorar hepatotoxicidade.' },
      { id: 'creatinine', label: 'Creatinina/eTFG', intervalDays: 90, severity: 'routine', rationale: 'Ajustar risco por função renal.' },
    ];
  }

  if (matches(medication, ['leflunomida', 'leflunomide'])) {
    return [
      { id: 'cbc', label: 'Hemograma', intervalDays: 60, severity: 'soon', rationale: 'Monitorar citopenias.' },
      { id: 'ast-alt', label: 'TGO/TGP', intervalDays: 60, severity: 'soon', rationale: 'Monitorar hepatotoxicidade.' },
      { id: 'bp', label: 'Pressão arterial', intervalDays: 90, severity: 'routine', rationale: 'Leflunomida pode piorar hipertensão.' },
    ];
  }

  if (matches(medication, ['hidroxicloroquina', 'hydroxychloroquine'])) {
    return [
      { id: 'eye-screen', label: 'Rastreamento oftalmológico', intervalDays: 365, severity: 'soon', rationale: 'Risco retiniano depende de dose, tempo, rim e fatores individuais.' },
      { id: 'weight-dose', label: 'Dose por peso atualizada', intervalDays: 180, severity: 'routine', rationale: 'Evitar dose excessiva por peso real.' },
    ];
  }

  if (matches(medication, ['tofacitinibe', 'baricitinibe', 'upadacitinibe', 'filgotinibe'])) {
    return [
      { id: 'cbc', label: 'Hemograma', intervalDays: 60, severity: 'soon', rationale: 'Monitorar citopenias/linfócitos/neutrófilos.' },
      { id: 'lipids', label: 'Perfil lipídico', intervalDays: 90, severity: 'soon', rationale: 'Inibidores de JAK podem alterar lipídios.' },
      { id: 'infection-screen', label: 'Rastreio infeccioso', intervalDays: 365, severity: 'critical', rationale: 'Confirmar TB/hepatites e vacinação conforme risco.' },
    ];
  }

  if (matches(medication, ['adalimumabe', 'etanercepte', 'infliximabe', 'golimumabe', 'certolizumabe', 'tocilizumabe', 'abatacepte', 'rituximabe', 'secukinumabe', 'ixekizumabe'])) {
    return [
      { id: 'infection-screen', label: 'Rastreio infeccioso', intervalDays: 365, severity: 'critical', rationale: 'Terapia avançada exige rastreio infeccioso documentado.' },
      { id: 'vaccines', label: 'Vacinas revisadas', intervalDays: 365, severity: 'soon', rationale: 'Revisar vacinas antes/durante imunossupressão.' },
      { id: 'cbc-liver', label: 'Hemograma e enzimas hepáticas', intervalDays: 90, severity: 'routine', rationale: 'Monitorar segurança conforme droga e contexto.' },
    ];
  }

  if (matches(medication, ['prednisona', 'prednisone', 'prednisolona', 'metilprednisolona', 'methylprednisolone'])) {
    return [
      { id: 'bone-risk', label: 'Risco de osteoporose', intervalDays: 180, severity: 'soon', rationale: 'Corticoide sistêmico exige plano osteometabólico conforme dose/duração.' },
      { id: 'glucose-bp', label: 'Glicemia e pressão arterial', intervalDays: 90, severity: 'soon', rationale: 'Monitorar efeitos metabólicos e cardiovasculares.' },
    ];
  }

  if (matches(medication, ['denosumabe', 'denosumab', 'zoledronato', 'zoledronic'])) {
    return [
      { id: 'calcium-vitd', label: 'Cálcio/Vitamina D', intervalDays: 180, severity: 'soon', rationale: 'Antirreabsortivos exigem atenção a cálcio, vitamina D e rim conforme agente.' },
      { id: 'dental-risk', label: 'Risco odontológico', intervalDays: 365, severity: 'routine', rationale: 'Revisar risco de osteonecrose em contexto de risco.' },
    ];
  }

  return [];
}

export function evaluateDrugMonitoring(medications: MedicationContext[]): DrugMonitoringResult[] {
  return medications
    .map((medication) => ({ medication: medication.name, requirements: getMonitoringForMedication(medication) }))
    .filter((result) => result.requirements.length > 0);
}
