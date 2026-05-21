// ── Rhema Care Flow — Medical Knowledge Base ──────────────────────────────
// mode: Health = true
// Fonte: CID-10 (OMS/DATASUS), Protocolos CFM, MS/RENAME 2022, UpToDate refs
// ──────────────────────────────────────────────────────────────────────────

export const MODE = { Health: true, Code: false } as const;
export type Mode = keyof typeof MODE;

// ── CID-10 Agrupados por Sistema ───────────────────────────────────────────
export interface CidEntry {
  code: string;
  description: string;
  system: MedicalSystem;
  urgency: 'elective' | 'urgent' | 'emergency';
  tags: string[];
}

export type MedicalSystem =
  | 'cardiovascular' | 'respiratory' | 'neurological' | 'gastrointestinal'
  | 'endocrine' | 'infectious' | 'renal' | 'hematological'
  | 'musculoskeletal' | 'psychiatric' | 'obstetric' | 'oncological';

export const CID10_DB: CidEntry[] = [
  // Cardiovascular
  { code: 'I21', description: 'Infarto agudo do miocárdio', system: 'cardiovascular', urgency: 'emergency', tags: ['ACS', 'IAMCSST', 'reperfusão'] },
  { code: 'I21.0', description: 'IAM com supra de ST da parede anterior', system: 'cardiovascular', urgency: 'emergency', tags: ['STEMI', 'DA', 'angioplastia'] },
  { code: 'I21.1', description: 'IAM com supra de ST da parede inferior', system: 'cardiovascular', urgency: 'emergency', tags: ['STEMI', 'CD', 'CX'] },
  { code: 'I20.0', description: 'Angina instável', system: 'cardiovascular', urgency: 'urgent', tags: ['NSTEMI', 'ACS', 'troponina'] },
  { code: 'I50.0', description: 'Insuficiência cardíaca congestiva', system: 'cardiovascular', urgency: 'urgent', tags: ['ICC', 'BNP', 'Killip', 'diurético'] },
  { code: 'I48', description: 'Fibrilação atrial', system: 'cardiovascular', urgency: 'urgent', tags: ['FA', 'CHA2DS2', 'anticoagulação', 'cardioversão'] },
  { code: 'I64', description: 'AVC não especificado como hemorrágico ou isquêmico', system: 'neurological', urgency: 'emergency', tags: ['AVC', 'NIHSS', 'tPA', 'trombólise'] },
  { code: 'I63', description: 'Infarto cerebral', system: 'neurological', urgency: 'emergency', tags: ['AVC isquêmico', 'janela 4.5h', 'alteplase'] },
  // Respiratório
  { code: 'J18', description: 'Pneumonia não especificada', system: 'respiratory', urgency: 'urgent', tags: ['PSI', 'CURB-65', 'ATB'] },
  { code: 'J44.1', description: 'DPOC com exacerbação aguda', system: 'respiratory', urgency: 'urgent', tags: ['DPOC', 'broncodilatador', 'corticoide', 'VNI'] },
  { code: 'J96.0', description: 'Insuficiência respiratória aguda', system: 'respiratory', urgency: 'emergency', tags: ['IRpA', 'intubação', 'VM', 'FiO2'] },
  { code: 'J80', description: 'Síndrome do desconforto respiratório agudo (SDRA)', system: 'respiratory', urgency: 'emergency', tags: ['ARDS', 'PaO2/FiO2', 'prona', 'PEEP'] },
  // Neurológico
  { code: 'G40', description: 'Epilepsia', system: 'neurological', urgency: 'urgent', tags: ['convulsão', 'BZD', 'fenitoína', 'status epilepticus'] },
  { code: 'G41.0', description: 'Estado de mal epiléptico tônico-clônico generalizado', system: 'neurological', urgency: 'emergency', tags: ['status', 'midazolam', 'fenobarbital', 'EEG'] },
  { code: 'G43', description: 'Enxaqueca', system: 'neurological', urgency: 'elective', tags: ['cefaleia', 'triptano', 'profilaxia'] },
  // Sépsis / Infecção
  { code: 'A41.9', description: 'Sepse não especificada', system: 'infectious', urgency: 'emergency', tags: ['SOFA', 'qSOFA', 'lactato', 'ATB 1h', 'bundle sepse'] },
  { code: 'A41.5', description: 'Sepse por outros organismos gram-negativos', system: 'infectious', urgency: 'emergency', tags: ['gram-negativo', 'carbapenem', 'KPC'] },
  { code: 'A40', description: 'Sepse estreptocócica', system: 'infectious', urgency: 'emergency', tags: ['streptococcus', 'penicilina', 'vancomicina'] },
  { code: 'R65.2', description: 'Choque séptico', system: 'infectious', urgency: 'emergency', tags: ['vasopressor', 'noradrenalina', 'PAM >65', 'lactato'] },
  // Endócrino
  { code: 'E10', description: 'Diabetes mellitus tipo 1', system: 'endocrine', urgency: 'elective', tags: ['DM1', 'insulina', 'HbA1c', 'CAD'] },
  { code: 'E11', description: 'Diabetes mellitus tipo 2', system: 'endocrine', urgency: 'elective', tags: ['DM2', 'metformina', 'SGLT2', 'GLP1'] },
  { code: 'E10.1', description: 'DM tipo 1 com cetoacidose', system: 'endocrine', urgency: 'emergency', tags: ['CAD', 'insulina IV', 'hidratação', 'K+'] },
  { code: 'E16.0', description: 'Hipoglicemia induzida por insulina', system: 'endocrine', urgency: 'emergency', tags: ['hipoglicemia', 'glicose 50%', 'glucagon'] },
  // Renal
  { code: 'N17', description: 'Insuficiência renal aguda', system: 'renal', urgency: 'urgent', tags: ['IRA', 'KDIGO', 'creatinina', 'diálise'] },
  { code: 'N18', description: 'Insuficiência renal crônica', system: 'renal', urgency: 'elective', tags: ['IRC', 'TFGe', 'MDRD', 'CKD-EPI'] },
  // Gastrointestinal
  { code: 'K25', description: 'Úlcera gástrica', system: 'gastrointestinal', urgency: 'urgent', tags: ['úlcera', 'Helicobacter', 'IBP', 'endoscopia'] },
  { code: 'K92.1', description: 'Melena', system: 'gastrointestinal', urgency: 'urgent', tags: ['HDA', 'Rockford', 'Glasgow-Blatchford', 'endoscopia'] },
  { code: 'K72', description: 'Insuficiência hepática não classificada em outra parte', system: 'gastrointestinal', urgency: 'emergency', tags: ['IH', 'encefalopatia', 'Child-Pugh', 'MELD'] },
];

// ── RENAME 2022 — Medicamentos Essenciais ─────────────────────────────────
export interface Drug {
  name: string;
  class: string;
  indication: string[];
  dose: string;
  route: 'IV' | 'VO' | 'SC' | 'IM' | 'INH' | 'SL' | 'TOP';
  renalAdjust: boolean;
  hepaticAdjust: boolean;
  pregnancy: 'A' | 'B' | 'C' | 'D' | 'X';
  interactions: string[];
}

export const DRUG_DB: Drug[] = [
  {
    name: 'Noradrenalina', class: 'Vasopressor',
    indication: ['choque séptico', 'choque distributivo'],
    dose: '0,01–3,3 mcg/kg/min em BIC', route: 'IV',
    renalAdjust: false, hepaticAdjust: false, pregnancy: 'C',
    interactions: ['IMAO', 'halotano'],
  },
  {
    name: 'Alteplase (tPA)', class: 'Trombolítico',
    indication: ['AVC isquêmico até 4,5h', 'TEP maciço', 'IAMCSST sem acesso a ICPP'],
    dose: 'AVC: 0,9 mg/kg IV (max 90 mg) — 10% bolus, 90% em 60 min', route: 'IV',
    renalAdjust: false, hepaticAdjust: false, pregnancy: 'C',
    interactions: ['anticoagulantes', 'antiplaquetários'],
  },
  {
    name: 'Midazolam', class: 'Benzodiazepínico',
    indication: ['sedação', 'status epilepticus', 'ansiolise procedural'],
    dose: 'Status: 0,1–0,3 mg/kg IV; Sedação: 0,02–0,1 mg/kg/h BIC', route: 'IV',
    renalAdjust: false, hepaticAdjust: true, pregnancy: 'D',
    interactions: ['opioides', 'CYP3A4 inibidores', 'álcool'],
  },
  {
    name: 'Enoxaparina', class: 'HBPM — Anticoagulante',
    indication: ['TEP', 'TVP', 'SCA', 'profilaxia TEV'],
    dose: 'Terapêutico: 1 mg/kg SC 12/12h; Profilático: 40 mg SC 1x/dia', route: 'SC',
    renalAdjust: true, hepaticAdjust: false, pregnancy: 'B',
    interactions: ['AINEs', 'antiagregantes', 'trombolíticos'],
  },
  {
    name: 'Metformina', class: 'Biguanida — Antidiabético',
    indication: ['DM2', 'pré-diabetes com alto risco'],
    dose: '500–2550 mg/dia VO com refeições, titulação gradual', route: 'VO',
    renalAdjust: true, hepaticAdjust: true, pregnancy: 'B',
    interactions: ['contraste iodado (suspender 48h)', 'álcool', 'cimetidina'],
  },
  {
    name: 'Vancomicina', class: 'Glicopeptídeo — Antibiótico',
    indication: ['MRSA', 'infecções gram-positivas graves', 'meningite bacteriana'],
    dose: '25–30 mg/kg ataque IV; manutenção guiada por AUC/MIC (400–600)', route: 'IV',
    renalAdjust: true, hepaticAdjust: false, pregnancy: 'C',
    interactions: ['aminoglicosídeos', 'anfotericina B', 'diuréticos de alça'],
  },
  {
    name: 'Meropeném', class: 'Carbapenem — Antibiótico',
    indication: ['infecções graves por gram-negativos', 'Pseudomonas', 'KPC (associado)'],
    dose: '1–2 g IV 8/8h (2g em inf. estendida 3h para MIC >2)', route: 'IV',
    renalAdjust: true, hepaticAdjust: false, pregnancy: 'B',
    interactions: ['valproato (reduz nível sérico)'],
  },
  {
    name: 'Furosemida', class: 'Diurético de alça',
    indication: ['edema agudo de pulmão', 'ICC descompensada', 'hipertensão resistente'],
    dose: 'EAP: 40–200 mg IV bolus ou BIC; ICC: 20–80 mg VO/dia', route: 'IV',
    renalAdjust: true, hepaticAdjust: false, pregnancy: 'C',
    interactions: ['aminoglicosídeos', 'lítio', 'digoxina'],
  },
  {
    name: 'Insulina Regular', class: 'Insulina de ação curta',
    indication: ['CAD', 'EHH', 'hiperglicemia aguda hospitalar', 'hiperpotassemia'],
    dose: 'CAD: 0,1 UI/kg/h BIC IV; Hiperpotassemia: 10 UI IV com 50 mL glicose 50%', route: 'IV',
    renalAdjust: true, hepaticAdjust: false, pregnancy: 'B',
    interactions: ['beta-bloqueadores (mascarar hipoglicemia)', 'corticoides', 'tiazídicos'],
  },
  {
    name: 'Amiodarona', class: 'Antiarrítmico classe III',
    indication: ['FA com resposta ventricular rápida', 'FV/TV refratária', 'taquicardia supraventricular'],
    dose: 'FA aguda: 150 mg IV em 10 min → 1 mg/min por 6h → 0,5 mg/min; VO: 200 mg/dia manutenção', route: 'IV',
    renalAdjust: false, hepaticAdjust: true, pregnancy: 'D',
    interactions: ['varfarina', 'digoxina', 'estatinas', 'prolongadores de QT'],
  },
];

// ── Protocolos Clínicos (MS / CFM / SBEM / SBC) ────────────────────────────
export interface ClinicalProtocol {
  id: string;
  name: string;
  cids: string[];
  steps: ProtocolStep[];
  source: string;
  lastUpdated: string;
}

export interface ProtocolStep {
  order: number;
  action: string;
  timeframe: string;
  mandatory: boolean;
  notes?: string;
}

export const PROTOCOLS: ClinicalProtocol[] = [
  {
    id: 'PROT-SEP-001',
    name: 'Bundle Sepse — 1h e 3h (Surviving Sepsis Campaign 2021)',
    cids: ['A41.9', 'R65.2'],
    source: 'Surviving Sepsis Campaign 2021 / CFM',
    lastUpdated: '2021-10-01',
    steps: [
      { order: 1, action: 'Medir lactato sérico (se >2 mmol/L, repetir em 2h)', timeframe: '0–30 min', mandatory: true },
      { order: 2, action: 'Hemoculturas x2 antes do ATB (sem atrasar >45 min)', timeframe: '0–30 min', mandatory: true },
      { order: 3, action: 'ATB de amplo espectro EV (cobertura gram-positivo + gram-negativo ± anaeróbio)', timeframe: '0–60 min', mandatory: true, notes: 'Piperacilina-tazobactam 4,5g IV ou Meropenem 1g IV se sepse nosocomial/MDR' },
      { order: 4, action: 'Cristaloide 30 mL/kg IV se hipotensão ou lactato ≥4 mmol/L', timeframe: '0–180 min', mandatory: true, notes: 'Reavalie com ecocardiograma pontual ou teste de elevação passiva de pernas' },
      { order: 5, action: 'Vasopressor (noradrenalina) se PAM <65 mmHg após ressuscitação', timeframe: '0–60 min', mandatory: true },
      { order: 6, action: 'Reavaliação hemodinâmica com parâmetros dinâmicos (delta PP, VVS, ecocardiografia)', timeframe: '3h', mandatory: false },
    ],
  },
  {
    id: 'PROT-IAM-001',
    name: 'IAM com Supra de ST — Via de Reperfusão',
    cids: ['I21.0', 'I21.1'],
    source: 'Diretriz SBC 2021',
    lastUpdated: '2021-06-01',
    steps: [
      { order: 1, action: 'ECG 12 derivações em até 10 min da chegada', timeframe: '0–10 min', mandatory: true },
      { order: 2, action: 'Aspirina 300 mg VO mastigado + Ticagrelor 180 mg VO (ou Clopidogrel 600 mg)', timeframe: '0–10 min', mandatory: true },
      { order: 3, action: 'Heparina não fracionada 5000 UI IV bolus', timeframe: '0–10 min', mandatory: true },
      { order: 4, action: 'ICPP (ICP Primária) se laboratório de hemodinâmica disponível em <120 min do PCM', timeframe: '0–120 min', mandatory: true, notes: 'Alvo door-to-balloon ≤90 min' },
      { order: 5, action: 'Fibrinólise com Tenecteplase IV se ICPP não disponível em <120 min', timeframe: '0–30 min (se fibrinólise)', mandatory: false, notes: 'Contraindicações absolutas: AVC hemorrágico, cirurgia <3 meses, sangramento ativo' },
      { order: 6, action: 'Transferência para hemodinâmica após fibrinólise (angiografia em 2–24h)', timeframe: '2–24h', mandatory: false },
    ],
  },
  {
    id: 'PROT-AVC-001',
    name: 'AVC Isquêmico Agudo — Trombólise e Trombectomia',
    cids: ['I63'],
    source: 'Diretriz ABN/AMB 2022',
    lastUpdated: '2022-03-01',
    steps: [
      { order: 1, action: 'TC de crânio sem contraste em até 25 min da chegada', timeframe: '0–25 min', mandatory: true },
      { order: 2, action: 'Glicemia capilar + eletrólitos + coagulograma', timeframe: '0–25 min', mandatory: true },
      { order: 3, action: 'NIHSS basal pelo neurologista', timeframe: '0–30 min', mandatory: true },
      { order: 4, action: 'Alteplase 0,9 mg/kg IV (max 90 mg) se dentro da janela 4,5h e sem contraindicações', timeframe: '0–60 min (door-to-needle)', mandatory: true, notes: 'PA <185/110 antes do tPA; não usar anticoagulante/antiagregante nas 24h pós' },
      { order: 5, action: 'AngioTC ou AngioRM para avaliar oclusão de grande vaso (LVO)', timeframe: '0–45 min', mandatory: false },
      { order: 6, action: 'Trombectomia mecânica se LVO e ASPECTS ≥6 dentro de 24h do início dos sintomas', timeframe: '0–24h', mandatory: false },
    ],
  },
  {
    id: 'PROT-CAD-001',
    name: 'Cetoacidose Diabética (CAD)',
    cids: ['E10.1'],
    source: 'ADA Standards of Care 2024',
    lastUpdated: '2024-01-01',
    steps: [
      { order: 1, action: 'SF 0,9% 1 L/h nas primeiras 2h (ajustar conforme sódio corrigido)', timeframe: '0–2h', mandatory: true },
      { order: 2, action: 'Potássio: se K+ ≥3,5 mEq/L → iniciar insulina; se <3,5 → repor antes', timeframe: '0–60 min', mandatory: true, notes: 'Meta K+ 4–5 mEq/L durante insulinização' },
      { order: 3, action: 'Insulina regular 0,1 UI/kg/h BIC IV (sem bolus inicial)', timeframe: '0–60 min', mandatory: true },
      { order: 4, action: 'Glicemia capilar horária; trocar para SG5% + SF 0,45% quando glicemia <250 mg/dL', timeframe: 'Contínuo', mandatory: true },
      { order: 5, action: 'Critérios de resolução: pH >7,3 + HCO3 >18 + GA <12 + glicemia <200', timeframe: '12–24h', mandatory: true },
      { order: 6, action: 'Transição para insulina SC: sobrepor insulina basal 2h antes de suspender BIC', timeframe: 'Resolução', mandatory: true },
    ],
  },
];

// ── Exames de Referência (Valores Normais) ─────────────────────────────────
export interface LabReference {
  name: string;
  unit: string;
  normalMin: number;
  normalMax: number;
  criticalLow?: number;
  criticalHigh?: number;
  notes?: string;
}

export const LAB_REFERENCES: LabReference[] = [
  { name: 'Hemoglobina (Homem)', unit: 'g/dL', normalMin: 13.5, normalMax: 17.5, criticalLow: 7.0, criticalHigh: 20.0 },
  { name: 'Hemoglobina (Mulher)', unit: 'g/dL', normalMin: 12.0, normalMax: 16.0, criticalLow: 7.0, criticalHigh: 20.0 },
  { name: 'Leucócitos', unit: '/mm³', normalMin: 4000, normalMax: 10000, criticalLow: 2000, criticalHigh: 30000 },
  { name: 'Plaquetas', unit: '/mm³', normalMin: 150000, normalMax: 400000, criticalLow: 50000, criticalHigh: 1000000 },
  { name: 'Sódio', unit: 'mEq/L', normalMin: 136, normalMax: 145, criticalLow: 120, criticalHigh: 160 },
  { name: 'Potássio', unit: 'mEq/L', normalMin: 3.5, normalMax: 5.0, criticalLow: 2.5, criticalHigh: 6.5 },
  { name: 'Creatinina (Homem)', unit: 'mg/dL', normalMin: 0.7, normalMax: 1.3, criticalHigh: 10.0 },
  { name: 'Creatinina (Mulher)', unit: 'mg/dL', normalMin: 0.5, normalMax: 1.1, criticalHigh: 10.0 },
  { name: 'Ureia', unit: 'mg/dL', normalMin: 10, normalMax: 50, criticalHigh: 200 },
  { name: 'Glicemia jejum', unit: 'mg/dL', normalMin: 70, normalMax: 99, criticalLow: 40, criticalHigh: 500 },
  { name: 'Troponina I (hsTnI)', unit: 'ng/L', normalMin: 0, normalMax: 53, criticalHigh: 500, notes: 'Limiar 99th percentil = 53 ng/L; >5x = provável IAM' },
  { name: 'BNP', unit: 'pg/mL', normalMin: 0, normalMax: 100, notes: '>400 pg/mL = IC provável; 100-400 = indeterminado' },
  { name: 'PCR', unit: 'mg/L', normalMin: 0, normalMax: 5, notes: '>100 mg/L = infecção bacteriana grave' },
  { name: 'Lactato arterial', unit: 'mmol/L', normalMin: 0.5, normalMax: 2.0, criticalHigh: 4.0, notes: '>2 = hipoperfusão; >4 = choque' },
  { name: 'pH arterial', unit: '', normalMin: 7.35, normalMax: 7.45, criticalLow: 7.20, criticalHigh: 7.60 },
  { name: 'PaO2', unit: 'mmHg', normalMin: 80, normalMax: 100, criticalLow: 60 },
  { name: 'PaCO2', unit: 'mmHg', normalMin: 35, normalMax: 45, criticalLow: 20, criticalHigh: 70 },
  { name: 'HbA1c', unit: '%', normalMin: 4.0, normalMax: 5.6, notes: '5.7-6.4% pré-DM; ≥6.5% DM; meta DM2 <7%' },
  { name: 'INR', unit: '', normalMin: 0.8, normalMax: 1.2, criticalHigh: 5.0, notes: 'Meta anticoagulação FA: 2–3; valva mecânica: 2.5–3.5' },
  { name: 'TFGe CKD-EPI', unit: 'mL/min/1.73m²', normalMin: 90, normalMax: 120, notes: 'G1≥90, G2=60-89, G3a=45-59, G3b=30-44, G4=15-29, G5<15' },
];

// ── Utilidades ─────────────────────────────────────────────────────────────
export function getCidsBySystem(system: MedicalSystem): CidEntry[] {
  return CID10_DB.filter(c => c.system === system);
}

export function searchCids(query: string): CidEntry[] {
  const q = query.toLowerCase();
  return CID10_DB.filter(c =>
    c.code.toLowerCase().includes(q) ||
    c.description.toLowerCase().includes(q) ||
    c.tags.some(t => t.toLowerCase().includes(q))
  );
}

export function getDrugByIndication(indication: string): Drug[] {
  const q = indication.toLowerCase();
  return DRUG_DB.filter(d => d.indication.some(i => i.toLowerCase().includes(q)));
}

export function getProtocol(cid: string): ClinicalProtocol | undefined {
  return PROTOCOLS.find(p => p.cids.includes(cid));
}

export function interpretLab(name: string, value: number): 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high' {
  const ref = LAB_REFERENCES.find(r => r.name.toLowerCase().includes(name.toLowerCase()));
  if (!ref) return 'normal';
  if (ref.criticalLow !== undefined && value < ref.criticalLow) return 'critical_low';
  if (ref.criticalHigh !== undefined && value > ref.criticalHigh) return 'critical_high';
  if (value < ref.normalMin) return 'low';
  if (value > ref.normalMax) return 'high';
  return 'normal';
}
