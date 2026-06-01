export type SafetySeverity = 'info' | 'warning' | 'critical';

export interface MedicationContext {
  name: string;
  dose?: string;
  route?: string;
  frequency?: string;
}

export interface SafetyContext {
  medications: MedicationContext[];
  problemTitle?: string;
  protocolCompleted?: Record<string, boolean>;
  labs?: Record<string, unknown>;
  patientFlags?: string[];
}

export interface SafetyAlert {
  id: string;
  severity: SafetySeverity;
  title: string;
  message: string;
  relatedMedication?: string;
  requiredAction?: string;
}

export interface SafetyRule {
  id: string;
  match: (context: SafetyContext) => boolean;
  alert: (context: SafetyContext) => SafetyAlert;
}

function hasMedication(context: SafetyContext, terms: string[]) {
  return context.medications.some((med) => {
    const name = med.name.toLowerCase();
    return terms.some((term) => name.includes(term.toLowerCase()));
  });
}

function protocolDone(context: SafetyContext, key: string) {
  return Boolean(context.protocolCompleted?.[key]);
}

export const prescriptionSafetyRules: SafetyRule[] = [
  {
    id: 'mtx-without-folic-acid',
    match: (context) => hasMedication(context, ['metotrexato', 'methotrexate']) && !hasMedication(context, ['ácido fólico', 'acido folico', 'folic acid']),
    alert: () => ({
      id: 'mtx-without-folic-acid',
      severity: 'warning',
      title: 'Metotrexato sem ácido fólico',
      message: 'Metotrexato geralmente exige estratégia de suplementação com ácido fólico/folínico, salvo contraindicação ou decisão clínica documentada.',
      relatedMedication: 'Metotrexato',
      requiredAction: 'Revisar suplementação e orientação de uso semanal.',
    }),
  },
  {
    id: 'mtx-monitoring-labs-missing',
    match: (context) => hasMedication(context, ['metotrexato', 'methotrexate']) && !protocolDone(context, 'labs-safety'),
    alert: () => ({
      id: 'mtx-monitoring-labs-missing',
      severity: 'critical',
      title: 'Monitorização laboratorial do metotrexato pendente',
      message: 'Antes de manter ou escalar metotrexato, revisar hemograma, transaminases e função renal conforme risco e protocolo local.',
      relatedMedication: 'Metotrexato',
      requiredAction: 'Checar hemograma, TGO/TGP e creatinina/eTFG.',
    }),
  },
  {
    id: 'biologic-infection-screen-missing',
    match: (context) => hasMedication(context, ['adalimumabe', 'etanercepte', 'infliximabe', 'golimumabe', 'certolizumabe', 'tocilizumabe', 'abatacepte', 'rituximabe', 'secukinumabe', 'ixekizumabe', 'ustequinumabe', 'guselkumabe']) && !protocolDone(context, 'infection-screen'),
    alert: () => ({
      id: 'biologic-infection-screen-missing',
      severity: 'critical',
      title: 'Terapia biológica sem rastreio infeccioso documentado',
      message: 'Terapias biológicas exigem revisão de rastreio infeccioso conforme protocolo antes de início ou troca.',
      requiredAction: 'Confirmar TB, hepatite B, hepatite C e vacinação conforme contexto.',
    }),
  },
  {
    id: 'jak-inhibitor-screen-missing',
    match: (context) => hasMedication(context, ['tofacitinibe', 'baricitinibe', 'upadacitinibe', 'filgotinibe']) && !protocolDone(context, 'infection-screen'),
    alert: () => ({
      id: 'jak-inhibitor-screen-missing',
      severity: 'critical',
      title: 'Inibidor de JAK sem rastreio infeccioso documentado',
      message: 'Inibidores de JAK exigem atenção a infecções, TB, hepatites, vacinação e risco trombótico/cardiovascular conforme perfil do paciente.',
      requiredAction: 'Revisar rastreio infeccioso, hemograma, perfil lipídico e risco individual.',
    }),
  },
  {
    id: 'chronic-steroid-bone-protection',
    match: (context) => hasMedication(context, ['prednisona', 'prednisone', 'prednisolona', 'methylprednisolone', 'metilprednisolona']),
    alert: () => ({
      id: 'chronic-steroid-bone-protection',
      severity: 'warning',
      title: 'Corticoide sistêmico: revisar proteção óssea e metabólica',
      message: 'Uso sistêmico de corticoide deve acionar revisão de risco osteometabólico, glicêmico, pressórico, infeccioso e gastrointestinal conforme dose/duração.',
      requiredAction: 'Revisar cálcio/vitamina D, osteoporose, PA, glicemia e plano de desmame quando possível.',
    }),
  },
  {
    id: 'hydroxychloroquine-eye-screen',
    match: (context) => hasMedication(context, ['hidroxicloroquina', 'hydroxychloroquine']) && !protocolDone(context, 'hcq-retina'),
    alert: () => ({
      id: 'hydroxychloroquine-eye-screen',
      severity: 'warning',
      title: 'Hidroxicloroquina sem rastreio oftalmológico documentado',
      message: 'Hidroxicloroquina requer atenção a dose por peso, função renal, tempo de uso e rastreio oftalmológico conforme risco.',
      relatedMedication: 'Hidroxicloroquina',
      requiredAction: 'Documentar avaliação oftalmológica/rastreamento e revisar dose.',
    }),
  },
];

export function evaluatePrescriptionSafety(context: SafetyContext): SafetyAlert[] {
  return prescriptionSafetyRules
    .filter((rule) => rule.match(context))
    .map((rule) => rule.alert(context));
}
