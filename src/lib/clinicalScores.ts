export type FieldKind = 'number' | 'boolean' | 'select';

export interface ScoreField {
  id: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  kind?: FieldKind;
  help?: string;
  options?: Array<{ label: string; value: number }>;
}

export interface ScoreInterpretation {
  label: string;
  severity: 'remission' | 'low' | 'moderate' | 'high' | 'very-high' | 'positive' | 'negative' | 'neutral';
  clinicalNote: string;
}

export interface ClinicalScoreDefinition {
  id: string;
  name: string;
  area: 'Artrite Reumatoide' | 'Espondiloartrite' | 'Lúpus' | 'Classificação' | 'Dor e função' | 'Osteoporose' | 'Segurança terapêutica';
  description: string;
  fields: ScoreField[];
  calculate: (values: Record<string, number>) => number;
  interpret: (score: number, values: Record<string, number>) => ScoreInterpretation;
  unit?: string;
  precision?: number;
  references: string[];
}

function round(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round((Number.isFinite(value) ? value : 0) * factor) / factor;
}

function sum(values: Record<string, number>, keys: string[]) {
  return keys.reduce((acc, key) => acc + (Number(values[key]) || 0), 0);
}

function requiredPositive(value: number, fallback = 1) {
  return value > 0 ? value : fallback;
}

function binary(value: number) {
  return value ? 1 : 0;
}

export function severityClass(severity: ScoreInterpretation['severity']) {
  const map: Record<ScoreInterpretation['severity'], string> = {
    remission: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    low: 'bg-teal-50 text-teal-700 border-teal-200',
    moderate: 'bg-amber-50 text-amber-700 border-amber-200',
    high: 'bg-red-50 text-red-700 border-red-200',
    'very-high': 'bg-rose-50 text-rose-700 border-rose-200',
    positive: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    negative: 'bg-slate-50 text-slate-700 border-slate-200',
    neutral: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return map[severity];
}

const vas010 = { min: 0, max: 10, step: 0.1 };
const vas0100 = { min: 0, max: 100, step: 1 };
const joints28 = { min: 0, max: 28, step: 1 };

export const clinicalScores: ClinicalScoreDefinition[] = [
  {
    id: 'das28_esr',
    name: 'DAS28-VHS',
    area: 'Artrite Reumatoide',
    description: 'Atividade da artrite reumatoide com 28 articulações, VHS e avaliação global do paciente.',
    unit: 'pontos',
    precision: 2,
    references: ['DAS28 com VHS: TJC28, SJC28, ln(VHS) e VAS global 0–100 mm.', 'Cortes usuais: remissão <2,6; baixa ≤3,2; moderada ≤5,1; alta >5,1.'],
    fields: [
      { id: 'tjc28', label: 'Articulações dolorosas 28', ...joints28 },
      { id: 'sjc28', label: 'Articulações edemaciadas 28', ...joints28 },
      { id: 'esr', label: 'VHS mm/h', min: 1, max: 140, step: 1, help: 'Use valor mínimo 1 para evitar logaritmo inválido.' },
      { id: 'patientGlobal100', label: 'Global paciente 0–100 mm', ...vas0100 },
    ],
    calculate: ({ tjc28, sjc28, esr, patientGlobal100 }) => round(
      0.56 * Math.sqrt(tjc28 || 0) +
      0.28 * Math.sqrt(sjc28 || 0) +
      0.7 * Math.log(requiredPositive(esr)) +
      0.014 * (patientGlobal100 || 0),
    ),
    interpret: (s) => {
      if (s < 2.6) return { label: 'Remissão', severity: 'remission', clinicalNote: 'Compatível com remissão pelo DAS28-VHS; correlacione com exame físico e alvo terapêutico.' };
      if (s <= 3.2) return { label: 'Baixa atividade', severity: 'low', clinicalNote: 'Baixa atividade; reavaliar alvo, dano estrutural e preferência do paciente.' };
      if (s <= 5.1) return { label: 'Atividade moderada', severity: 'moderate', clinicalNote: 'Atividade moderada; considerar treat-to-target e revisão terapêutica.' };
      return { label: 'Alta atividade', severity: 'high', clinicalNote: 'Alta atividade; exige revisão clínica e terapêutica prioritária.' };
    },
  },
  {
    id: 'das28_crp',
    name: 'DAS28-PCR',
    area: 'Artrite Reumatoide',
    description: 'Atividade da artrite reumatoide com PCR em mg/L e avaliação global.',
    unit: 'pontos',
    precision: 2,
    references: ['DAS28-PCR: 0,56√TJC28 + 0,28√SJC28 + 0,36 ln(PCR+1) + 0,014 global + 0,96.', 'Interpretar no contexto clínico; PCR pode subestimar atividade em alguns fenótipos.'],
    fields: [
      { id: 'tjc28', label: 'Articulações dolorosas 28', ...joints28 },
      { id: 'sjc28', label: 'Articulações edemaciadas 28', ...joints28 },
      { id: 'crpMgL', label: 'PCR mg/L', min: 0, max: 200, step: 0.1 },
      { id: 'patientGlobal100', label: 'Global paciente 0–100 mm', ...vas0100 },
    ],
    calculate: (v) => round(0.56 * Math.sqrt(v.tjc28 || 0) + 0.28 * Math.sqrt(v.sjc28 || 0) + 0.36 * Math.log((v.crpMgL || 0) + 1) + 0.014 * (v.patientGlobal100 || 0) + 0.96),
    interpret: (s) => {
      if (s < 2.6) return { label: 'Remissão', severity: 'remission', clinicalNote: 'Remissão por DAS28-PCR; confirmar com exame articular e contexto.' };
      if (s <= 3.2) return { label: 'Baixa atividade', severity: 'low', clinicalNote: 'Baixa atividade por DAS28-PCR.' };
      if (s <= 5.1) return { label: 'Atividade moderada', severity: 'moderate', clinicalNote: 'Atividade moderada por DAS28-PCR.' };
      return { label: 'Alta atividade', severity: 'high', clinicalNote: 'Alta atividade por DAS28-PCR.' };
    },
  },
  {
    id: 'cdai',
    name: 'CDAI',
    area: 'Artrite Reumatoide',
    description: 'Índice clínico de atividade da doença sem reagentes de fase aguda.',
    unit: 'pontos',
    precision: 1,
    references: ['CDAI = TJC28 + SJC28 + global paciente 0–10 + global médico 0–10.', 'Cortes usuais: remissão ≤2,8; baixa ≤10; moderada ≤22; alta >22.'],
    fields: [
      { id: 'tjc28', label: 'Articulações dolorosas 28', ...joints28 },
      { id: 'sjc28', label: 'Articulações edemaciadas 28', ...joints28 },
      { id: 'patientGlobal10', label: 'Global paciente 0–10', ...vas010 },
      { id: 'physicianGlobal10', label: 'Global médico 0–10', ...vas010 },
    ],
    calculate: (v) => round(sum(v, ['tjc28', 'sjc28', 'patientGlobal10', 'physicianGlobal10']), 1),
    interpret: (s) => {
      if (s <= 2.8) return { label: 'Remissão', severity: 'remission', clinicalNote: 'Remissão clínica por CDAI.' };
      if (s <= 10) return { label: 'Baixa atividade', severity: 'low', clinicalNote: 'Baixa atividade por CDAI.' };
      if (s <= 22) return { label: 'Atividade moderada', severity: 'moderate', clinicalNote: 'Atividade moderada por CDAI.' };
      return { label: 'Alta atividade', severity: 'high', clinicalNote: 'Alta atividade por CDAI.' };
    },
  },
  {
    id: 'sdai',
    name: 'SDAI',
    area: 'Artrite Reumatoide',
    description: 'Índice simplificado com PCR em mg/dL.',
    unit: 'pontos',
    precision: 1,
    references: ['SDAI = TJC28 + SJC28 + global paciente + global médico + PCR mg/dL.', 'Cortes usuais: remissão ≤3,3; baixa ≤11; moderada ≤26; alta >26.'],
    fields: [
      { id: 'tjc28', label: 'Articulações dolorosas 28', ...joints28 },
      { id: 'sjc28', label: 'Articulações edemaciadas 28', ...joints28 },
      { id: 'patientGlobal10', label: 'Global paciente 0–10', ...vas010 },
      { id: 'physicianGlobal10', label: 'Global médico 0–10', ...vas010 },
      { id: 'crpMgDl', label: 'PCR mg/dL', min: 0, max: 30, step: 0.1 },
    ],
    calculate: (v) => round(sum(v, ['tjc28', 'sjc28', 'patientGlobal10', 'physicianGlobal10', 'crpMgDl']), 1),
    interpret: (s) => {
      if (s <= 3.3) return { label: 'Remissão', severity: 'remission', clinicalNote: 'Remissão por SDAI.' };
      if (s <= 11) return { label: 'Baixa atividade', severity: 'low', clinicalNote: 'Baixa atividade por SDAI.' };
      if (s <= 26) return { label: 'Atividade moderada', severity: 'moderate', clinicalNote: 'Atividade moderada por SDAI.' };
      return { label: 'Alta atividade', severity: 'high', clinicalNote: 'Alta atividade por SDAI.' };
    },
  },
  {
    id: 'basdai',
    name: 'BASDAI',
    area: 'Espondiloartrite',
    description: 'Índice de atividade da espondilite/espondiloartrite axial, 0–10.',
    unit: 'pontos',
    precision: 1,
    references: ['BASDAI usa fadiga, dor axial, dor/edema periférico, entesite e média das duas questões de rigidez matinal.', 'BASDAI ≥4 costuma sugerir atividade relevante/subcontrole.'],
    fields: [
      { id: 'fatigue', label: 'Fadiga', ...vas010 },
      { id: 'spinalPain', label: 'Dor axial', ...vas010 },
      { id: 'peripheralPain', label: 'Dor/edema periférico', ...vas010 },
      { id: 'enthesitis', label: 'Entesite', ...vas010 },
      { id: 'morningStiffnessSeverity', label: 'Rigidez matinal — intensidade', ...vas010 },
      { id: 'morningStiffnessDuration', label: 'Rigidez matinal — duração', ...vas010 },
    ],
    calculate: (v) => round((sum(v, ['fatigue', 'spinalPain', 'peripheralPain', 'enthesitis']) + ((v.morningStiffnessSeverity || 0) + (v.morningStiffnessDuration || 0)) / 2) / 5, 1),
    interpret: (s) => s < 4
      ? { label: 'Menor atividade', severity: 'low', clinicalNote: 'BASDAI abaixo de 4; correlacionar com ASDAS, exame e imagem se necessário.' }
      : { label: 'Atividade relevante', severity: 'high', clinicalNote: 'BASDAI ≥4 sugere doença ativa/subcontrole em contexto clínico apropriado.' },
  },
  {
    id: 'asdas_crp',
    name: 'ASDAS-PCR',
    area: 'Espondiloartrite',
    description: 'Ankylosing Spondylitis Disease Activity Score com PCR em mg/L.',
    unit: 'pontos',
    precision: 2,
    references: ['ASDAS-PCR combina dor axial, duração da rigidez, global do paciente, dor/edema periférico e ln(PCR+1).', 'Cortes usuais: inativa <1,3; moderada <2,1; alta ≤3,5; muito alta >3,5.'],
    fields: [
      { id: 'backPain', label: 'Dor lombar/axial 0–10', ...vas010 },
      { id: 'morningStiffnessDuration', label: 'Duração da rigidez 0–10', ...vas010 },
      { id: 'patientGlobal10', label: 'Global paciente 0–10', ...vas010 },
      { id: 'peripheralPain', label: 'Dor/edema periférico 0–10', ...vas010 },
      { id: 'crpMgL', label: 'PCR mg/L', min: 0, max: 200, step: 0.1 },
    ],
    calculate: (v) => round(0.121 * (v.backPain || 0) + 0.110 * (v.patientGlobal10 || 0) + 0.073 * (v.peripheralPain || 0) + 0.058 * (v.morningStiffnessDuration || 0) + 0.579 * Math.log((v.crpMgL || 0) + 1), 2),
    interpret: (s) => {
      if (s < 1.3) return { label: 'Doença inativa', severity: 'remission', clinicalNote: 'ASDAS compatível com doença inativa.' };
      if (s < 2.1) return { label: 'Atividade moderada', severity: 'moderate', clinicalNote: 'ASDAS com atividade moderada.' };
      if (s <= 3.5) return { label: 'Alta atividade', severity: 'high', clinicalNote: 'ASDAS com alta atividade.' };
      return { label: 'Muito alta atividade', severity: 'very-high', clinicalNote: 'ASDAS muito alto; revisar sinais de atividade, mimetizadores e conduta.' };
    },
  },
  {
    id: 'sledai_2k_operational',
    name: 'SLEDAI-2K operacional',
    area: 'Lúpus',
    description: 'Checklist ponderado de atividade lúpica inspirado no SLEDAI-2K para apoio longitudinal.',
    unit: 'pontos',
    precision: 0,
    references: ['SLEDAI-2K é instrumento validado; esta implementação operacional requer conferência clínica dos descritores.', 'Maior pontuação sugere maior atividade e necessidade de revisão contextual.'],
    fields: [
      { id: 'seizure_psychosis_cva', label: 'Neuro grave: convulsão/psicose/AVC', kind: 'boolean' },
      { id: 'vasculitis', label: 'Vasculite', kind: 'boolean' },
      { id: 'arthritis', label: 'Artrite', kind: 'boolean' },
      { id: 'myositis', label: 'Miosite', kind: 'boolean' },
      { id: 'urinary_casts', label: 'Cilindros urinários', kind: 'boolean' },
      { id: 'hematuria_proteinuria_pyuria', label: 'Hematúria/proteinúria/piúria', kind: 'boolean' },
      { id: 'rash_alopecia_ulcers', label: 'Rash/alopecia/úlceras mucosas', kind: 'boolean' },
      { id: 'low_complement_or_antidsdna', label: 'Complemento baixo ou anti-dsDNA alto', kind: 'boolean' },
      { id: 'fever_thrombocytopenia_leukopenia', label: 'Febre/trombocitopenia/leucopenia', kind: 'boolean' },
    ],
    calculate: (v) => round(
      8 * binary(v.seizure_psychosis_cva) +
      8 * binary(v.vasculitis) +
      4 * binary(v.arthritis) +
      4 * binary(v.myositis) +
      4 * binary(v.urinary_casts) +
      4 * binary(v.hematuria_proteinuria_pyuria) +
      2 * binary(v.rash_alopecia_ulcers) +
      2 * binary(v.low_complement_or_antidsdna) +
      1 * binary(v.fever_thrombocytopenia_leukopenia),
      0,
    ),
    interpret: (s) => {
      if (s === 0) return { label: 'Sem atividade capturada', severity: 'remission', clinicalNote: 'Nenhum item ativo informado; não exclui atividade não capturada.' };
      if (s <= 5) return { label: 'Baixa atividade operacional', severity: 'low', clinicalNote: 'Baixa atividade operacional; conferir descritores formais e tendência.' };
      if (s <= 10) return { label: 'Atividade moderada', severity: 'moderate', clinicalNote: 'Atividade moderada; revisar órgãos-alvo, urina, complemento e anti-dsDNA.' };
      return { label: 'Alta atividade', severity: 'high', clinicalNote: 'Alta atividade operacional; exige avaliação clínica prioritária.' };
    },
  },
  {
    id: 'acr_eular_ra_2010',
    name: 'ACR/EULAR 2010 AR',
    area: 'Classificação',
    description: 'Classificação de artrite reumatoide em pacientes com sinovite clínica não melhor explicada por outra doença.',
    unit: 'pontos',
    precision: 0,
    references: ['Critério classificatório, não diagnóstico isolado. Pontuação ≥6/10 classifica AR em contexto apropriado.', 'Domínios: articulações, sorologia, fase aguda e duração dos sintomas.'],
    fields: [
      { id: 'jointScore', label: 'Articulações', kind: 'select', options: [
        { label: '1 grande articulação = 0', value: 0 },
        { label: '2–10 grandes = 1', value: 1 },
        { label: '1–3 pequenas = 2', value: 2 },
        { label: '4–10 pequenas = 3', value: 3 },
        { label: '>10 articulações, incluindo pequena = 5', value: 5 },
      ] },
      { id: 'serologyScore', label: 'Sorologia RF/ACPA', kind: 'select', options: [
        { label: 'Negativos = 0', value: 0 },
        { label: 'Baixo positivo = 2', value: 2 },
        { label: 'Alto positivo = 3', value: 3 },
      ] },
      { id: 'acutePhaseScore', label: 'PCR/VHS', kind: 'select', options: [
        { label: 'Normais = 0', value: 0 },
        { label: 'Alterados = 1', value: 1 },
      ] },
      { id: 'durationScore', label: 'Duração dos sintomas', kind: 'select', options: [
        { label: '<6 semanas = 0', value: 0 },
        { label: '≥6 semanas = 1', value: 1 },
      ] },
    ],
    calculate: (v) => round(sum(v, ['jointScore', 'serologyScore', 'acutePhaseScore', 'durationScore']), 0),
    interpret: (s) => s >= 6
      ? { label: 'Classifica AR', severity: 'positive', clinicalNote: 'Pontuação ≥6/10 classifica AR se houver sinovite clínica e exclusão de melhor explicação.' }
      : { label: 'Não classifica isoladamente', severity: 'negative', clinicalNote: 'Pontuação <6 não classifica isoladamente; reavaliar evolução, imagem e diferenciais.' },
  },
  {
    id: 'acr_1990_fibromyalgia',
    name: 'Fibromialgia 2016 WPI/SSS',
    area: 'Dor e função',
    description: 'Critérios ACR 2016 operacionalizados com WPI, SSS e duração.',
    unit: 'pontos',
    precision: 0,
    references: ['Critérios revisados de fibromialgia: WPI ≥7 e SSS ≥5, ou WPI 4–6 e SSS ≥9, sintomas generalizados e duração ≥3 meses.', 'Ferramenta de triagem/classificação; avaliar diagnósticos diferenciais e comorbidades.'],
    fields: [
      { id: 'wpi', label: 'WPI 0–19', min: 0, max: 19, step: 1 },
      { id: 'sss', label: 'SSS 0–12', min: 0, max: 12, step: 1 },
      { id: 'generalizedPain', label: 'Dor generalizada em ≥4/5 regiões', kind: 'boolean' },
      { id: 'duration3m', label: 'Sintomas há ≥3 meses', kind: 'boolean' },
    ],
    calculate: (v) => round((v.wpi || 0) + (v.sss || 0), 0),
    interpret: (_s, v) => {
      const criteria = (((v.wpi || 0) >= 7 && (v.sss || 0) >= 5) || ((v.wpi || 0) >= 4 && (v.wpi || 0) <= 6 && (v.sss || 0) >= 9)) && Boolean(v.generalizedPain) && Boolean(v.duration3m);
      return criteria
        ? { label: 'Preenche critérios operacionais', severity: 'positive', clinicalNote: 'Preenche critérios WPI/SSS operacionais; confirmar contexto clínico e diferenciais.' }
        : { label: 'Não preenche critérios operacionais', severity: 'negative', clinicalNote: 'Não preenche critérios completos; revisar regiões dolorosas, SSS, duração e diagnósticos diferenciais.' };
    },
  },
  {
    id: 'fiqr_short',
    name: 'FIQR curto operacional',
    area: 'Dor e função',
    description: 'Triagem operacional inspirada no FIQR para impacto de fibromialgia. Não substitui o FIQR completo validado.',
    unit: 'pontos',
    precision: 1,
    references: ['Instrumento operacional interno para acompanhamento sintomático; para pesquisa, usar FIQR completo validado.', 'Maior pontuação indica maior impacto funcional/sintomático.'],
    fields: [
      { id: 'function', label: 'Impacto funcional 0–10', ...vas010 },
      { id: 'overallImpact', label: 'Impacto global 0–10', ...vas010 },
      { id: 'pain', label: 'Dor 0–10', ...vas010 },
      { id: 'fatigue', label: 'Fadiga 0–10', ...vas010 },
      { id: 'sleep', label: 'Sono não reparador 0–10', ...vas010 },
      { id: 'cognition', label: 'Cognição/fibrofog 0–10', ...vas010 },
    ],
    calculate: (v) => round(sum(v, ['function', 'overallImpact', 'pain', 'fatigue', 'sleep', 'cognition']) * (100 / 60), 1),
    interpret: (s) => {
      if (s < 33) return { label: 'Impacto menor', severity: 'low', clinicalNote: 'Baixo impacto operacional; acompanhar evolução longitudinal.' };
      if (s < 66) return { label: 'Impacto moderado', severity: 'moderate', clinicalNote: 'Impacto moderado; avaliar sono, humor, atividade física e comorbidades.' };
      return { label: 'Impacto alto', severity: 'high', clinicalNote: 'Impacto alto; exige plano multidimensional e avaliação clínica completa.' };
    },
  },
  {
    id: 'frax_clinical_risk_operational',
    name: 'FRAX risco clínico operacional',
    area: 'Osteoporose',
    description: 'Contagem operacional de fatores de risco usados em raciocínio FRAX. Não substitui o cálculo FRAX oficial.',
    unit: 'fatores',
    precision: 0,
    references: ['Ferramenta de organização clínica; use FRAX oficial calibrado para o país quando necessário.', 'Integra idade, IMC e fatores de risco para orientar investigação e decisão compartilhada.'],
    fields: [
      { id: 'ageRisk', label: 'Idade ≥65 anos', kind: 'boolean' },
      { id: 'lowBmi', label: 'IMC <20 kg/m²', kind: 'boolean' },
      { id: 'priorFracture', label: 'Fratura prévia por fragilidade', kind: 'boolean' },
      { id: 'parentHipFracture', label: 'Pai/mãe com fratura de quadril', kind: 'boolean' },
      { id: 'currentSmoking', label: 'Tabagismo atual', kind: 'boolean' },
      { id: 'glucocorticoid', label: 'Glicocorticoide sistêmico ≥3 meses', kind: 'boolean' },
      { id: 'secondaryOsteoporosis', label: 'Osteoporose secundária', kind: 'boolean' },
      { id: 'alcohol', label: 'Álcool ≥3 unidades/dia', kind: 'boolean' },
    ],
    calculate: (v) => round(sum(v, ['ageRisk', 'lowBmi', 'priorFracture', 'parentHipFracture', 'currentSmoking', 'glucocorticoid', 'secondaryOsteoporosis', 'alcohol']), 0),
    interpret: (s, v) => {
      if (v.priorFracture || v.glucocorticoid || s >= 4) return { label: 'Risco clínico aumentado', severity: 'high', clinicalNote: 'Priorizar avaliação formal com DXA/FRAX oficial e causas secundárias conforme contexto.' };
      if (s >= 2) return { label: 'Risco intermediário', severity: 'moderate', clinicalNote: 'Considerar DXA/FRAX oficial conforme idade, sexo e fatores associados.' };
      return { label: 'Menor carga de fatores', severity: 'low', clinicalNote: 'Menor carga de fatores informados; não exclui risco por idade, queda ou DMO.' };
    },
  },
  {
    id: 'immunosuppression_safety_check',
    name: 'Checklist segurança imunossupressão',
    area: 'Segurança terapêutica',
    description: 'Checklist operacional antes de imunossupressores/biológicos/JAK. Não substitui protocolo local.',
    unit: 'pendências',
    precision: 0,
    references: ['Checklist operacional para reduzir omissões antes de imunossupressão.', 'Adaptar a protocolos locais, vacinação, rastreios infecciosos e perfil do fármaco.'],
    fields: [
      { id: 'tbMissing', label: 'Rastreio TB pendente', kind: 'boolean' },
      { id: 'hbvMissing', label: 'HBV pendente', kind: 'boolean' },
      { id: 'hcvHivMissing', label: 'HCV/HIV pendente se indicado', kind: 'boolean' },
      { id: 'vaccinesMissing', label: 'Vacinas pendentes/sem revisão', kind: 'boolean' },
      { id: 'pregnancyRiskMissing', label: 'Gestação/contracepção não revisada quando aplicável', kind: 'boolean' },
      { id: 'baselineLabsMissing', label: 'Hemograma/renal/hepático pendentes', kind: 'boolean' },
      { id: 'drugInteractionMissing', label: 'Interações/contraindicações não revisadas', kind: 'boolean' },
    ],
    calculate: (v) => round(sum(v, ['tbMissing', 'hbvMissing', 'hcvHivMissing', 'vaccinesMissing', 'pregnancyRiskMissing', 'baselineLabsMissing', 'drugInteractionMissing']), 0),
    interpret: (s) => {
      if (s === 0) return { label: 'Sem pendências registradas', severity: 'low', clinicalNote: 'Nenhuma pendência marcada; conferir documentação e protocolo institucional.' };
      if (s <= 2) return { label: 'Pendências limitadas', severity: 'moderate', clinicalNote: 'Resolver pendências antes de iniciar/renovar quando clinicamente relevante.' };
      return { label: 'Múltiplas pendências', severity: 'high', clinicalNote: 'Evitar início automático até revisar segurança, infecção, vacinas e exames basais.' };
    },
  },
];

export function createInitialValues(score: ClinicalScoreDefinition) {
  return score.fields.reduce<Record<string, number>>((acc, field) => {
    acc[field.id] = field.kind === 'select' ? field.options?.[0]?.value ?? 0 : field.min ?? 0;
    return acc;
  }, {});
}

export function getScoreById(id: string) {
  return clinicalScores.find((score) => score.id === id) ?? clinicalScores[0];
}
