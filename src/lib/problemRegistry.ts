import type { SpecialtyKey } from './specialtyRegistry';

export type ProblemSeverity = 'low' | 'moderate' | 'high' | 'critical';
export type ProblemStatus = 'active' | 'controlled' | 'monitoring' | 'resolved' | 'uncertain';

export interface ClinicalProblemTemplate {
  id: string;
  specialty: SpecialtyKey;
  title: string;
  aliases: string[];
  category: 'chronic' | 'acute' | 'risk' | 'symptom' | 'syndrome' | 'preventive';
  defaultStatus: ProblemStatus;
  defaultSeverity: ProblemSeverity;
  suggestedGoals: string[];
  baselineData: string[];
  followupData: string[];
  safetyChecklist: string[];
  redFlags: string[];
  linkedModules: Array<'timeline' | 'scores' | 'prescription' | 'safety' | 'exams' | 'protocols'>;
}

export const clinicalProblemTemplates: ClinicalProblemTemplate[] = [
  {
    id: 'general-hypertension',
    specialty: 'general-medicine',
    title: 'Hipertensão arterial sistêmica',
    aliases: ['HAS', 'pressão alta'],
    category: 'chronic',
    defaultStatus: 'active',
    defaultSeverity: 'moderate',
    suggestedGoals: ['PA em alvo individualizado', 'Reduzir risco cardiovascular global', 'Aumentar adesão e automonitorização'],
    baselineData: ['PA consultório e/ou MRPA/MAPA', 'Creatinina/eTFG', 'Potássio', 'Albuminúria quando indicada', 'Risco cardiovascular'],
    followupData: ['PA seriada', 'Efeitos adversos', 'Adesão', 'Potássio/renal após IECA/BRA/diurético quando aplicável'],
    safetyChecklist: ['Hipotensão/queda', 'DRC', 'Hipercalemia', 'Interações', 'AINEs'],
    redFlags: ['Emergência hipertensiva', 'Dor torácica', 'Déficit neurológico', 'Edema agudo de pulmão', 'IRA'],
    linkedModules: ['timeline', 'prescription', 'safety', 'exams'],
  },
  {
    id: 'general-diabetes',
    specialty: 'general-medicine',
    title: 'Diabetes mellitus',
    aliases: ['DM2', 'DM1', 'diabetes'],
    category: 'chronic',
    defaultStatus: 'active',
    defaultSeverity: 'moderate',
    suggestedGoals: ['HbA1c/meta individualizada', 'Reduzir risco micro/macrovascular', 'Prevenir hipoglicemia'],
    baselineData: ['HbA1c', 'Creatinina/eTFG', 'Albuminúria', 'Perfil lipídico', 'Pé diabético', 'Retina'],
    followupData: ['HbA1c periódica', 'Hipoglicemias', 'Peso', 'PA', 'Adesão', 'Complicações'],
    safetyChecklist: ['Hipoglicemia', 'DRC', 'Retinopatia', 'Pé diabético', 'Interações', 'Risco cardiovascular'],
    redFlags: ['Cetoacidose/estado hiperosmolar', 'Infecção grave', 'Hipoglicemia severa', 'Pé infectado/isquêmico'],
    linkedModules: ['timeline', 'scores', 'prescription', 'safety', 'exams'],
  },
  {
    id: 'rheum-ra',
    specialty: 'rheumatology',
    title: 'Artrite reumatoide',
    aliases: ['AR', 'rheumatoid arthritis'],
    category: 'chronic',
    defaultStatus: 'active',
    defaultSeverity: 'moderate',
    suggestedGoals: ['Remissão ou baixa atividade', 'Prevenir dano estrutural', 'Reduzir dor e incapacidade', 'Minimizar toxicidade terapêutica'],
    baselineData: ['Articulações dolorosas/edemaciadas', 'DAS28/CDAI/SDAI', 'RF/ACPA', 'PCR/VHS', 'Radiografia/USG quando indicado'],
    followupData: ['DAS28/CDAI/SDAI seriado', 'Função', 'Efeitos adversos', 'Exames de segurança', 'Aderência'],
    safetyChecklist: ['Hemograma', 'TGO/TGP', 'Creatinina', 'TB/hepatites para avançados', 'Vacinas', 'Gestação/contracepção'],
    redFlags: ['Artrite séptica', 'Febre persistente', 'Citopenia importante', 'Dispneia nova', 'Infecção ativa'],
    linkedModules: ['timeline', 'scores', 'prescription', 'safety', 'exams', 'protocols'],
  },
  {
    id: 'rheum-sle',
    specialty: 'rheumatology',
    title: 'Lúpus eritematoso sistêmico',
    aliases: ['LES', 'SLE', 'lúpus'],
    category: 'chronic',
    defaultStatus: 'active',
    defaultSeverity: 'high',
    suggestedGoals: ['Controlar atividade por órgão-alvo', 'Prevenir dano acumulado', 'Reduzir corticoide', 'Monitorar nefropatia e infecção'],
    baselineData: ['SLEDAI operacional', 'Urina I', 'Relação proteína/creatinina', 'Creatinina', 'Complemento', 'Anti-dsDNA', 'Hemograma'],
    followupData: ['Atividade por domínio', 'Proteinúria/sedimento', 'Complemento/anti-dsDNA', 'Corticoide acumulado', 'Infecções'],
    safetyChecklist: ['Excluir infecção antes de escalar', 'Vacinas', 'Gestação/SAF', 'Renal/hepático', 'Retina se HCQ'],
    redFlags: ['Nefrite ativa', 'NeuroLES', 'Citopenia grave', 'Trombose', 'Infecção grave'],
    linkedModules: ['timeline', 'scores', 'prescription', 'safety', 'exams', 'protocols'],
  },
  {
    id: 'cardio-heart-failure',
    specialty: 'cardiology',
    title: 'Insuficiência cardíaca',
    aliases: ['IC', 'heart failure'],
    category: 'chronic',
    defaultStatus: 'active',
    defaultSeverity: 'high',
    suggestedGoals: ['Reduzir sintomas/congestão', 'Otimizar terapia modificadora', 'Prevenir internação', 'Monitorar renal/potássio'],
    baselineData: ['Classe funcional', 'FEVE quando disponível', 'BNP/NT-proBNP se indicado', 'Creatinina/eTFG', 'Potássio', 'Peso'],
    followupData: ['Peso', 'Sintomas', 'PA/FC', 'Creatinina/potássio após ajustes', 'Adesão', 'Internações'],
    safetyChecklist: ['Hipotensão', 'Hipercalemia', 'DRC', 'AINEs', 'Bradicardia', 'Interações'],
    redFlags: ['Dispneia em repouso', 'Hipoxemia', 'Síncope', 'Choque', 'Edema agudo de pulmão'],
    linkedModules: ['timeline', 'prescription', 'safety', 'exams'],
  },
  {
    id: 'pulm-asthma-copd',
    specialty: 'pulmonology',
    title: 'Asma/DPOC',
    aliases: ['asma', 'DPOC', 'bronquite crônica', 'enfisema'],
    category: 'chronic',
    defaultStatus: 'active',
    defaultSeverity: 'moderate',
    suggestedGoals: ['Reduzir exacerbações', 'Melhorar controle/sintomas', 'Revisar técnica inalatória', 'Vacinação e cessação tabágica'],
    baselineData: ['Sintomas', 'Exacerbações', 'Espirometria quando disponível', 'SatO2', 'Tabagismo', 'Técnica inalatória'],
    followupData: ['Exacerbações', 'Uso de resgate', 'Adesão', 'Técnica', 'Efeitos adversos', 'Vacinas'],
    safetyChecklist: ['Corticoide sistêmico', 'Pneumonia', 'Hipoxemia', 'Interações', 'Técnica inalatória'],
    redFlags: ['SatO2 baixa', 'Silêncio auscultatório', 'Confusão', 'Exaustão', 'Cianose'],
    linkedModules: ['timeline', 'prescription', 'safety', 'exams'],
  },
  {
    id: 'geri-frailty',
    specialty: 'geriatrics',
    title: 'Fragilidade / risco de queda',
    aliases: ['fragilidade', 'queda', 'sarcopenia'],
    category: 'risk',
    defaultStatus: 'active',
    defaultSeverity: 'high',
    suggestedGoals: ['Reduzir quedas', 'Preservar funcionalidade', 'Revisar polifarmácia', 'Alinhar metas de cuidado'],
    baselineData: ['Quedas prévias', 'AVDs/AIVDs', 'Cognição', 'Marcha/equilíbrio', 'Medicamentos', 'Nutrição'],
    followupData: ['Novas quedas', 'Funcionalidade', 'Adesão a reabilitação', 'Eventos adversos medicamentosos'],
    safetyChecklist: ['Benzodiazepínicos', 'Anticolinérgicos', 'Hipotensão ortostática', 'Visão/audição', 'Ambiente domiciliar'],
    redFlags: ['Delirium', 'Fratura', 'Síncope', 'Perda funcional rápida', 'Maus tratos/negligência'],
    linkedModules: ['timeline', 'prescription', 'safety', 'protocols'],
  },
];

export function getProblemsBySpecialty(specialty: SpecialtyKey) {
  return clinicalProblemTemplates.filter((problem) => problem.specialty === specialty || specialty === 'general-medicine');
}

export function findProblemTemplate(id: string) {
  return clinicalProblemTemplates.find((problem) => problem.id === id);
}
