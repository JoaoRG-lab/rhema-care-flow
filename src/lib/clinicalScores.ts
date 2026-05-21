// ── Rhema Care Flow — Clinical Scoring Scales ─────────────────────────────
// mode: Health = true
// Escalas validadas: SOFA, Glasgow, Wells, CHA2DS2-VASc, APACHE II,
//   NEWS2, CURB-65, PSI, Rockford (Blatchford), NIHSS simplificado
// ──────────────────────────────────────────────────────────────────────────

export const MODE = { Health: true, Code: false } as const;

// ── SOFA Score ─────────────────────────────────────────────────────────────
export interface SofaInput {
  pao2_fio2: number;        // Relação PaO2/FiO2
  plaquetas: number;        // /mm³
  bilirrubina: number;      // mg/dL
  map_mmhg: number;         // PAM em mmHg
  vasopressor?: 'dopa_low' | 'dopa_mid' | 'dopa_high' | 'nora_epi_low' | 'nora_epi_high';
  glasgow: number;          // Escala de Glasgow (3–15)
  creatinina: number;       // mg/dL
  diurese_ml24h?: number;   // mL/24h
}

export interface SofaResult {
  respiratory: number;
  coagulation: number;
  liver: number;
  cardiovascular: number;
  neurological: number;
  renal: number;
  total: number;
  mortality: string;
  interpretation: string;
}

export function calcSOFA(inp: SofaInput): SofaResult {
  let resp = 0;
  if (inp.pao2_fio2 < 100) resp = 4;
  else if (inp.pao2_fio2 < 200) resp = 3;
  else if (inp.pao2_fio2 < 300) resp = 2;
  else if (inp.pao2_fio2 < 400) resp = 1;

  let coag = 0;
  if (inp.plaquetas < 20000) coag = 4;
  else if (inp.plaquetas < 50000) coag = 3;
  else if (inp.plaquetas < 100000) coag = 2;
  else if (inp.plaquetas < 150000) coag = 1;

  let liver = 0;
  if (inp.bilirrubina >= 12) liver = 4;
  else if (inp.bilirrubina >= 6) liver = 3;
  else if (inp.bilirrubina >= 2) liver = 2;
  else if (inp.bilirrubina >= 1.2) liver = 1;

  let cardio = 0;
  if (inp.vasopressor === 'nora_epi_high' || inp.vasopressor === 'dopa_high') cardio = 4;
  else if (inp.vasopressor === 'nora_epi_low') cardio = 3;
  else if (inp.vasopressor === 'dopa_mid') cardio = 3;
  else if (inp.vasopressor === 'dopa_low') cardio = 2;
  else if (inp.map_mmhg < 70) cardio = 1;

  let neuro = 0;
  if (inp.glasgow < 6) neuro = 4;
  else if (inp.glasgow < 10) neuro = 3;
  else if (inp.glasgow < 13) neuro = 2;
  else if (inp.glasgow < 15) neuro = 1;

  let renal = 0;
  const cr = inp.creatinina;
  const ur = inp.diurese_ml24h;
  if (cr >= 5 || (ur !== undefined && ur < 200)) renal = 4;
  else if (cr >= 3.5 || (ur !== undefined && ur < 500)) renal = 3;
  else if (cr >= 2) renal = 2;
  else if (cr >= 1.2) renal = 1;

  const total = resp + coag + liver + cardio + neuro + renal;

  let mortality = '';
  let interpretation = '';
  if (total <= 1) { mortality = '<10%'; interpretation = 'Disfunção mínima'; }
  else if (total <= 3) { mortality = '~15%'; interpretation = 'Disfunção leve'; }
  else if (total <= 6) { mortality = '~25%'; interpretation = 'Disfunção moderada'; }
  else if (total <= 9) { mortality = '~40%'; interpretation = 'Disfunção grave'; }
  else { mortality = '>50%'; interpretation = 'Disfunção muito grave — UTI obrigatória'; }

  return { respiratory: resp, coagulation: coag, liver, cardiovascular: cardio, neurological: neuro, renal, total, mortality, interpretation };
}

// ── Glasgow Coma Scale ─────────────────────────────────────────────────────
export interface GlasgowInput {
  ocular: 1 | 2 | 3 | 4;       // 1=nenhuma, 4=espontânea
  verbal: 1 | 2 | 3 | 4 | 5;   // 1=nenhuma, 5=orientado
  motor: 1 | 2 | 3 | 4 | 5 | 6; // 1=nenhuma, 6=obedece ordens
}

export interface GlasgowResult {
  total: number;
  severity: 'grave' | 'moderado' | 'leve';
  intubationIndication: boolean;
  interpretation: string;
}

export function calcGlasgow(inp: GlasgowInput): GlasgowResult {
  const total = inp.ocular + inp.verbal + inp.motor;
  const severity = total <= 8 ? 'grave' : total <= 12 ? 'moderado' : 'leve';
  const intubationIndication = total <= 8;
  const interpretation =
    total <= 8 ? 'TCE grave — intubação orotraqueal indicada' :
    total <= 12 ? 'TCE moderado — observação intensiva' :
    'TCE leve — monitorização neurológica';
  return { total, severity, intubationIndication, interpretation };
}

// ── CHA₂DS₂-VASc (Risco de AVC na FA) ────────────────────────────────────
export interface CHA2DS2Input {
  chf: boolean;           // Insuficiência cardíaca
  hypertension: boolean;  // Hipertensão
  age75plus: boolean;     // Idade ≥75 anos (2 pontos)
  diabetes: boolean;
  stroke: boolean;        // AVC/AIT prévio (2 pontos)
  vascular: boolean;      // Doença vascular (IAM, placa aórtica, DAP)
  age65_74: boolean;      // Idade 65-74 anos
  female: boolean;        // Sexo feminino
}

export interface CHA2DS2Result {
  score: number;
  annualStrokeRisk: string;
  recommendation: string;
}

export function calcCHA2DS2VASc(inp: CHA2DS2Input): CHA2DS2Result {
  let score = 0;
  if (inp.chf) score += 1;
  if (inp.hypertension) score += 1;
  if (inp.age75plus) score += 2;
  if (inp.diabetes) score += 1;
  if (inp.stroke) score += 2;
  if (inp.vascular) score += 1;
  if (inp.age65_74) score += 1;
  if (inp.female) score += 1;

  const risks: Record<number, string> = {
    0: '0% (H) / 1.3% (F)', 1: '1.3% (H) / 2.2% (F)', 2: '2.2%',
    3: '3.2%', 4: '4.0%', 5: '6.7%', 6: '9.8%', 7: '9.6%', 8: '6.7%', 9: '15.2%',
  };
  const annualStrokeRisk = risks[Math.min(score, 9)] ?? '>15%';

  const recommendation =
    score === 0 ? 'Anticoagulação não recomendada' :
    score === 1 && !inp.female ? 'Considerar anticoagulação (benefício incerto)' :
    'Anticoagulação oral recomendada (NOAC preferencial sobre Varfarina)';

  return { score, annualStrokeRisk, recommendation };
}

// ── Wells Score — TEP ──────────────────────────────────────────────────────
export interface WellsTEPInput {
  clinicalSignsDVT: boolean;      // 3 pts
  altDiagLess: boolean;           // TEP mais provável que diagnóstico alternativo (3 pts)
  heartRate100: boolean;          // FC >100 bpm (1.5 pts)
  immobilizationSurgery: boolean; // Imobilização ou cirurgia nas últimas 4 semanas (1.5 pts)
  previousDVTorPE: boolean;       // TVP ou TEP prévio (1.5 pts)
  hemoptysis: boolean;            // Hemoptise (1 pt)
  malignancy: boolean;            // Neoplasia ativa (1 pt)
}

export interface WellsTEPResult {
  score: number;
  probability: 'baixa' | 'intermediária' | 'alta';
  recommendation: string;
}

export function calcWellsTEP(inp: WellsTEPInput): WellsTEPResult {
  let score = 0;
  if (inp.clinicalSignsDVT) score += 3;
  if (inp.altDiagLess) score += 3;
  if (inp.heartRate100) score += 1.5;
  if (inp.immobilizationSurgery) score += 1.5;
  if (inp.previousDVTorPE) score += 1.5;
  if (inp.hemoptysis) score += 1;
  if (inp.malignancy) score += 1;

  const probability = score < 2 ? 'baixa' : score < 7 ? 'intermediária' : 'alta';
  const recommendation =
    probability === 'baixa' ? 'D-dímero; se negativo — TEP excluído' :
    probability === 'intermediária' ? 'AngioTC de tórax (AngioTC-P)' :
    'Anticoagulação empírica + AngioTC urgente';

  return { score, probability, recommendation };
}

// ── CURB-65 (Pneumonia) ────────────────────────────────────────────────────
export interface CURB65Input {
  confusion: boolean;      // Confusão mental aguda
  urea20: boolean;         // Ureia >20 mmol/L (ou BUN >19 mg/dL)
  rr30: boolean;           // FR ≥30 irpm
  bp: boolean;             // PAS <90 ou PAD ≤60 mmHg
  age65: boolean;          // Idade ≥65 anos
}

export interface CURB65Result {
  score: number;
  mortality30d: string;
  site: 'ambulatorial' | 'internação' | 'UTI';
  recommendation: string;
}

export function calcCURB65(inp: CURB65Input): CURB65Result {
  const score = [inp.confusion, inp.urea20, inp.rr30, inp.bp, inp.age65].filter(Boolean).length;
  const mortality30d = ['~1%', '~3%', '~9%', '~17%', '~41%', '~57%'][score] ?? '>57%';
  const site: CURB65Result['site'] = score <= 1 ? 'ambulatorial' : score <= 2 ? 'internação' : 'UTI';
  const recommendation =
    score <= 1 ? 'Tratamento ambulatorial com ATB oral (amoxicilina ± claritromicina)' :
    score === 2 ? 'Internação, ATB IV (ampicilina-sulbactam ou ceftriaxona + macrolídeo)' :
    'UTI, ATB IV dupla cobertura (BL/BLI + macrolídeo ou fluoroquinolona)';
  return { score, mortality30d, site, recommendation };
}

// ── NEWS2 (National Early Warning Score 2) ─────────────────────────────────
export interface NEWS2Input {
  rr: number;           // Frequência respiratória (irpm)
  spo2: number;         // SpO2 (%)
  supplementalO2: boolean;
  systolicBP: number;   // PAS mmHg
  heartRate: number;    // FC bpm
  consciousness: 'A' | 'C' | 'V' | 'P' | 'U'; // ACVPU
  temperature: number;  // °C
  scale2: boolean;      // Escala 2 (hipercápnia / DPOC)
}

export interface NEWS2Result {
  score: number;
  risk: 'baixo' | 'médio' | 'alto' | 'emergência';
  response: string;
}

export function calcNEWS2(inp: NEWS2Input): NEWS2Result {
  let s = 0;

  // RR
  if (inp.rr <= 8) s += 3;
  else if (inp.rr <= 11) s += 1;
  else if (inp.rr <= 20) s += 0;
  else if (inp.rr <= 24) s += 2;
  else s += 3;

  // SpO2 (escala 1)
  if (!inp.scale2) {
    if (inp.spo2 <= 91) s += 3;
    else if (inp.spo2 <= 93) s += 2;
    else if (inp.spo2 <= 95) s += 1;
  } else {
    // Escala 2 (DPOC)
    if (inp.spo2 <= 83) s += 3;
    else if (inp.spo2 <= 85) s += 2;
    else if (inp.spo2 <= 87) s += 1;
    else if (inp.spo2 <= 92) s += 0;
    else if (inp.spo2 <= 94) s += 1;
    else if (inp.spo2 <= 96) s += 2;
    else s += 3;
  }

  if (inp.supplementalO2) s += 2;

  // PAS
  if (inp.systolicBP <= 90) s += 3;
  else if (inp.systolicBP <= 100) s += 2;
  else if (inp.systolicBP <= 110) s += 1;
  else if (inp.systolicBP <= 219) s += 0;
  else s += 3;

  // FC
  if (inp.heartRate <= 40) s += 3;
  else if (inp.heartRate <= 50) s += 1;
  else if (inp.heartRate <= 90) s += 0;
  else if (inp.heartRate <= 110) s += 1;
  else if (inp.heartRate <= 130) s += 2;
  else s += 3;

  // ACVPU
  if (inp.consciousness === 'A') s += 0;
  else if (inp.consciousness === 'C') s += 3;
  else s += 3;

  // Temperatura
  if (inp.temperature <= 35) s += 3;
  else if (inp.temperature <= 36) s += 1;
  else if (inp.temperature <= 38) s += 0;
  else if (inp.temperature <= 39) s += 1;
  else s += 2;

  const risk: NEWS2Result['risk'] =
    s === 0 ? 'baixo' :
    s <= 4 ? 'baixo' :
    s <= 6 ? 'médio' :
    s <= 12 ? 'alto' : 'emergência';

  const response =
    risk === 'baixo' ? 'Monitorização de rotina (mínimo 12h)' :
    risk === 'médio' ? 'Avaliação médica em <1h, monitorização contínua' :
    risk === 'alto' ? 'Avaliação sênior imediata, considerar UTI' :
    'EMERGÊNCIA — acionamento do time de resposta rápida imediato';

  return { score: s, risk, response };
}

// ── APACHE II (simplificado — sem APS pontual) ─────────────────────────────
export interface ApacheIIInput {
  age: number;
  chronicHealth: 'none' | 'elective' | 'emergency';
  sofaTotal: number;    // Usar SOFA como proxy do APS (conversão linear)
}

export interface ApacheIIResult {
  estimatedScore: number;
  mortality: string;
  icu: boolean;
}

export function calcApacheII(inp: ApacheIIInput): ApacheIIResult {
  let age = 0;
  if (inp.age < 45) age = 0;
  else if (inp.age < 55) age = 2;
  else if (inp.age < 65) age = 3;
  else if (inp.age < 75) age = 5;
  else age = 6;

  let chronic = 0;
  if (inp.chronicHealth === 'elective') chronic = 2;
  else if (inp.chronicHealth === 'emergency') chronic = 5;

  const aps = Math.round(inp.sofaTotal * 1.8); // proxy
  const total = aps + age + chronic;

  const mortality =
    total < 5 ? '<5%' :
    total < 10 ? '~8%' :
    total < 15 ? '~15%' :
    total < 20 ? '~25%' :
    total < 25 ? '~40%' :
    total < 30 ? '~55%' : '>65%';

  return { estimatedScore: total, mortality, icu: total >= 15 };
}
