import type { SpecialtyKey } from './specialtyRegistry';

export type CareLineKey =
  | 'autoimmune-inflammatory'
  | 'chronic-pain-function'
  | 'bone-health'
  | 'cardiometabolic-risk'
  | 'diabetes-metabolism'
  | 'mental-health-sleep'
  | 'frailty-function'
  | 'occupational-health'
  | 'preoperative-risk'
  | 'respiratory-function'
  | 'kidney-protection';

export interface CareLineDefinition {
  key: CareLineKey;
  label: string;
  description: string;
  specialties: SpecialtyKey[];
  commonProblems: string[];
  coreMetrics: string[];
  retentionDrivers: string[];
  revenueDrivers: string[];
  clinicalRisks: string[];
}

export const careLineRegistry: CareLineDefinition[] = [
  {
    key: 'autoimmune-inflammatory',
    label: 'Autoimunes inflamatórias',
    description: 'Linha de cuidado para doenças inflamatórias crônicas, imunossupressão, treat-to-target e segurança terapêutica.',
    specialties: ['rheumatology', 'general-medicine', 'dermatology', 'gastroenterology', 'nephrology', 'infectious-diseases'],
    commonProblems: ['Artrite reumatoide', 'Lúpus', 'Espondiloartrite', 'Psoríase', 'DII', 'Vasculites'],
    coreMetrics: ['atividade de doença', 'protocol compliance', 'rastreio infeccioso completo', 'monitorização laboratorial', 'adesão ao seguimento'],
    retentionDrivers: ['retornos programados', 'renovação terapêutica', 'monitorização periódica', 'educação do paciente'],
    revenueDrivers: ['consulta longitudinal', 'ultrassom musculoesquelético', 'procedimentos', 'infusões', 'programas de monitorização'],
    clinicalRisks: ['infecção grave', 'hepatotoxicidade', 'citopenia', 'falha terapêutica', 'perda de seguimento'],
  },
  {
    key: 'chronic-pain-function',
    label: 'Dor crônica e funcionalidade',
    description: 'Linha transversal para dor persistente, funcionalidade, sono, humor, reabilitação e redução de baixa resolutividade.',
    specialties: ['rheumatology', 'orthopedics', 'neurology', 'psychiatry', 'general-medicine', 'geriatrics'],
    commonProblems: ['Fibromialgia', 'Lombalgia', 'Osteoartrite', 'Dor neuropática', 'Tendinopatias', 'Insônia'],
    coreMetrics: ['EVA/NRS', 'funcionalidade', 'sono', 'humor', 'retorno ao trabalho', 'uso de opioides/AINEs'],
    retentionDrivers: ['plano multimodal', 'reavaliação funcional', 'educação em dor', 'programa de exercícios', 'saúde mental integrada'],
    revenueDrivers: ['consulta longitudinal', 'procedimentos guiados', 'reabilitação', 'programas de grupo', 'telemonitorização'],
    clinicalRisks: ['opioides', 'AINEs crônicos', 'catastrofização', 'iatrogenia', 'cronificação sem plano'],
  },
  {
    key: 'bone-health',
    label: 'Osteoporose e saúde óssea',
    description: 'Linha para fratura, risco osteometabólico, densitometria, prevenção secundária e adesão a terapia longa.',
    specialties: ['rheumatology', 'endocrinology', 'geriatrics', 'orthopedics', 'general-medicine'],
    commonProblems: ['Osteoporose', 'Fratura por fragilidade', 'Uso crônico de corticoide', 'Deficiência de vitamina D', 'Quedas'],
    coreMetrics: ['FRAX', 'DXA', 'cálcio/vitamina D', 'quedas', 'fraturas incidentes', 'adesão terapêutica'],
    retentionDrivers: ['controle anual', 'monitorização de cálcio', 'sequenciamento terapêutico', 'prevenção de quedas'],
    revenueDrivers: ['consulta', 'densitometria/parcerias', 'programas de prevenção', 'infusão/injetáveis', 'procedimentos'],
    clinicalRisks: ['fratura', 'hipocalcemia', 'atraso de denosumabe', 'osteonecrose em alto risco', 'quedas recorrentes'],
  },
  {
    key: 'cardiometabolic-risk',
    label: 'Risco cardiometabólico',
    description: 'Linha para hipertensão, dislipidemia, obesidade, diabetes inicial e prevenção cardiovascular integrada.',
    specialties: ['general-medicine', 'cardiology', 'endocrinology', 'nephrology', 'geriatrics'],
    commonProblems: ['Hipertensão', 'Dislipidemia', 'Obesidade', 'Pré-diabetes', 'Doença renal crônica', 'Esteatose hepática'],
    coreMetrics: ['PA/MRPA/MAPA', 'LDL', 'HbA1c', 'IMC/cintura', 'albuminúria', 'risco cardiovascular'],
    retentionDrivers: ['metas numéricas', 'retornos curtos', 'educação alimentar', 'monitorização domiciliar', 'ajuste terapêutico'],
    revenueDrivers: ['pacotes de acompanhamento', 'check-ups orientados por risco', 'programas de obesidade', 'telemonitorização'],
    clinicalRisks: ['evento cardiovascular', 'DRC progressiva', 'hipoglicemia', 'interações', 'baixa adesão'],
  },
  {
    key: 'diabetes-metabolism',
    label: 'Diabetes e metabolismo',
    description: 'Linha focada em diabetes, prevenção de complicações, rim, retina, pé diabético e risco cardiovascular.',
    specialties: ['endocrinology', 'general-medicine', 'cardiology', 'nephrology', 'geriatrics'],
    commonProblems: ['Diabetes tipo 2', 'Diabetes tipo 1', 'Obesidade', 'DRC diabética', 'Neuropatia', 'Retinopatia'],
    coreMetrics: ['HbA1c', 'albuminúria', 'eTFG', 'fundo de olho', 'pé diabético', 'hipoglicemia'],
    retentionDrivers: ['monitorização trimestral', 'educação em autocuidado', 'prevenção de complicações', 'ajuste de terapia'],
    revenueDrivers: ['programas de diabetes', 'consulta longitudinal', 'educação em grupo', 'telemonitorização glicêmica'],
    clinicalRisks: ['hipoglicemia', 'pé diabético', 'DRC', 'retinopatia', 'evento cardiovascular'],
  },
  {
    key: 'mental-health-sleep',
    label: 'Saúde mental e sono',
    description: 'Linha integrada para humor, ansiedade, sono, funcionalidade, adesão terapêutica e retorno à vida produtiva.',
    specialties: ['psychiatry', 'general-medicine', 'geriatrics', 'neurology', 'occupational-medicine'],
    commonProblems: ['Depressão', 'Ansiedade', 'Insônia', 'TDAH', 'Burnout', 'Dor crônica com sofrimento psíquico'],
    coreMetrics: ['PHQ-9', 'GAD-7', 'ISI', 'funcionalidade', 'adesão', 'efeitos adversos'],
    retentionDrivers: ['seguimento próximo', 'psicoeducação', 'ajuste terapêutico', 'coordenação com trabalho/família'],
    revenueDrivers: ['programas de sono', 'consultas seriadas', 'intervenções em grupo', 'medicina ocupacional'],
    clinicalRisks: ['risco agudo não detalhado', 'sedação', 'dependência', 'interações', 'abandono terapêutico'],
  },
  {
    key: 'frailty-function',
    label: 'Fragilidade e funcionalidade',
    description: 'Linha geriátrica para quedas, cognição, funcionalidade, nutrição, polifarmácia e suporte familiar.',
    specialties: ['geriatrics', 'general-medicine', 'neurology', 'orthopedics', 'psychiatry'],
    commonProblems: ['Fragilidade', 'Demência', 'Quedas', 'Sarcopenia', 'Polifarmácia', 'Incontinência'],
    coreMetrics: ['CFS', 'Katz/Lawton', 'TUG', 'cognição', 'quedas', 'medicações potencialmente inapropriadas'],
    retentionDrivers: ['plano familiar', 'revisão medicamentosa', 'prevenção de quedas', 'visitas programadas'],
    revenueDrivers: ['programas geriátricos', 'coordenação de cuidado', 'avaliação funcional', 'domiciliar/telemonitorização'],
    clinicalRisks: ['queda', 'delirium', 'iatrogenia', 'perda funcional', 'sobrecarga do cuidador'],
  },
  {
    key: 'occupational-health',
    label: 'Saúde ocupacional e funcionalidade laboral',
    description: 'Linha para aptidão, restrições, retorno ao trabalho, nexo, funcionalidade e prevenção de afastamentos.',
    specialties: ['occupational-medicine', 'general-medicine', 'orthopedics', 'psychiatry', 'rheumatology'],
    commonProblems: ['Dor musculoesquelética ocupacional', 'Burnout', 'Retorno ao trabalho', 'Restrição funcional', 'Acidente de trabalho'],
    coreMetrics: ['dias afastado', 'restrições', 'capacidade funcional', 'risco psicossocial', 'aderência ao plano'],
    retentionDrivers: ['reavaliação funcional', 'coordenação empresa-paciente', 'plano de retorno', 'documentação robusta'],
    revenueDrivers: ['medicina ocupacional', 'laudos', 'programas corporativos', 'perícia assistencial', 'gestão de afastados'],
    clinicalRisks: ['cronificação', 'judicialização', 'retorno inseguro', 'agravamento funcional', 'falha documental'],
  },
];

export function getCareLineDefinition(key?: string) {
  if (!key) return undefined;
  return careLineRegistry.find((line) => line.key === key || line.label.toLowerCase() === key.toLowerCase());
}

export function getCareLinesForSpecialty(specialty: SpecialtyKey) {
  return careLineRegistry.filter((line) => line.specialties.includes(specialty));
}
