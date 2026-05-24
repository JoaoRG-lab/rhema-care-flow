/**
 * Rheumatology Clinical Scores — Pure Logic Layer
 * [PERPLEXITY] feat/perplexity-calculadoras-scores
 *
 * References:
 * - DAS28: Prevoo et al. Arthritis Rheum. 1995;38:44-8
 * - SDAI/CDAI: Smolen JS et al. Ann Rheum Dis. 2003;62:S2
 * - SLEDAI-2K: Gladman DD et al. J Rheumatol. 2002;29:288-91
 * - BASDAI: Garrett S et al. J Rheumatol. 1994;21:2286-91
 * - ASDAS-PCR: van der Heijde D et al. Ann Rheum Dis. 2009;68:1811-8
 * - FRAX: Kanis JA et al. Osteoporos Int. 2008;19:385-97
 */

// ─── Tipos compartilhados ────────────────────────────────────────────────────

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

// ─── DAS28 (PCR e VHS) ───────────────────────────────────────────────────────

export interface DAS28Input {
  /** Tender Joint Count 28 (0–28) */
  tjc: number;
  /** Swollen Joint Count 28 (0–28) */
  sjc: number;
  /** Patient Global Assessment mm VAS (0–100) */
  pga: number;
  /** PCR mg/L  OU  VHS mm/h */
  reactant: number;
  /** Tipo de reagente de fase aguda */
  reactantType: 'crp' | 'esr';
}

export function calcDAS28(input: DAS28Input): ScoreResult {
  const { tjc, sjc, pga, reactant, reactantType } = input;
  let score: number;

  if (reactantType === 'crp') {
    // DAS28-PCR: 0.56√TJC + 0.28√SJC + 0.36ln(PCR+1) + 0.014×PGA + 0.96
    score =
      0.56 * Math.sqrt(tjc) +
      0.28 * Math.sqrt(sjc) +
      0.36 * Math.log(reactant + 1) +
      0.014 * pga +
      0.96;
  } else {
    // DAS28-VHS: 0.56√TJC + 0.28√SJC + 0.70ln(VHS) + 0.014×PGA
    score =
      0.56 * Math.sqrt(tjc) +
      0.28 * Math.sqrt(sjc) +
      0.70 * Math.log(Math.max(reactant, 1)) +
      0.014 * pga;
  }

  score = parseFloat(score.toFixed(2));

  if (score < 2.6)
    return { score, activity: 'remission', label: 'Remissão', color: 'green',
      description: 'DAS28 < 2,6 — Critério ACR/EULAR de remissão em AR.',
      reference: 'Prevoo et al. Arthritis Rheum. 1995;38:44-8' };
  if (score < 3.2)
    return { score, activity: 'low', label: 'Baixa atividade', color: 'green',
      description: 'DAS28 2,6–3,2 — Baixa atividade de doença.',
      reference: 'Prevoo et al. Arthritis Rheum. 1995;38:44-8' };
  if (score < 5.1)
    return { score, activity: 'moderate', label: 'Atividade moderada', color: 'orange',
      description: 'DAS28 3,2–5,1 — Atividade moderada; considerar escalonamento.',
      reference: 'Prevoo et al. Arthritis Rheum. 1995;38:44-8' };
  return { score, activity: 'high', label: 'Alta atividade', color: 'red',
    description: 'DAS28 ≥ 5,1 — Alta atividade; rever DMARD/biológico.',
    reference: 'Prevoo et al. Arthritis Rheum. 1995;38:44-8' };
}

// ─── SDAI ────────────────────────────────────────────────────────────────────

export interface SDAIInput {
  tjc: number;
  sjc: number;
  /** Patient Global Assessment 0–10 cm VAS */
  pgaPatient: number;
  /** Evaluator Global Assessment 0–10 cm VAS */
  pgaEvaluator: number;
  /** PCR mg/dL */
  crp: number;
}

export function calcSDAI(input: SDAIInput): ScoreResult {
  const score = parseFloat(
    (input.tjc + input.sjc + input.pgaPatient + input.pgaEvaluator + input.crp).toFixed(1)
  );

  if (score <= 3.3)
    return { score, activity: 'remission', label: 'Remissão', color: 'green',
      description: 'SDAI ≤ 3,3 — Remissão SDAI (critério ACR/EULAR 2011).',
      reference: 'Smolen JS et al. Ann Rheum Dis. 2003;62(Suppl 2)' };
  if (score <= 11)
    return { score, activity: 'low', label: 'Baixa atividade', color: 'green',
      description: 'SDAI 3,3–11 — Baixa atividade.',
      reference: 'Smolen JS et al. Ann Rheum Dis. 2003;62(Suppl 2)' };
  if (score <= 26)
    return { score, activity: 'moderate', label: 'Atividade moderada', color: 'orange',
      description: 'SDAI 11–26 — Atividade moderada.',
      reference: 'Smolen JS et al. Ann Rheum Dis. 2003;62(Suppl 2)' };
  return { score, activity: 'high', label: 'Alta atividade', color: 'red',
    description: 'SDAI > 26 — Alta atividade.',
    reference: 'Smolen JS et al. Ann Rheum Dis. 2003;62(Suppl 2)' };
}

// ─── CDAI ────────────────────────────────────────────────────────────────────

export interface CDAIInput {
  tjc: number;
  sjc: number;
  pgaPatient: number;  // 0–10
  pgaEvaluator: number; // 0–10
}

export function calcCDAI(input: CDAIInput): ScoreResult {
  const score = parseFloat(
    (input.tjc + input.sjc + input.pgaPatient + input.pgaEvaluator).toFixed(1)
  );

  if (score <= 2.8)
    return { score, activity: 'remission', label: 'Remissão', color: 'green',
      description: 'CDAI ≤ 2,8 — Remissão CDAI (sem necessidade de PCR).',
      reference: 'Aletaha D & Smolen JS. Clin Exp Rheumatol. 2005;23(5 Suppl 39)' };
  if (score <= 10)
    return { score, activity: 'low', label: 'Baixa atividade', color: 'green',
      description: 'CDAI 2,8–10.',
      reference: 'Aletaha D & Smolen JS. Clin Exp Rheumatol. 2005;23(5 Suppl 39)' };
  if (score <= 22)
    return { score, activity: 'moderate', label: 'Atividade moderada', color: 'orange',
      description: 'CDAI 10–22.',
      reference: 'Aletaha D & Smolen JS. Clin Exp Rheumatol. 2005;23(5 Suppl 39)' };
  return { score, activity: 'high', label: 'Alta atividade', color: 'red',
    description: 'CDAI > 22.',
    reference: 'Aletaha D & Smolen JS. Clin Exp Rheumatol. 2005;23(5 Suppl 39)' };
}

// ─── SLEDAI-2K ───────────────────────────────────────────────────────────────

/**
 * Itens SLEDAI-2K com seus pesos.
 * Clínico marca presença (true/false) nas últimas 30 dias (alguns 10 dias).
 */
export interface SLEDAI2KInput {
  // CNS (peso 8 cada)
  seizure: boolean;
  psychosis: boolean;
  organic_brain_syndrome: boolean;
  visual_disturbance: boolean;
  cranial_nerve_disorder: boolean;
  lupus_headache: boolean;
  cva: boolean;
  vasculitis: boolean; // peso 8
  // Musculoesquelético (peso 4)
  arthritis: boolean;
  myositis: boolean;
  // Renal (peso 4)
  urinary_casts: boolean;
  hematuria: boolean;
  proteinuria: boolean;
  pyuria: boolean;
  // Pele (peso 2)
  rash: boolean;
  alopecia: boolean;
  mucosal_ulcers: boolean;
  pleurisy: boolean;
  pericarditis: boolean;
  // Imunológico (peso 2)
  low_complement: boolean;
  increased_dna_binding: boolean;
  // Hematológico (peso 1)
  fever: boolean;
  thrombocytopenia: boolean;
  leukopenia: boolean;
}

const SLEDAI_WEIGHTS: Record<keyof SLEDAI2KInput, number> = {
  seizure: 8, psychosis: 8, organic_brain_syndrome: 8, visual_disturbance: 8,
  cranial_nerve_disorder: 8, lupus_headache: 8, cva: 8, vasculitis: 8,
  arthritis: 4, myositis: 4,
  urinary_casts: 4, hematuria: 4, proteinuria: 4, pyuria: 4,
  rash: 2, alopecia: 2, mucosal_ulcers: 2, pleurisy: 2, pericarditis: 2,
  low_complement: 2, increased_dna_binding: 2,
  fever: 1, thrombocytopenia: 1, leukopenia: 1,
};

export function calcSLEDAI2K(input: SLEDAI2KInput): ScoreResult {
  const score = (Object.keys(input) as Array<keyof SLEDAI2KInput>).reduce(
    (sum, key) => sum + (input[key] ? SLEDAI_WEIGHTS[key] : 0),
    0
  );

  if (score === 0)
    return { score, activity: 'remission', label: 'Inatividade', color: 'green',
      description: 'SLEDAI-2K = 0 — Lúpus inativo.',
      reference: 'Gladman DD et al. J Rheumatol. 2002;29:288-91' };
  if (score <= 5)
    return { score, activity: 'low', label: 'Atividade leve', color: 'yellow',
      description: 'SLEDAI-2K 1–5 — Atividade leve.',
      reference: 'Gladman DD et al. J Rheumatol. 2002;29:288-91' };
  if (score <= 10)
    return { score, activity: 'moderate', label: 'Atividade moderada', color: 'orange',
      description: 'SLEDAI-2K 6–10 — Mudança de manejo geralmente indicada.',
      reference: 'Gladman DD et al. J Rheumatol. 2002;29:288-91' };
  if (score <= 19)
    return { score, activity: 'high', label: 'Alta atividade', color: 'red',
      description: 'SLEDAI-2K 11–19 — Alta atividade; rever imunossupressão.',
      reference: 'Gladman DD et al. J Rheumatol. 2002;29:288-91' };
  return { score, activity: 'very_high', label: 'Atividade muito alta', color: 'red',
    description: 'SLEDAI-2K ≥ 20 — Atividade muito alta / risco de órgão.',
    reference: 'Gladman DD et al. J Rheumatol. 2002;29:288-91' };
}

// ─── BASDAI ──────────────────────────────────────────────────────────────────

/**
 * 6 perguntas VAS 0–10.
 * Q5 e Q6 são calculadas como média (rigidez matinal).
 */
export interface BASDAIInput {
  q1_fatigue: number;          // 0–10
  q2_spinal_pain: number;      // 0–10
  q3_peripheral_pain: number;  // 0–10
  q4_enthesitis: number;       // 0–10
  q5_morning_stiffness_severity: number; // 0–10
  q6_morning_stiffness_duration: number; // 0–10
}

export function calcBASDAI(input: BASDAIInput): ScoreResult {
  const q56_mean = (input.q5_morning_stiffness_severity + input.q6_morning_stiffness_duration) / 2;
  const score = parseFloat(
    ((input.q1_fatigue + input.q2_spinal_pain + input.q3_peripheral_pain + input.q4_enthesitis + q56_mean) / 5).toFixed(1)
  );

  if (score < 4)
    return { score, activity: 'low', label: 'Doença inativa / baixa', color: 'green',
      description: 'BASDAI < 4 — Doença relativamente controlada.',
      reference: 'Garrett S et al. J Rheumatol. 1994;21:2286-91' };
  return { score, activity: 'high', label: 'Doença ativa', color: 'red',
    description: 'BASDAI ≥ 4 — Critério para considerar terapia biológica em EspA axial (ASAS/EULAR).',
    reference: 'Garrett S et al. J Rheumatol. 1994;21:2286-91' };
}

// ─── ASDAS-PCR ───────────────────────────────────────────────────────────────

export interface ASDASInput {
  /** Dor lombar 0–10 NRS */
  back_pain: number;
  /** Duração rigidez matinal 0–10 */
  morning_stiffness_duration: number;
  /** Avaliação global do paciente 0–10 */
  patient_global: number;
  /** Dor/edema periférico 0–10 */
  peripheral_pain: number;
  /** PCR mg/L */
  crp: number;
}

export function calcASDAS_CRP(input: ASDASInput): ScoreResult {
  // ASDAS-PCR: 0.12×back_pain + 0.06×morning_stiffness + 0.11×patient_global + 0.07×peripheral + 0.58×ln(PCR+1)
  const score = parseFloat((
    0.12 * input.back_pain +
    0.06 * input.morning_stiffness_duration +
    0.11 * input.patient_global +
    0.07 * input.peripheral_pain +
    0.58 * Math.log(input.crp + 1)
  ).toFixed(2));

  if (score < 1.3)
    return { score, activity: 'remission', label: 'Inatividade', color: 'green',
      description: 'ASDAS < 1,3 — Doença inativa.',
      reference: 'van der Heijde D et al. Ann Rheum Dis. 2009;68:1811-8' };
  if (score < 2.1)
    return { score, activity: 'low', label: 'Baixa atividade', color: 'yellow',
      description: 'ASDAS 1,3–2,1.',
      reference: 'van der Heijde D et al. Ann Rheum Dis. 2009;68:1811-8' };
  if (score < 3.5)
    return { score, activity: 'moderate', label: 'Alta atividade', color: 'orange',
      description: 'ASDAS 2,1–3,5 — Alta atividade.',
      reference: 'van der Heijde D et al. Ann Rheum Dis. 2009;68:1811-8' };
  return { score, activity: 'very_high', label: 'Atividade muito alta', color: 'red',
    description: 'ASDAS ≥ 3,5 — Atividade muito alta.',
    reference: 'van der Heijde D et al. Ann Rheum Dis. 2009;68:1811-8' };
}

// ─── FRAX (estimativa simplificada — sem BMD) ─────────────────────────────────

export interface FRAXInput {
  age: number;        // 40–90 anos
  sex: 'M' | 'F';
  bmi: number;        // kg/m²
  previous_fracture: boolean;
  parent_hip_fracture: boolean;
  current_smoker: boolean;
  glucocorticoids: boolean;
  rheumatoid_arthritis: boolean;
  secondary_osteoporosis: boolean;
  alcohol_3_or_more: boolean;
}

/**
 * Estimativa clínica simplificada do risco FRAX em 10 anos.
 * ATENÇÃO: esta é uma aproximação educacional.
 * Para risco preciso, usar o calculador oficial em https://www.sheffield.ac.uk/FRAX/
 */
export function calcFRAXRiskCategory(input: FRAXInput): {
  riskCategory: 'low' | 'moderate' | 'high';
  label: string;
  color: 'green' | 'orange' | 'red';
  description: string;
  referToFRAX: boolean;
} {
  let riskScore = 0;

  // Idade: maior peso acima de 65
  if (input.age >= 80) riskScore += 4;
  else if (input.age >= 70) riskScore += 3;
  else if (input.age >= 65) riskScore += 2;
  else if (input.age >= 55) riskScore += 1;

  // Sexo feminino
  if (input.sex === 'F') riskScore += 1;

  // IMC baixo
  if (input.bmi < 19) riskScore += 2;
  else if (input.bmi < 22) riskScore += 1;

  // Fatores de risco independentes
  if (input.previous_fracture) riskScore += 2;
  if (input.parent_hip_fracture) riskScore += 1;
  if (input.current_smoker) riskScore += 1;
  if (input.glucocorticoids) riskScore += 2;
  if (input.rheumatoid_arthritis) riskScore += 1;
  if (input.secondary_osteoporosis) riskScore += 1;
  if (input.alcohol_3_or_more) riskScore += 1;

  if (riskScore <= 3)
    return { riskCategory: 'low', label: 'Baixo risco', color: 'green',
      description: 'Risco estimado baixo. Manter ingestão de cálcio/vitamina D e atividade física.',
      referToFRAX: false };
  if (riskScore <= 6)
    return { riskCategory: 'moderate', label: 'Risco moderado', color: 'orange',
      description: 'Risco moderado. Calcular FRAX completo com BMD se disponível.',
      referToFRAX: true };
  return { riskCategory: 'high', label: 'Alto risco', color: 'red',
    description: 'Alto risco. Calcular FRAX completo e considerar densitometria + tratamento.',
    referToFRAX: true };
}

// ─── Exportação centralizada ─────────────────────────────────────────────────

export const SCORE_CATALOG = [
  { id: 'das28-crp',   name: 'DAS28-PCR',    disease: 'Artrite Reumatoide',    fn: calcDAS28 },
  { id: 'das28-esr',   name: 'DAS28-VHS',    disease: 'Artrite Reumatoide',    fn: calcDAS28 },
  { id: 'sdai',        name: 'SDAI',          disease: 'Artrite Reumatoide',    fn: calcSDAI },
  { id: 'cdai',        name: 'CDAI',          disease: 'Artrite Reumatoide',    fn: calcCDAI },
  { id: 'sledai2k',    name: 'SLEDAI-2K',     disease: 'Lúpus Eritematoso',     fn: calcSLEDAI2K },
  { id: 'basdai',      name: 'BASDAI',        disease: 'Espondiloartrite',       fn: calcBASDAI },
  { id: 'asdas-crp',   name: 'ASDAS-PCR',     disease: 'Espondiloartrite',       fn: calcASDAS_CRP },
  { id: 'frax',        name: 'FRAX (triagem)', disease: 'Osteoporose',            fn: calcFRAXRiskCategory },
] as const;
