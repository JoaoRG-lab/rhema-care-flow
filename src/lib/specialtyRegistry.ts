export type SpecialtyKey =
  | 'general-medicine'
  | 'rheumatology'
  | 'cardiology'
  | 'endocrinology'
  | 'pulmonology'
  | 'nephrology'
  | 'gastroenterology'
  | 'neurology'
  | 'psychiatry'
  | 'orthopedics'
  | 'infectious-diseases'
  | 'geriatrics'
  | 'dermatology'
  | 'hematology'
  | 'oncology'
  | 'pediatrics'
  | 'occupational-medicine';

export type ClinicalModuleType = 'score' | 'criteria' | 'prescription' | 'safety' | 'timeline' | 'protocol' | 'exam' | 'followup';

export interface SpecialtyModule {
  id: string;
  type: ClinicalModuleType;
  title: string;
  description: string;
  maturity: 'core' | 'beta' | 'planned';
}

export interface SpecialtyDefinition {
  key: SpecialtyKey;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  modules: SpecialtyModule[];
  commonProblems: string[];
  safetyPriorities: string[];
}

const baseModules: SpecialtyModule[] = [
  { id: 'timeline', type: 'timeline', title: 'Timeline longitudinal', description: 'Eventos clínicos, prescrições, scores, notas e segurança em linha do tempo única.', maturity: 'core' },
  { id: 'prescription', type: 'prescription', title: 'Prescrição estruturada', description: 'Itens estruturados, templates, alertas e exportação/impressão.', maturity: 'core' },
  { id: 'safety', type: 'safety', title: 'Segurança terapêutica', description: 'Checklist por paciente, pendências críticas e plano exportável.', maturity: 'core' },
  { id: 'followup', type: 'followup', title: 'Seguimento', description: 'Retorno, monitorização e metas clínicas por problema.', maturity: 'beta' },
];

export const specialtyRegistry: SpecialtyDefinition[] = [
  {
    key: 'general-medicine',
    label: 'Clínica Médica',
    shortLabel: 'Clínica',
    description: 'Base transversal para pacientes complexos, multimorbidade, revisão medicamentosa, risco e seguimento longitudinal.',
    color: 'teal',
    modules: [
      ...baseModules,
      { id: 'problem-list', type: 'protocol', title: 'Lista de problemas', description: 'Problemas ativos, hipóteses, prioridades e pendências.', maturity: 'planned' },
      { id: 'multimorbidity', type: 'safety', title: 'Multimorbidade e polifarmácia', description: 'Risco medicamentoso, interação, fragilidade e reconciliação.', maturity: 'beta' },
    ],
    commonProblems: ['Hipertensão', 'Diabetes', 'Dislipidemia', 'Anemia', 'Perda ponderal', 'Dor crônica', 'Infecção recorrente', 'Fragilidade'],
    safetyPriorities: ['Alergias', 'Função renal/hepática', 'Polifarmácia', 'Risco de queda', 'Anticoagulação', 'Sinais de alarme'],
  },
  {
    key: 'rheumatology',
    label: 'Reumatologia',
    shortLabel: 'Reumato',
    description: 'Pacote especializado para doenças autoimunes, inflamatórias, dor crônica, osteometabolismo e segurança imunossupressora.',
    color: 'purple',
    modules: [
      ...baseModules,
      { id: 'ra-scores', type: 'score', title: 'AR: DAS28/CDAI/SDAI', description: 'Atividade inflamatória e treat-to-target.', maturity: 'core' },
      { id: 'spa-scores', type: 'score', title: 'SpA: BASDAI/ASDAS', description: 'Atividade axial e resposta terapêutica.', maturity: 'core' },
      { id: 'sle-scores', type: 'score', title: 'LES: SLEDAI operacional', description: 'Atividade por domínios e alerta de mimetizadores.', maturity: 'core' },
      { id: 'immunosuppression', type: 'safety', title: 'Imunossupressão', description: 'TB, hepatites, vacinas, gestação, JAK/biológicos.', maturity: 'core' },
    ],
    commonProblems: ['Artrite reumatoide', 'Espondiloartrite', 'Lúpus', 'Fibromialgia', 'Osteoporose', 'Gota', 'Vasculites'],
    safetyPriorities: ['TB/HBV/HCV', 'Vacinas', 'Gestação/contracepção', 'Hemograma', 'Renal/hepático', 'Risco CV/trombótico'],
  },
  {
    key: 'cardiology',
    label: 'Cardiologia',
    shortLabel: 'Cardio',
    description: 'Risco cardiovascular, HAS, IC, FA, dor torácica, anticoagulação e prevenção secundária.',
    color: 'red',
    modules: [
      ...baseModules,
      { id: 'cv-risk', type: 'score', title: 'Risco cardiovascular', description: 'Estratificação de risco e prevenção.', maturity: 'planned' },
      { id: 'anticoagulation', type: 'safety', title: 'Anticoagulação', description: 'Risco hemorrágico, interações e adesão.', maturity: 'planned' },
    ],
    commonProblems: ['Hipertensão', 'Insuficiência cardíaca', 'Fibrilação atrial', 'DAC', 'Dislipidemia', 'Dor torácica'],
    safetyPriorities: ['Anticoagulação', 'Função renal', 'Potássio', 'QT longo', 'Interações', 'Sinais de descompensação'],
  },
  {
    key: 'endocrinology',
    label: 'Endocrinologia',
    shortLabel: 'Endócrino',
    description: 'Diabetes, tireoide, obesidade, osteometabolismo e risco cardiometabólico.',
    color: 'amber',
    modules: [
      ...baseModules,
      { id: 'diabetes-followup', type: 'protocol', title: 'Diabetes longitudinal', description: 'HbA1c, rim, retina, pé diabético e risco CV.', maturity: 'planned' },
      { id: 'thyroid', type: 'protocol', title: 'Tireoide', description: 'TSH/T4, nódulos, sintomas e seguimento.', maturity: 'planned' },
    ],
    commonProblems: ['Diabetes', 'Obesidade', 'Hipotireoidismo', 'Hipertireoidismo', 'Osteoporose', 'Dislipidemia'],
    safetyPriorities: ['Hipoglicemia', 'DRC', 'Retinopatia', 'Pé diabético', 'Risco CV', 'Interações com levotiroxina'],
  },
  {
    key: 'pulmonology',
    label: 'Pneumologia',
    shortLabel: 'Pneumo',
    description: 'Asma, DPOC, dispneia, tosse crônica, oxigenoterapia e risco infeccioso.',
    color: 'sky',
    modules: [...baseModules, { id: 'asthma-copd', type: 'protocol', title: 'Asma/DPOC', description: 'Controle, exacerbações, inaladores e vacinação.', maturity: 'planned' }],
    commonProblems: ['Asma', 'DPOC', 'Tosse crônica', 'Dispneia', 'Pneumonia', 'Apneia do sono'],
    safetyPriorities: ['Saturação', 'Exacerbações', 'Corticoide', 'Vacinas', 'Tabagismo', 'Técnica inalatória'],
  },
  {
    key: 'nephrology',
    label: 'Nefrologia',
    shortLabel: 'Nefro',
    description: 'DRC, proteinúria, distúrbios eletrolíticos, HAS resistente e ajuste medicamentoso.',
    color: 'blue',
    modules: [...baseModules, { id: 'ckd', type: 'protocol', title: 'DRC', description: 'eTFG, albuminúria, progressão e nefroproteção.', maturity: 'planned' }],
    commonProblems: ['DRC', 'Proteinúria', 'HAS resistente', 'Hipercalemia', 'Litíase', 'IRA'],
    safetyPriorities: ['eTFG', 'Potássio', 'AINEs', 'Contraste', 'Dose renal', 'Proteinúria'],
  },
  {
    key: 'gastroenterology',
    label: 'Gastroenterologia',
    shortLabel: 'Gastro',
    description: 'Dispepsia, DII, hepatopatias, dor abdominal, anemia digestiva e segurança hepática.',
    color: 'orange',
    modules: [...baseModules, { id: 'liver-safety', type: 'safety', title: 'Segurança hepática', description: 'Hepatotoxicidade, vírus, álcool e monitorização.', maturity: 'planned' }],
    commonProblems: ['DRGE', 'Dispepsia', 'DII', 'Hepatopatia', 'Constipação', 'Diarreia crônica'],
    safetyPriorities: ['Sangramento digestivo', 'Hepatotoxicidade', 'HBV/HCV', 'Anemia', 'Perda ponderal', 'Icterícia'],
  },
  {
    key: 'neurology',
    label: 'Neurologia',
    shortLabel: 'Neuro',
    description: 'Cefaleia, AVC, epilepsia, neuropatias, cognição e sinais neurológicos focais.',
    color: 'indigo',
    modules: [...baseModules, { id: 'neuro-redflags', type: 'criteria', title: 'Red flags neurológicas', description: 'Déficit focal, thunderclap, crise, rebaixamento e urgências.', maturity: 'planned' }],
    commonProblems: ['Cefaleia', 'AVC', 'Epilepsia', 'Neuropatia', 'Tontura', 'Demência'],
    safetyPriorities: ['Déficit focal', 'Crise', 'Anticoagulação', 'Rebaixamento', 'Queda', 'Interações anticonvulsivantes'],
  },
  {
    key: 'psychiatry',
    label: 'Psiquiatria',
    shortLabel: 'Psiq',
    description: 'Humor, ansiedade, sono, risco, psicofármacos e cuidado longitudinal integrado.',
    color: 'violet',
    modules: [...baseModules, { id: 'mental-health-safety', type: 'safety', title: 'Segurança em saúde mental', description: 'Risco, sono, adesão, efeitos adversos e rede de apoio.', maturity: 'planned' }],
    commonProblems: ['Depressão', 'Ansiedade', 'Insônia', 'TDAH', 'Bipolaridade', 'Uso de substâncias'],
    safetyPriorities: ['Risco agudo', 'Interações', 'QT', 'Sedação', 'Dependência', 'Adesão'],
  },
  {
    key: 'orthopedics',
    label: 'Ortopedia',
    shortLabel: 'Orto',
    description: 'Dor musculoesquelética, trauma, incapacidade funcional, reabilitação e imagem.',
    color: 'stone',
    modules: [...baseModules, { id: 'msk-function', type: 'followup', title: 'Função musculoesquelética', description: 'Dor, função, limitação, imagem e reabilitação.', maturity: 'planned' }],
    commonProblems: ['Lombalgia', 'Osteoartrite', 'Tendinopatias', 'Trauma', 'Dor no ombro', 'Dor no joelho'],
    safetyPriorities: ['Fratura', 'Déficit neurológico', 'Infecção', 'AINEs', 'Opioides', 'Queda'],
  },
  {
    key: 'infectious-diseases',
    label: 'Infectologia',
    shortLabel: 'Infecto',
    description: 'Infecções, antimicrobianos, imunossuprimidos, vacinação e stewardship.',
    color: 'emerald',
    modules: [...baseModules, { id: 'antimicrobial-safety', type: 'safety', title: 'Antimicrobianos', description: 'Dose, foco, cultura, duração, alergias e resistência.', maturity: 'planned' }],
    commonProblems: ['ITU', 'Pneumonia', 'Celulite', 'Febre', 'Imunossuprimido febril', 'Tuberculose'],
    safetyPriorities: ['Sepse', 'Alergia antimicrobiana', 'Função renal', 'Culturas', 'Resistência', 'Fonte infecciosa'],
  },
  {
    key: 'geriatrics',
    label: 'Geriatria',
    shortLabel: 'Geriatria',
    description: 'Fragilidade, cognição, quedas, polifarmácia, funcionalidade e cuidado centrado em metas.',
    color: 'lime',
    modules: [...baseModules, { id: 'frailty', type: 'score', title: 'Fragilidade e funcionalidade', description: 'Quedas, AVDs, cognição, nutrição e rede.', maturity: 'planned' }],
    commonProblems: ['Fragilidade', 'Demência', 'Quedas', 'Polifarmácia', 'Sarcopenia', 'Incontinência'],
    safetyPriorities: ['Queda', 'Delirium', 'Anticolinérgicos', 'Benzodiazepínicos', 'Metas de cuidado', 'Cuidador'],
  },
  {
    key: 'occupational-medicine',
    label: 'Medicina do Trabalho',
    shortLabel: 'Trabalho',
    description: 'Aptidão, nexo, restrições, funcionalidade, retorno ao trabalho e riscos ocupacionais.',
    color: 'slate',
    modules: [...baseModules, { id: 'fitness-for-work', type: 'protocol', title: 'Aptidão e restrições', description: 'Capacidade funcional, risco, adaptação e retorno seguro.', maturity: 'planned' }],
    commonProblems: ['Dor lombar ocupacional', 'LER/DORT', 'Transtornos mentais relacionados ao trabalho', 'Perda auditiva', 'Acidente de trabalho'],
    safetyPriorities: ['Risco a terceiros', 'Atividade crítica', 'Restrição funcional', 'Nexo', 'Retorno gradual', 'Documentação'],
  },
];

export function getSpecialty(key: SpecialtyKey) {
  return specialtyRegistry.find((specialty) => specialty.key === key);
}

export function getSpecialtyOptions() {
  return specialtyRegistry.map(({ key, label, shortLabel, description }) => ({ key, label, shortLabel, description }));
}
