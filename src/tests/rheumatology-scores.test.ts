/**
 * Testes unitários — Rheumatology Clinical Scores
 *
 * Cobertura: DAS28-PCR, DAS28-VHS, SDAI, CDAI, HAQ-DI,
 *            SLEDAI-2K, BASDAI, ASDAS-PCR, ASDAS-VHS, FRAX
 *
 * Valores de referência calculados manualmente a partir das fórmulas publicadas.
 */

import { describe, it, expect } from 'vitest';
import {
  calcDAS28,
  calcSDAI,
  calcCDAI,
  calcHAQDI,
  calcSLEDAI2K,
  calcBASDAI,
  calcASDAS_CRP,
  calcASDAS_ESR,
  calcFRAXRiskCategory,
  SCORE_CATALOG,
} from '../data/calculadoras/rheumatology-scores';

// ---------------------------------------------------------------------------
// DAS28
// ---------------------------------------------------------------------------

describe('calcDAS28 — PCR', () => {
  it('classifica remissão (< 2,6)', () => {
    // tjc=0, sjc=0, pga=10, crp=1 → 0+0+0.36*ln(2)+0.14+0.96 ≈ 1.35
    const r = calcDAS28({ tjc: 0, sjc: 0, pga: 10, reactant: 1, reactantType: 'crp' });
    expect(r.activity).toBe('remission');
    expect(r.score).toBeLessThan(2.6);
  });

  it('classifica baixa atividade (2,6–3,2)', () => {
    // tjc=1, sjc=1, pga=20, crp=3
    const r = calcDAS28({ tjc: 1, sjc: 1, pga: 20, reactant: 3, reactantType: 'crp' });
    expect(r.activity).toBe('low');
    expect(r.score).toBeGreaterThanOrEqual(2.6);
    expect(r.score).toBeLessThan(3.2);
  });

  it('classifica atividade moderada (3,2–5,1)', () => {
    const r = calcDAS28({ tjc: 5, sjc: 4, pga: 50, reactant: 15, reactantType: 'crp' });
    expect(r.activity).toBe('moderate');
  });

  it('classifica alta atividade (> 5,1)', () => {
    const r = calcDAS28({ tjc: 20, sjc: 18, pga: 80, reactant: 80, reactantType: 'crp' });
    expect(r.activity).toBe('high');
    expect(r.score).toBeGreaterThan(5.1);
  });

  it('não produz -Infinity quando crp=0 (bug fix)', () => {
    const r = calcDAS28({ tjc: 0, sjc: 0, pga: 0, reactant: 0, reactantType: 'crp' });
    expect(Number.isFinite(r.score)).toBe(true);
  });
});

describe('calcDAS28 — VHS', () => {
  it('não produz -Infinity quando esr=0 (bug fix)', () => {
    const r = calcDAS28({ tjc: 0, sjc: 0, pga: 0, reactant: 0, reactantType: 'esr' });
    expect(Number.isFinite(r.score)).toBe(true);
  });

  it('classifica alta atividade com esr elevado', () => {
    const r = calcDAS28({ tjc: 15, sjc: 12, pga: 75, reactant: 80, reactantType: 'esr' });
    expect(r.activity).toBe('high');
  });

  it('lança RangeError para tjc > 28', () => {
    expect(() =>
      calcDAS28({ tjc: 29, sjc: 0, pga: 0, reactant: 5, reactantType: 'esr' })
    ).toThrow(RangeError);
  });

  it('lança RangeError para pga > 100', () => {
    expect(() =>
      calcDAS28({ tjc: 0, sjc: 0, pga: 101, reactant: 5, reactantType: 'crp' })
    ).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// SDAI
// ---------------------------------------------------------------------------

describe('calcSDAI', () => {
  it('remissão: score ≤ 3,3', () => {
    const r = calcSDAI({ tjc: 0, sjc: 0, pgaPatient: 1, pgaEvaluator: 1, crp: 0.5 });
    expect(r.activity).toBe('remission');
    expect(r.score).toBeLessThanOrEqual(3.3);
  });

  it('baixa atividade: 3,4–11', () => {
    const r = calcSDAI({ tjc: 2, sjc: 1, pgaPatient: 2, pgaEvaluator: 2, crp: 1 });
    expect(r.activity).toBe('low');
  });

  it('moderada: 11–26', () => {
    const r = calcSDAI({ tjc: 7, sjc: 5, pgaPatient: 5, pgaEvaluator: 4, crp: 3 });
    expect(r.activity).toBe('moderate');
  });

  it('alta: > 26', () => {
    const r = calcSDAI({ tjc: 15, sjc: 12, pgaPatient: 8, pgaEvaluator: 8, crp: 8 });
    expect(r.activity).toBe('high');
  });

  it('lança RangeError para crp > 20', () => {
    expect(() =>
      calcSDAI({ tjc: 0, sjc: 0, pgaPatient: 0, pgaEvaluator: 0, crp: 25 })
    ).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// CDAI
// ---------------------------------------------------------------------------

describe('calcCDAI', () => {
  it('remissão: ≤ 2,8', () => {
    const r = calcCDAI({ tjc: 0, sjc: 0, pgaPatient: 1, pgaEvaluator: 1 });
    expect(r.activity).toBe('remission');
  });

  it('baixa: 2,9–10', () => {
    const r = calcCDAI({ tjc: 2, sjc: 2, pgaPatient: 2, pgaEvaluator: 2 });
    expect(r.activity).toBe('low');
  });

  it('moderada: 10,1–22', () => {
    const r = calcCDAI({ tjc: 7, sjc: 5, pgaPatient: 5, pgaEvaluator: 4 });
    expect(r.activity).toBe('moderate');
  });

  it('alta: > 22', () => {
    const r = calcCDAI({ tjc: 15, sjc: 12, pgaPatient: 8, pgaEvaluator: 8 });
    expect(r.activity).toBe('high');
  });

  it('lança RangeError para sjc negativo', () => {
    expect(() =>
      calcCDAI({ tjc: 0, sjc: -1, pgaPatient: 0, pgaEvaluator: 0 })
    ).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// HAQ-DI
// ---------------------------------------------------------------------------

describe('calcHAQDI', () => {
  const allZero = { dressing: 0, rising: 0, eating: 0, walking: 0, hygiene: 0, reach: 0, grip: 0, activities: 0 };
  const allThree = { dressing: 3, rising: 3, eating: 3, walking: 3, hygiene: 3, reach: 3, grip: 3, activities: 3 };

  it('sem incapacidade quando tudo = 0', () => {
    const r = calcHAQDI(allZero);
    expect(r.activity).toBe('remission');
    expect(r.score).toBe(0);
  });

  it('incapacidade grave quando tudo = 3', () => {
    const r = calcHAQDI(allThree);
    expect(r.activity).toBe('high');
    expect(r.score).toBe(3);
  });

  it('incapacidade leve (0,5–1,0)', () => {
    const r = calcHAQDI({ ...allZero, dressing: 2, rising: 2, eating: 2, walking: 2 });
    expect(r.activity).toBe('low');
  });

  it('incapacidade moderada (1,0–1,5)', () => {
    const r = calcHAQDI({ dressing: 1, rising: 1, eating: 1, walking: 1, hygiene: 1, reach: 1, grip: 1, activities: 2 });
    expect(r.activity).toBe('moderate');
  });

  it('lança RangeError para categoria > 3', () => {
    expect(() => calcHAQDI({ ...allZero, dressing: 4 })).toThrow(RangeError);
  });

  it('score é média aritmética das 8 categorias', () => {
    const r = calcHAQDI({ dressing: 2, rising: 0, eating: 0, walking: 0, hygiene: 0, reach: 0, grip: 0, activities: 0 });
    expect(r.score).toBeCloseTo(0.25, 2);
  });
});

// ---------------------------------------------------------------------------
// SLEDAI-2K
// ---------------------------------------------------------------------------

describe('calcSLEDAI2K', () => {
  const allFalse = Object.fromEntries(
    ['seizure','psychosis','organic_brain_syndrome','visual_disturbance','cranial_nerve_disorder',
     'lupus_headache','cva','vasculitis','arthritis','myositis','urinary_casts','hematuria',
     'proteinuria','pyuria','rash','alopecia','mucosal_ulcers','pleurisy','pericarditis',
     'low_complement','increased_dna_binding','fever','thrombocytopenia','leukopenia']
    .map(k => [k, false])
  ) as Parameters<typeof calcSLEDAI2K>[0];

  it('inatividade quando score = 0', () => {
    const r = calcSLEDAI2K(allFalse);
    expect(r.activity).toBe('remission');
    expect(r.score).toBe(0);
  });

  it('atividade leve: 1–5 (apenas febre)', () => {
    const r = calcSLEDAI2K({ ...allFalse, fever: true });
    expect(r.activity).toBe('low');
    expect(r.score).toBe(1);
  });

  it('peso neuropsiquiátrico = 8 (convulsão)', () => {
    const r = calcSLEDAI2K({ ...allFalse, seizure: true });
    expect(r.score).toBe(8);
    expect(r.activity).toBe('moderate');
  });

  it('muito alta atividade: ≥ 20', () => {
    // convulsão(8) + psicose(8) + vasculite(8) = 24
    const r = calcSLEDAI2K({ ...allFalse, seizure: true, psychosis: true, vasculitis: true });
    expect(r.score).toBe(24);
    expect(r.activity).toBe('very_high');
  });

  it('alta atividade: 11–19', () => {
    // artrite(4) + miosite(4) + hematuria(4) + rash(2) + febre(1) = 15
    const r = calcSLEDAI2K({ ...allFalse, arthritis: true, myositis: true, hematuria: true, rash: true, fever: true });
    expect(r.score).toBe(15);
    expect(r.activity).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// BASDAI  (verifica correção da classificação binária → 3 faixas)
// ---------------------------------------------------------------------------

describe('calcBASDAI', () => {
  const base = { q1_fatigue: 0, q2_spinal_pain: 0, q3_peripheral_pain: 0, q4_enthesitis: 0, q5_morning_stiffness_severity: 0, q6_morning_stiffness_duration: 0 };

  it('inativa / baixa: < 4', () => {
    const r = calcBASDAI({ ...base, q1_fatigue: 3, q2_spinal_pain: 2 });
    // (3+2+0+0+0)/5 = 1.0
    expect(r.activity).toBe('low');
    expect(r.score).toBeLessThan(4);
  });

  it('moderadamente ativa: 4–6 (nova faixa)', () => {
    // (5+5+4+5+5)/5 = 4.8
    const r = calcBASDAI({ q1_fatigue: 5, q2_spinal_pain: 5, q3_peripheral_pain: 4, q4_enthesitis: 5, q5_morning_stiffness_severity: 5, q6_morning_stiffness_duration: 5 });
    expect(r.activity).toBe('moderate');
    expect(r.score).toBeGreaterThanOrEqual(4);
    expect(r.score).toBeLessThanOrEqual(6);
  });

  it('muito ativa: > 6', () => {
    const r = calcBASDAI({ q1_fatigue: 9, q2_spinal_pain: 8, q3_peripheral_pain: 8, q4_enthesitis: 9, q5_morning_stiffness_severity: 9, q6_morning_stiffness_duration: 9 });
    expect(r.activity).toBe('high');
    expect(r.score).toBeGreaterThan(6);
  });

  it('q5 e q6 são médiados antes de entrar no cálculo', () => {
    // q1=q2=q3=q4=0, q5=10, q6=0 → q56mean=5 → score=(0+0+0+0+5)/5=1.0
    const r = calcBASDAI({ ...base, q5_morning_stiffness_severity: 10, q6_morning_stiffness_duration: 0 });
    expect(r.score).toBeCloseTo(1.0, 1);
  });

  it('lança RangeError para questão > 10', () => {
    expect(() => calcBASDAI({ ...base, q1_fatigue: 11 })).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// ASDAS-PCR
// ---------------------------------------------------------------------------

describe('calcASDAS_CRP', () => {
  const base = { back_pain: 0, morning_stiffness_duration: 0, patient_global: 0, peripheral_pain: 0, reactant: 0 };

  it('inatividade: < 1,3', () => {
    const r = calcASDAS_CRP({ ...base, back_pain: 1, reactant: 1 });
    expect(r.activity).toBe('remission');
    expect(r.score).toBeLessThan(1.3);
  });

  it('baixa atividade: 1,3–2,1', () => {
    const r = calcASDAS_CRP({ back_pain: 4, morning_stiffness_duration: 30, patient_global: 3, peripheral_pain: 2, reactant: 5 });
    expect(r.activity).toBe('low');
  });

  it('alta atividade: 2,1–3,5', () => {
    const r = calcASDAS_CRP({ back_pain: 7, morning_stiffness_duration: 60, patient_global: 6, peripheral_pain: 5, reactant: 20 });
    expect(r.activity).toBe('moderate');
  });

  it('atividade muito alta: > 3,5', () => {
    const r = calcASDAS_CRP({ back_pain: 9, morning_stiffness_duration: 90, patient_global: 9, peripheral_pain: 8, reactant: 100 });
    expect(r.activity).toBe('very_high');
    expect(r.score).toBeGreaterThan(3.5);
  });

  it('não produz -Infinity quando crp=0 (bug fix)', () => {
    const r = calcASDAS_CRP(base);
    expect(Number.isFinite(r.score)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ASDAS-VHS (nova função)
// ---------------------------------------------------------------------------

describe('calcASDAS_ESR', () => {
  const base = { back_pain: 0, morning_stiffness_duration: 0, patient_global: 0, peripheral_pain: 0, reactant: 0 };

  it('inatividade com esr baixo', () => {
    const r = calcASDAS_ESR({ ...base, back_pain: 1, reactant: 5 });
    expect(r.activity).toBe('remission');
  });

  it('atividade muito alta com esr elevado', () => {
    const r = calcASDAS_ESR({ back_pain: 9, morning_stiffness_duration: 90, patient_global: 9, peripheral_pain: 8, reactant: 100 });
    expect(r.activity).toBe('very_high');
  });

  it('não produz NaN quando esr=0 (Math.sqrt seguro)', () => {
    const r = calcASDAS_ESR(base);
    expect(Number.isFinite(r.score)).toBe(true);
  });

  it('lança RangeError para esr > 150', () => {
    expect(() => calcASDAS_ESR({ ...base, reactant: 151 })).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// FRAX
// ---------------------------------------------------------------------------

describe('calcFRAXRiskCategory', () => {
  const baseF: Parameters<typeof calcFRAXRiskCategory>[0] = {
    age: 50, sex: 'F', bmi: 24,
    previous_fracture: false, parent_hip_fracture: false,
    current_smoker: false, glucocorticoids: false,
    rheumatoid_arthritis: false, secondary_osteoporosis: false,
    alcohol_3_or_more: false,
  };

  it('baixo risco em mulher jovem sem fatores', () => {
    const r = calcFRAXRiskCategory(baseF);
    expect(r.riskCategory).toBe('low');
  });

  it('alto risco com múltiplos fatores em mulher idosa', () => {
    const r = calcFRAXRiskCategory({
      ...baseF, age: 78, bmi: 17,
      previous_fracture: true, glucocorticoids: true,
      rheumatoid_arthritis: true, parent_hip_fracture: true,
    });
    expect(r.riskCategory).toBe('high');
  });

  it('referToFRAX sempre é true (triagem educacional)', () => {
    expect(calcFRAXRiskCategory(baseF).referToFRAX).toBe(true);
  });

  it('lança RangeError para idade < 40', () => {
    expect(() => calcFRAXRiskCategory({ ...baseF, age: 35 })).toThrow(RangeError);
  });

  it('lança RangeError para bmi < 10', () => {
    expect(() => calcFRAXRiskCategory({ ...baseF, bmi: 8 })).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// SCORE_CATALOG
// ---------------------------------------------------------------------------

describe('SCORE_CATALOG', () => {
  it('contém exatamente 10 scores', () => {
    expect(SCORE_CATALOG).toHaveLength(10);
  });

  it('todos os scores têm id, name, disease e fn', () => {
    for (const entry of SCORE_CATALOG) {
      expect(entry.id).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.disease).toBeTruthy();
      expect(typeof entry.fn).toBe('function');
    }
  });

  it('ids são únicos', () => {
    const ids = SCORE_CATALOG.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
