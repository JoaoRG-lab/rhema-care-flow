/**
 * Rheumatology Clinical Scores — Pure Logic Layer
 *
 * Educational/clinical support utilities for rheumatology scores.
 * These functions do not replace clinical judgment or in-person care.
 */

export type DiseaseActivity =
  | 'remission'
  | 'low'
  | 'moderate'
  | 'high'
  | 'very_high';

export interface ScoreResult {
  score: number;
  activity: DiseaseActivity;
  label: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
  description: string;
  reference: string;
}

export interface DAS28Input {
  tjc: number;
  sjc: number;
  pga: number;
  reactant: number;
  reactantType: 'crp' | 'esr';
}

export function calcDAS28(input: DAS28Input): ScoreResult {
  const { tjc, sjc, pga, reactant, reactantType } = input;
  const scoreRaw = reactantType === 'crp'
    ? 0.56 * Math.sqrt(tjc) + 0.28 * Math.sqrt(sjc) + 0.36 * Math.log(reactant + 1) + 0.014 * pga + 0.96
    : 0.56 * Math.sqrt(tjc) + 0.28 * Math.sqrt(sjc) + 0.70 * Math.log(Math.max(reactant, 1)) + 0.014 * pga;

  const score = Number(scoreRaw.toFixed(2));

  if (score < 2.6) {
    return { score, activity: 'remission', label: 'Remissão', color: 'green', description: 'DAS28 < 2,6.', reference: 'Prevoo et al. Arthritis Rheum. 1995;38:44-8' };
  }
  if (score < 3.2) {
    return { score, activity: 'low', label: 'Baixa atividade', color: 'green', description: 'DAS28 2,6–3,2.', reference: 'Prevoo et al. Arthritis Rheum. 1995;38:44-8' };
  }
  if (score <= 5.1) {
    return { score, activity: 'moderate', label: 'Atividade moderada', color: 'orange', description: 'DAS28 3,2–5,1.', reference: 'Prevoo et al. Arthritis Rheum. 1995;38:44-8' };
  }
  return { score, activity: 'high', label: 'Alta atividade', color: 'red', description: 'DAS28 > 5,1.', reference: 'Prevoo et al. Arthritis Rheum. 1995;38:44-8' };
}

export interface SDAIInput {
  tjc: number;
  sjc: number;
  pgaPatient: number;
  pgaEvaluator: number;
  crp: number;
}

export function calcSDAI(input: SDAIInput): ScoreResult {
  const score = Number((input.tjc + input.sjc + input.pgaPatient + input.pgaEvaluator + input.crp).toFixed(1));

  if (score <= 3.3) return { score, activity: 'remission', label: 'Remissão', color: 'green', description: 'SDAI ≤ 3,3.', reference: 'Smolen JS et al. Ann Rheum Dis. 2003;62(Suppl 2)' };
  if (score <= 11) return { score, activity: 'low', label: 'Baixa atividade', color: 'green', description: 'SDAI 3,3–11.', reference: 'Smolen JS et al. Ann Rheum Dis. 2003;62(Suppl 2)' };
  if (score <= 26) return { score, activity: 'moderate', label: 'Atividade moderada', color: 'orange', description: 'SDAI 11–26.', reference: 'Smolen JS et al. Ann Rheum Dis. 2003;62(Suppl 2)' };
  return { score, activity: 'high', label: 'Alta atividade', color: 'red', description: 'SDAI > 26.', reference: 'Smolen JS et al. Ann Rheum Dis. 2003;62(Suppl 2)' };
}

export interface CDAIInput {
  tjc: number;
  sjc: number;
  pgaPatient: number;
  pgaEvaluator: number;
}

export function calcCDAI(input: CDAIInput): ScoreResult {
  const score = Number((input.tjc + input.sjc + input.pgaPatient + input.pgaEvaluator).toFixed(1));

  if (score <= 2.8) return { score, activity: 'remission', label: 'Remissão', color: 'green', description: 'CDAI ≤ 2,8.', reference: 'Aletaha D & Smolen JS. Clin Exp Rheumatol. 2005;23(5 Suppl 39)' };
  if (score <= 10) return { score, activity: 'low', label: 'Baixa atividade', color: 'green', description: 'CDAI 2,8–10.', reference: 'Aletaha D & Smolen JS. Clin Exp Rheumatol. 2005;23(5 Suppl 39)' };
  if (score <= 22) return { score, activity: 'moderate', label: 'Atividade moderada', color: 'orange', description: 'CDAI 10–22.', reference: 'Aletaha D & Smolen JS. Clin Exp Rheumatol. 2005;23(5 Suppl 39)' };
  return { score, activity: 'high', label: 'Alta atividade', color: 'red', description: 'CDAI > 22.', reference: 'Aletaha D & Smolen JS. Clin Exp Rheumatol. 2005;23(5 Suppl 39)' };
}

export interface SLEDAI2KInput {
  seizure: boolean;
  psychosis: boolean;
  organic_brain_syndrome: boolean;
  visual_disturbance: boolean;
  cranial_nerve_disorder: boolean;
  lupus_headache: boolean;
  cva: boolean;
  vasculitis: boolean;
  arthritis: boolean;
  myositis: boolean;
  urinary_casts: boolean;
  hematuria: boolean;
  proteinuria: boolean;
  pyuria: boolean;
  rash: boolean;
  alopecia: boolean;
  mucosal_ulcers: boolean;
  pleurisy: boolean;
  pericarditis: boolean;
  low_complement: boolean;
  increased_dna_binding: boolean;
  fever: boolean;
  thrombocytopenia: boolean;
  leukopenia: boolean;
}

const SLEDAI_WEIGHTS: Record<keyof SLEDAI2KInput, number> = {
  seizure: 8,
  psychosis: 8,
  organic_brain_syndrome: 8,
  visual_disturbance: 8,
  cranial_nerve_disorder: 8,
  lupus_headache: 8,
  cva: 8,
  vasculitis: 8,
  arthritis: 4,
  myositis: 4,
  urinary_casts: 4,
  hematuria: 4,
  proteinuria: 4,
  pyuria: 4,
  rash: 2,
  alopecia: 2,
  mucosal_ulcers: 2,
  pleurisy: 2,
  pericarditis: 2,
  low_complement: 2,
  increased_dna_binding: 2,
  fever: 1,
  thrombocytopenia: 1,
  leukopenia: 1,
};

export function calcSLEDAI2K(input: SLEDAI2KInput): ScoreResult {
  const score = (Object.keys(input) as Array<keyof SLEDAI2KInput>).reduce(
    (sum, key) => sum + (input[key] ? SLEDAI_WEIGHTS[key] : 0),
    0,
  );

  if (score === 0) return { score, activity: 'remission', label: 'Inatividade', color: 'green', description: 'SLEDAI-2K = 0.', reference: 'Gladman DD et al. J Rheumatol. 2002;29:288-91' };
  if (score <= 5) return { score, activity: 'low', label: 'Atividade leve', color: 'yellow', description: 'SLEDAI-2K 1–5.', reference: 'Gladman DD et al. J Rheumatol. 2002;29:288-91' };
  if (score <= 10) return { score, activity: 'moderate', label: 'Atividade moderada', color: 'orange', description: 'SLEDAI-2K 6–10.', reference: 'Gladman DD et al. J Rheumatol. 2002;29:288-91' };
  if (score <= 19) return { score, activity: 'high', label: 'Alta atividade', color: 'red', description: 'SLEDAI-2K 11–19.', reference: 'Gladman DD et al. J Rheumatol. 2002;29:288-91' };
  return { score, activity: 'very_high', label: 'Atividade muito alta', color: 'red', description: 'SLEDAI-2K ≥ 20.', reference: 'Gladman DD et al. J Rheumatol. 2002;29:288-91' };
}

export interface BASDAIInput {
  q1_fatigue: number;
  q2_spinal_pain: number;
  q3_peripheral_pain: number;
  q4_enthesitis: number;
  q5_morning_stiffness_severity: number;
  q6_morning_stiffness_duration: number;
}

export function calcBASDAI(input: BASDAIInput): ScoreResult {
  const q56Mean = (input.q5_morning_stiffness_severity + input.q6_morning_stiffness_duration) / 2;
  const score = Number(((input.q1_fatigue + input.q2_spinal_pain + input.q3_peripheral_pain + input.q4_enthesitis + q56Mean) / 5).toFixed(1));

  if (score < 4) return { score, activity: 'low', label: 'Doença inativa / baixa', color: 'green', description: 'BASDAI < 4.', reference: 'Garrett S et al. J Rheumatol. 1994;21:2286-91' };
  return { score, activity: 'high', label: 'Doença ativa', color: 'red', description: 'BASDAI ≥ 4.', reference: 'Garrett S et al. J Rheumatol. 1994;21:2286-91' };
}

export interface ASDASInput {
  back_pain: number;
  morning_stiffness_duration: number;
  patient_global: number;
  peripheral_pain: number;
  crp: number;
}

export function calcASDAS_CRP(input: ASDASInput): ScoreResult {
  const score = Number((
    0.121 * input.back_pain +
    0.058 * input.morning_stiffness_duration +
    0.110 * input.patient_global +
    0.073 * input.peripheral_pain +
    0.579 * Math.log(input.crp + 1)
  ).toFixed(2));

  if (score < 1.3) return { score, activity: 'remission', label: 'Inatividade', color: 'green', description: 'ASDAS < 1,3.', reference: 'van der Heijde D et al. Ann Rheum Dis. 2009;68:1811-8' };
  if (score < 2.1) return { score, activity: 'low', label: 'Baixa atividade', color: 'yellow', description: 'ASDAS 1,3–2,1.', reference: 'van der Heijde D et al. Ann Rheum Dis. 2009;68:1811-8' };
  if (score < 3.5) return { score, activity: 'high', label: 'Alta atividade', color: 'orange', description: 'ASDAS 2,1–3,5.', reference: 'van der Heijde D et al. Ann Rheum Dis. 2009;68:1811-8' };
  return { score, activity: 'very_high', label: 'Atividade muito alta', color: 'red', description: 'ASDAS ≥ 3,5.', reference: 'van der Heijde D et al. Ann Rheum Dis. 2009;68:1811-8' };
}

export interface FRAXInput {
  age: number;
  sex: 'M' | 'F';
  bmi: number;
  previous_fracture: boolean;
  parent_hip_fracture: boolean;
  current_smoker: boolean;
  glucocorticoids: boolean;
  rheumatoid_arthritis: boolean;
  secondary_osteoporosis: boolean;
  alcohol_3_or_more: boolean;
}

export interface FRAXRiskCategory {
  riskCategory: 'low' | 'moderate' | 'high';
  label: string;
  color: 'green' | 'orange' | 'red';
  description: string;
  referToFRAX: boolean;
}

export function calcFRAXRiskCategory(input: FRAXInput): FRAXRiskCategory {
  let riskScore = 0;

  if (input.age >= 80) riskScore += 4;
  else if (input.age >= 70) riskScore += 3;
  else if (input.age >= 65) riskScore += 2;
  else if (input.age >= 55) riskScore += 1;

  if (input.sex === 'F') riskScore += 1;
  if (input.bmi < 19) riskScore += 2;
  else if (input.bmi < 22) riskScore += 1;
  if (input.previous_fracture) riskScore += 2;
  if (input.parent_hip_fracture) riskScore += 1;
  if (input.current_smoker) riskScore += 1;
  if (input.glucocorticoids) riskScore += 2;
  if (input.rheumatoid_arthritis) riskScore += 1;
  if (input.secondary_osteoporosis) riskScore += 1;
  if (input.alcohol_3_or_more) riskScore += 1;

  if (riskScore <= 3) return { riskCategory: 'low', label: 'Baixo risco', color: 'green', description: 'Risco estimado baixo. Usar FRAX oficial para decisão clínica.', referToFRAX: true };
  if (riskScore <= 6) return { riskCategory: 'moderate', label: 'Risco moderado', color: 'orange', description: 'Risco moderado. Calcular FRAX oficial com BMD quando disponível.', referToFRAX: true };
  return { riskCategory: 'high', label: 'Alto risco', color: 'red', description: 'Alto risco estimado. Confirmar com FRAX oficial e avaliação clínica.', referToFRAX: true };
}

export const SCORE_CATALOG = [
  { id: 'das28-crp', name: 'DAS28-PCR', disease: 'Artrite Reumatoide', fn: calcDAS28 },
  { id: 'das28-esr', name: 'DAS28-VHS', disease: 'Artrite Reumatoide', fn: calcDAS28 },
  { id: 'sdai', name: 'SDAI', disease: 'Artrite Reumatoide', fn: calcSDAI },
  { id: 'cdai', name: 'CDAI', disease: 'Artrite Reumatoide', fn: calcCDAI },
  { id: 'sledai2k', name: 'SLEDAI-2K', disease: 'Lúpus Eritematoso', fn: calcSLEDAI2K },
  { id: 'basdai', name: 'BASDAI', disease: 'Espondiloartrite', fn: calcBASDAI },
  { id: 'asdas-crp', name: 'ASDAS-PCR', disease: 'Espondiloartrite', fn: calcASDAS_CRP },
  { id: 'frax', name: 'FRAX (triagem)', disease: 'Osteoporose', fn: calcFRAXRiskCategory },
] as const;
