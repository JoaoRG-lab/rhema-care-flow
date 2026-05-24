/**
 * Rheumatology Clinical Scores — Pure Logic Layer
 *
 * Educational/clinical support utilities for rheumatology scores.
 * These functions do not replace clinical judgment or in-person care.
 *
 * Scores incluídos:
 *   AR  → DAS28-PCR, DAS28-VHS, SDAI, CDAI, HAQ-DI
 *   LES → SLEDAI-2K
 *   SpA → BASDAI, ASDAS-PCR, ASDAS-VHS
 *   Osteoporose → FRAX (triagem educacional)
 */

// ---------------------------------------------------------------------------
// Tipos base
// ---------------------------------------------------------------------------

export type DiseaseActivity =
  | 'remission'
  | 'low'
  | 'moderate'
  | 'high'
  | 'very_high';

export type DiseaseName =
  | 'Artrite Reumatoide'
  | 'Lúpus Eritematoso'
  | 'Espondiloartrite'
  | 'Osteoporose';

export type ScoreId =
  | 'das28-crp'
  | 'das28-esr'
  | 'sdai'
  | 'cdai'
  | 'haq-di'
  | 'sledai2k'
  | 'basdai'
  | 'asdas-crp'
  | 'asdas-esr'
  | 'frax';

export interface ScoreResult {
  score: number;
  activity: DiseaseActivity;
  label: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
  description: string;
  reference: string;
}

// ---------------------------------------------------------------------------
// Utilitário de validação
// ---------------------------------------------------------------------------

function assertRange(value: number, min: number, max: number, field: string): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${field} deve estar entre ${min} e ${max} (recebido: ${value})`);
  }
}

// ---------------------------------------------------------------------------
// DAS28  (AR)
// ---------------------------------------------------------------------------

export interface DAS28Input {
  /** Tender joint count 0–28 */
  tjc: number;
  /** Swollen joint count 0–28 */
  sjc: number;
  /** Patient global assessment 0–100 mm VAS */
  pga: number;
  /** CRP (mg/L) ou ESR (mm/h) conforme reactantType */
  reactant: number;
  reactantType: 'crp' | 'esr';
}

export function calcDAS28(input: DAS28Input): ScoreResult {
  const { tjc, sjc, pga, reactant, reactantType } = input;

  assertRange(tjc, 0, 28, 'DAS28.tjc');
  assertRange(sjc, 0, 28, 'DAS28.sjc');
  assertRange(pga, 0, 100, 'DAS28.pga');
  assertRange(reactant, 0, reactantType === 'crp' ? 500 : 150, `DAS28.reactant (${reactantType})`);

  // ESR: fórmula original Prevoo 1995; CRP: fórmula Fransen 2003
  // Proteção contra log(0): Math.max(..., 0.01)
  const scoreRaw =
    reactantType === 'crp'
      ? 0.56 * Math.sqrt(tjc) +
        0.28 * Math.sqrt(sjc) +
        0.36 * Math.log(Math.max(reactant, 0.01) + 1) +
        0.014 * pga +
        0.96
      : 0.56 * Math.sqrt(tjc) +
        0.28 * Math.sqrt(sjc) +
        0.70 * Math.log(Math.max(reactant, 0.01)) +
        0.014 * pga;

  const score = Number(scoreRaw.toFixed(2));
  const ref = reactantType === 'crp'
    ? 'Fransen J & van Riel PLCM. Clin Exp Rheumatol. 2005;23(S39):S93-9'
    : 'Prevoo ML et al. Arthritis Rheum. 1995;38:44-8';

  if (score < 2.6) return { score, activity: 'remission', label: 'Remissão', color: 'green', description: 'DAS28 < 2,6.', reference: ref };
  if (score < 3.2) return { score, activity: 'low', label: 'Baixa atividade', color: 'green', description: 'DAS28 2,6–3,2.', reference: ref };
  if (score <= 5.1) return { score, activity: 'moderate', label: 'Atividade moderada', color: 'orange', description: 'DAS28 3,2–5,1.', reference: ref };
  return { score, activity: 'high', label: 'Alta atividade', color: 'red', description: 'DAS28 > 5,1.', reference: ref };
}

// ---------------------------------------------------------------------------
// SDAI  (AR)
// ---------------------------------------------------------------------------

export interface SDAIInput {
  tjc: number;
  sjc: number;
  /** PGA do paciente 0–10 cm NRS */
  pgaPatient: number;
  /** PGA do avaliador 0–10 cm NRS */
  pgaEvaluator: number;
  /** CRP mg/dL */
  crp: number;
}

export function calcSDAI(input: SDAIInput): ScoreResult {
  assertRange(input.tjc, 0, 28, 'SDAI.tjc');
  assertRange(input.sjc, 0, 28, 'SDAI.sjc');
  assertRange(input.pgaPatient, 0, 10, 'SDAI.pgaPatient');
  assertRange(input.pgaEvaluator, 0, 10, 'SDAI.pgaEvaluator');
  assertRange(input.crp, 0, 20, 'SDAI.crp');

  const score = Number(
    (input.tjc + input.sjc + input.pgaPatient + input.pgaEvaluator + input.crp).toFixed(1)
  );
  const ref = 'Smolen JS et al. Ann Rheum Dis. 2003;62(Suppl 2)';

  if (score <= 3.3) return { score, activity: 'remission', label: 'Remissão', color: 'green', description: 'SDAI ≤ 3,3.', reference: ref };
  if (score <= 11) return { score, activity: 'low', label: 'Baixa atividade', color: 'green', description: 'SDAI 3,4–11.', reference: ref };
  if (score <= 26) return { score, activity: 'moderate', label: 'Atividade moderada', color: 'orange', description: 'SDAI 11,1–26.', reference: ref };
  return { score, activity: 'high', label: 'Alta atividade', color: 'red', description: 'SDAI > 26.', reference: ref };
}

// ---------------------------------------------------------------------------
// CDAI  (AR)
// ---------------------------------------------------------------------------

export interface CDAIInput {
  tjc: number;
  sjc: number;
  pgaPatient: number;
  pgaEvaluator: number;
}

export function calcCDAI(input: CDAIInput): ScoreResult {
  assertRange(input.tjc, 0, 28, 'CDAI.tjc');
  assertRange(input.sjc, 0, 28, 'CDAI.sjc');
  assertRange(input.pgaPatient, 0, 10, 'CDAI.pgaPatient');
  assertRange(input.pgaEvaluator, 0, 10, 'CDAI.pgaEvaluator');

  const score = Number(
    (input.tjc + input.sjc + input.pgaPatient + input.pgaEvaluator).toFixed(1)
  );
  const ref = 'Aletaha D & Smolen JS. Clin Exp Rheumatol. 2005;23(5 Suppl 39)';

  if (score <= 2.8) return { score, activity: 'remission', label: 'Remissão', color: 'green', description: 'CDAI ≤ 2,8.', reference: ref };
  if (score <= 10) return { score, activity: 'low', label: 'Baixa atividade', color: 'green', description: 'CDAI 2,9–10.', reference: ref };
  if (score <= 22) return { score, activity: 'moderate', label: 'Atividade moderada', color: 'orange', description: 'CDAI 10,1–22.', reference: ref };
  return { score, activity: 'high', label: 'Alta atividade', color: 'red', description: 'CDAI > 22.', reference: ref };
}

// ---------------------------------------------------------------------------
// HAQ-DI  (AR — funcionalidade física)
// ---------------------------------------------------------------------------

/**
 * Health Assessment Questionnaire — Disability Index
 * 20 questões agrupadas em 8 categorias, cada categoria pontuada 0–3.
 * Score final = média das categorias (0–3); aid/device pode elevar o score da categoria.
 */
export interface HAQDIInput {
  /** Escores de cada categoria 0–3 (já com ajuste de aids/devices se aplicável) */
  dressing: number;
  rising: number;
  eating: number;
  walking: number;
  hygiene: number;
  reach: number;
  grip: number;
  activities: number;
}

export function calcHAQDI(input: HAQDIInput): ScoreResult {
  const categories = [
    input.dressing, input.rising, input.eating, input.walking,
    input.hygiene, input.reach, input.grip, input.activities,
  ];

  for (const [i, v] of categories.entries()) {
    assertRange(v, 0, 3, `HAQ-DI categoria ${i + 1}`);
  }

  const score = Number(
    (categories.reduce((a, b) => a + b, 0) / categories.length).toFixed(2)
  );
  const ref = 'Fries JF et al. Arthritis Rheum. 1980;23:137-45';

  if (score < 0.5) return { score, activity: 'remission', label: 'Sem incapacidade', color: 'green', description: 'HAQ-DI < 0,5.', reference: ref };
  if (score < 1.0) return { score, activity: 'low', label: 'Incapacidade leve', color: 'yellow', description: 'HAQ-DI 0,5–1,0.', reference: ref };
  if (score < 1.5) return { score, activity: 'moderate', label: 'Incapacidade moderada', color: 'orange', description: 'HAQ-DI 1,0–1,5.', reference: ref };
  return { score, activity: 'high', label: 'Incapacidade grave', color: 'red', description: 'HAQ-DI ≥ 1,5.', reference: ref };
}

// ---------------------------------------------------------------------------
// SLEDAI-2K  (LES)
// ---------------------------------------------------------------------------

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
  const ref = 'Gladman DD et al. J Rheumatol. 2002;29:288-91';

  if (score === 0) return { score, activity: 'remission', label: 'Inatividade', color: 'green', description: 'SLEDAI-2K = 0.', reference: ref };
  if (score <= 5) return { score, activity: 'low', label: 'Atividade leve', color: 'yellow', description: 'SLEDAI-2K 1–5.', reference: ref };
  if (score <= 10) return { score, activity: 'moderate', label: 'Atividade moderada', color: 'orange', description: 'SLEDAI-2K 6–10.', reference: ref };
  if (score <= 19) return { score, activity: 'high', label: 'Alta atividade', color: 'red', description: 'SLEDAI-2K 11–19.', reference: ref };
  return { score, activity: 'very_high', label: 'Atividade muito alta', color: 'red', description: 'SLEDAI-2K ≥ 20.', reference: ref };
}

// ---------------------------------------------------------------------------
// BASDAI  (SpA)
// ---------------------------------------------------------------------------

export interface BASDAIInput {
  /** NRS 0–10 */
  q1_fatigue: number;
  q2_spinal_pain: number;
  q3_peripheral_pain: number;
  q4_enthesitis: number;
  q5_morning_stiffness_severity: number;
  q6_morning_stiffness_duration: number;
}

export function calcBASDAI(input: BASDAIInput): ScoreResult {
  for (const [k, v] of Object.entries(input)) {
    assertRange(v as number, 0, 10, `BASDAI.${k}`);
  }

  const q56Mean =
    (input.q5_morning_stiffness_severity + input.q6_morning_stiffness_duration) / 2;
  const score = Number(
    ((input.q1_fatigue + input.q2_spinal_pain + input.q3_peripheral_pain + input.q4_enthesitis + q56Mean) / 5).toFixed(1)
  );
  const ref = 'Garrett S et al. J Rheumatol. 1994;21:2286-91';

  // Classificação em 3 faixas (literatura: <4 inativa, 4–6 moderada, >6 alta)
  if (score < 4) return { score, activity: 'low', label: 'Doença inativa / baixa', color: 'green', description: 'BASDAI < 4.', reference: ref };
  if (score <= 6) return { score, activity: 'moderate', label: 'Doença moderadamente ativa', color: 'orange', description: 'BASDAI 4–6.', reference: ref };
  return { score, activity: 'high', label: 'Doença muito ativa', color: 'red', description: 'BASDAI > 6.', reference: ref };
}

// ---------------------------------------------------------------------------
// ASDAS  (SpA)
// ---------------------------------------------------------------------------

export interface ASDASInput {
  /** NRS 0–10 */
  back_pain: number;
  /** minutos */
  morning_stiffness_duration: number;
  /** NRS 0–10 */
  patient_global: number;
  /** NRS 0–10 */
  peripheral_pain: number;
  /** CRP mg/L (para ASDAS-PCR) ou ESR mm/h (para ASDAS-VHS) */
  reactant: number;
}

/** ASDAS-PCR (van der Heijde 2009) */
export function calcASDAS_CRP(input: ASDASInput): ScoreResult {
  assertRange(input.back_pain, 0, 10, 'ASDAS.back_pain');
  assertRange(input.morning_stiffness_duration, 0, 120, 'ASDAS.morning_stiffness_duration');
  assertRange(input.patient_global, 0, 10, 'ASDAS.patient_global');
  assertRange(input.peripheral_pain, 0, 10, 'ASDAS.peripheral_pain');
  assertRange(input.reactant, 0, 500, 'ASDAS.crp');

  const score = Number((
    0.121 * input.back_pain +
    0.058 * input.morning_stiffness_duration +
    0.110 * input.patient_global +
    0.073 * input.peripheral_pain +
    0.579 * Math.log(Math.max(input.reactant, 0.01) + 1)
  ).toFixed(2));

  return _asdas_classify(score, 'van der Heijde D et al. Ann Rheum Dis. 2009;68:1811-8');
}

/** ASDAS-VHS (variante ESR — igualmente validada) */
export function calcASDAS_ESR(input: ASDASInput): ScoreResult {
  assertRange(input.back_pain, 0, 10, 'ASDAS.back_pain');
  assertRange(input.morning_stiffness_duration, 0, 120, 'ASDAS.morning_stiffness_duration');
  assertRange(input.patient_global, 0, 10, 'ASDAS.patient_global');
  assertRange(input.peripheral_pain, 0, 10, 'ASDAS.peripheral_pain');
  assertRange(input.reactant, 0, 150, 'ASDAS.esr');

  const score = Number((
    0.079 * input.back_pain +
    0.069 * input.morning_stiffness_duration +
    0.113 * input.patient_global +
    0.086 * input.peripheral_pain +
    0.293 * Math.sqrt(Math.max(input.reactant, 0.01))
  ).toFixed(2));

  return _asdas_classify(score, 'van der Heijde D et al. Ann Rheum Dis. 2009;68:1811-8');
}

function _asdas_classify(score: number, ref: string): ScoreResult {
  // Classificação ASAS 2009: <1.3 inativo; 1.3–2.1 baixa; 2.1–3.5 alta; >3.5 muito alta
  if (score < 1.3) return { score, activity: 'remission', label: 'Inatividade', color: 'green', description: 'ASDAS < 1,3.', reference: ref };
  if (score < 2.1) return { score, activity: 'low', label: 'Baixa atividade', color: 'yellow', description: 'ASDAS 1,3–2,1.', reference: ref };
  if (score <= 3.5) return { score, activity: 'moderate', label: 'Alta atividade', color: 'orange', description: 'ASDAS 2,1–3,5.', reference: ref };
  return { score, activity: 'very_high', label: 'Atividade muito alta', color: 'red', description: 'ASDAS > 3,5.', reference: ref };
}

// ---------------------------------------------------------------------------
// FRAX — triagem educacional  (Osteoporose)
// ---------------------------------------------------------------------------

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
  referToFRAX: true;
}

export function calcFRAXRiskCategory(input: FRAXInput): FRAXRiskCategory {
  assertRange(input.age, 40, 110, 'FRAX.age');
  assertRange(input.bmi, 10, 80, 'FRAX.bmi');

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

// ---------------------------------------------------------------------------
// Catálogo de scores
// ---------------------------------------------------------------------------

export const SCORE_CATALOG: ReadonlyArray<{
  id: ScoreId;
  name: string;
  disease: DiseaseName;
  fn: (...args: never[]) => ScoreResult | FRAXRiskCategory;
}> = [
  { id: 'das28-crp', name: 'DAS28-PCR', disease: 'Artrite Reumatoide', fn: calcDAS28 as never },
  { id: 'das28-esr', name: 'DAS28-VHS', disease: 'Artrite Reumatoide', fn: calcDAS28 as never },
  { id: 'sdai',      name: 'SDAI',      disease: 'Artrite Reumatoide', fn: calcSDAI as never },
  { id: 'cdai',      name: 'CDAI',      disease: 'Artrite Reumatoide', fn: calcCDAI as never },
  { id: 'haq-di',    name: 'HAQ-DI',    disease: 'Artrite Reumatoide', fn: calcHAQDI as never },
  { id: 'sledai2k',  name: 'SLEDAI-2K', disease: 'Lúpus Eritematoso',  fn: calcSLEDAI2K as never },
  { id: 'basdai',    name: 'BASDAI',    disease: 'Espondiloartrite',   fn: calcBASDAI as never },
  { id: 'asdas-crp', name: 'ASDAS-PCR', disease: 'Espondiloartrite',   fn: calcASDAS_CRP as never },
  { id: 'asdas-esr', name: 'ASDAS-VHS', disease: 'Espondiloartrite',   fn: calcASDAS_ESR as never },
  { id: 'frax',      name: 'FRAX (triagem)', disease: 'Osteoporose',   fn: calcFRAXRiskCategory as never },
] as const;
