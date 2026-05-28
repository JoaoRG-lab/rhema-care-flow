/**
 * Centralized clinical constants for the rheumatology application.
 * All medical/clinical constants should be defined here to ensure consistency.
 * Last updated: 2026-05 — expanded by Perplexity audit
 */

// ============================================
// DIAGNOSIS & PATIENT TAGGING
// ============================================

export const DIAGNOSIS_OPTIONS = [
  'RA',
  'SLE',
  'SpA',
  'PsA',
  'Vasculitis',
  'FM',
  'SSc',         // Systemic Sclerosis
  'SS',          // Sjögren's Syndrome
  'PM/DM',       // Polymyositis / Dermatomyositis
  'MCTD',        // Mixed Connective Tissue Disease
  'ANCA-V',      // ANCA-Associated Vasculitis (GPA, MPA, EGPA)
  'APS',         // Antiphospholipid Syndrome
  'OA',          // Osteoarthritis (for mixed clinics)
  'Crystal',     // Gout / CPPD
] as const;
export type DiagnosisType = typeof DIAGNOSIS_OPTIONS[number];

export const THERAPY_OPTIONS = [
  'biologic',
  'infusion',
  'MTX',
  'LEF',
  'HCQ',
  'JAK-i',
  'CYC',         // Cyclophosphamide
  'AZA',         // Azathioprine
  'MMF',         // Mycophenolate
  'Pred',        // Prednisone / corticosteroid oral
  'CS-inj',      // Corticosteroid injection
  'BEL',         // Belimumab
  'RTX',         // Rituximab
  'IVIg',        // Intravenous immunoglobulin
  'GC-pulse',    // IV methylprednisolone pulse
] as const;
export type TherapyType = typeof THERAPY_OPTIONS[number];

export const RISK_OPTIONS = [
  'pregnancy',
  'infection',
  'TB+',
  'HBV+',
  'HCV+',
  'HIV+',
  'malignancy',
  'renal-fail',
  'DM',
  'osteoporosis',
  'anti-coag',   // Patient on anticoagulation (relevant for procedures/biopsies)
] as const;
export type RiskType = typeof RISK_OPTIONS[number];

// ============================================
// SAFETY MONITORING & LABS
// ============================================

export const EVENT_TYPES = [
  'CBC',
  'LFTs',
  'Creatinine',
  'Lipid Panel',
  'TB Screening',
  'HBV Screening',
  'HCV Screening',
  'HIV Screening',
  'Flu Vaccine',
  'Pneumococcal Vaccine',
  'COVID Vaccine',
  'Zoster Vaccine',           // Recommended before JAK-i initiation
  'Eye Exam (HCQ)',
  'Chest X-ray',
  'DEXA Scan',               // Bone density — corticosteroid monitoring
  'Urine PCR (UPCR)',        // Proteinuria monitoring in SLE nephritis
  'Urinalysis',
  'Complement (C3/C4)',
  'ANCA Panel',
  'Ferritin',
  'Uric Acid',
  'TSH',
  'Vitamin D',
  'Capillaroscopy',          // SSc — annual
  'Echocardiogram',          // SSc, SLE (Pulmonary HT screening)
  'PFT (Pulmonary Function)', // SSc, PM/DM, RA-ILD
  'Dermatology Referral',
] as const;
export type EventType = typeof EVENT_TYPES[number];

/**
 * Recommended monitoring frequency (days) per drug — per ACR/EULAR guidelines.
 * -1 = no fixed interval; clinically driven.
 */
export const MONITORING_INTERVALS: Record<string, { labs: string[]; intervalDays: number }[]> = {
  MTX: [
    { labs: ['CBC', 'LFTs', 'Creatinine'], intervalDays: 30 },  // Monthly first 3 months, then q3m
  ],
  LEF: [
    { labs: ['CBC', 'LFTs'], intervalDays: 30 },
  ],
  AZA: [
    { labs: ['CBC', 'LFTs'], intervalDays: 30 },
  ],
  MMF: [
    { labs: ['CBC', 'LFTs', 'Creatinine'], intervalDays: 30 },
  ],
  HCQ: [
    { labs: ['Eye Exam (HCQ)'], intervalDays: 365 },
  ],
  CYC: [
    { labs: ['CBC', 'LFTs', 'Urinalysis', 'Creatinine'], intervalDays: 14 },
  ],
  Biologics: [
    { labs: ['TB Screening', 'HBV Screening', 'HCV Screening', 'CBC'], intervalDays: -1 },
  ],
  'JAK-i': [
    { labs: ['CBC', 'LFTs', 'Lipid Panel', 'TB Screening', 'Zoster Vaccine'], intervalDays: 90 },
  ],
  Pred: [
    { labs: ['DEXA Scan', 'HbA1c', 'Vitamin D'], intervalDays: 180 },
  ],
};

export const MED_CLASS_RECOMMENDATIONS: Record<string, readonly string[]> = {
  MTX: ['CBC', 'LFTs', 'Creatinine'],
  LEF: ['CBC', 'LFTs'],
  AZA: ['CBC', 'LFTs'],
  MMF: ['CBC', 'LFTs', 'Creatinine'],
  CYC: ['CBC', 'LFTs', 'Urinalysis', 'Creatinine'],
  HCQ: ['Eye Exam (HCQ)'],
  Biologics: ['TB Screening', 'HBV Screening', 'HCV Screening', 'CBC'],
  'JAK-i': ['CBC', 'LFTs', 'Lipid Panel', 'TB Screening', 'Zoster Vaccine'],
  Pred: ['DEXA Scan', 'HbA1c', 'Vitamin D'],
} as const;

export const LAB_OPTIONS = [
  'CBC',
  'CMP',
  'LFTs',
  'ESR',
  'CRP',
  'RF',
  'Anti-CCP',
  'Anti-CCP quant',  // Quantitative anti-CCP (>3× ULN = higher erosion risk)
  'ANA',
  'Anti-dsDNA',
  'Anti-Sm',
  'Anti-Ro/SSA',
  'Anti-La/SSB',
  'Anti-Scl-70',     // SSc / diffuse
  'Anti-centromere', // SSc / limited (CREST)
  'ANCA (cANCA)',
  'ANCA (pANCA)',
  'Complement C3',
  'Complement C4',
  'CH50',
  'Antiphospholipid (aCL IgG/IgM)',
  'Anti-β2GPI',
  'Lupus anticoagulant',
  'Lipids',
  'HbA1c',
  'Ferritin',
  'LDH',
  'Uric Acid',
  'UPCR',            // Urine protein:creatinine ratio
  'Urinalysis',
  'TSH',
  'Vitamin D (25-OH)',
  'Aldolase',        // PM/DM
  'Anti-Jo-1',       // Anti-synthetase syndrome
  'Anti-MDA5',       // Rapidly progressive ILD in DM
  'Anti-Mi-2',       // Classic DM skin
] as const;
export type LabType = typeof LAB_OPTIONS[number];

export const IMAGING_OPTIONS = [
  'X-ray hands',
  'X-ray feet',
  'X-ray pelvis',
  'X-ray spine',
  'MRI SI joints',    // AxSpA / nr-axSpA
  'MRI hands/feet',
  'MSK Ultrasound',   // Power Doppler synovitis assessment
  'Chest CT (HRCT)',  // ILD screening — SSc, PM/DM, RA
  'CT scan',
  'Echocardiogram',
  'PFT',
  'DEXA',
  'Capillaroscopy',
  'PET-CT',           // Large vessel vasculitis
] as const;
export type ImagingType = typeof IMAGING_OPTIONS[number];

export const ACTION_OPTIONS = [
  'Medication started',
  'Medication adjusted',
  'Medication stopped',
  'Injection given',
  'Infusion given',
  'Referral made',
  'Imaging ordered',
  'Labs ordered',
  'Score recorded',
  'Patient educated',
  'Vaccine administered',
] as const;
export type ActionType = typeof ACTION_OPTIONS[number];

// ============================================
// BIOLOGIC INFUSIONS
// ============================================

export interface BiologicDrug {
  name: string;
  defaultInterval: number; // days (maintenance phase)
  mechanismClass: string;
  indications: DiagnosisType[];
}

export const BIOLOGIC_DRUGS: readonly BiologicDrug[] = [
  { name: 'Infliximab',      defaultInterval: 56,  mechanismClass: 'anti-TNF',        indications: ['RA', 'SpA', 'PsA'] },
  { name: 'Rituximab',       defaultInterval: 180, mechanismClass: 'anti-CD20',       indications: ['RA', 'SLE', 'ANCA-V', 'SS', 'PM/DM'] },
  { name: 'Abatacept IV',    defaultInterval: 28,  mechanismClass: 'CTLA4-Ig',        indications: ['RA'] },
  { name: 'Tocilizumab IV',  defaultInterval: 28,  mechanismClass: 'anti-IL-6R',      indications: ['RA', 'PM/DM'] },
  { name: 'Belimumab IV',    defaultInterval: 28,  mechanismClass: 'anti-BLyS',       indications: ['SLE'] },
  { name: 'Belimumab SC',    defaultInterval: 7,   mechanismClass: 'anti-BLyS',       indications: ['SLE'] },
  { name: 'Secukinumab',     defaultInterval: 28,  mechanismClass: 'anti-IL-17A',     indications: ['SpA', 'PsA'] },
  { name: 'Ixekizumab',      defaultInterval: 28,  mechanismClass: 'anti-IL-17A',     indications: ['SpA', 'PsA'] },
  { name: 'Guselkumab',      defaultInterval: 56,  mechanismClass: 'anti-IL-23',      indications: ['PsA'] },
  { name: 'Risankizumab',    defaultInterval: 56,  mechanismClass: 'anti-IL-23',      indications: ['PsA'] },
  { name: 'Vedolizumab',     defaultInterval: 56,  mechanismClass: 'anti-integrin',   indications: ['SpA'] },
  { name: 'Anifrolumab',     defaultInterval: 28,  mechanismClass: 'anti-IFNAR1',     indications: ['SLE'] },
  { name: 'Voclosporin',     defaultInterval: 1,   mechanismClass: 'calcineurin-inh', indications: ['SLE'] }, // daily oral
  { name: 'IVIg',            defaultInterval: 28,  mechanismClass: 'IgG replacement', indications: ['PM/DM'] },
  { name: 'Cyclophosphamide IV', defaultInterval: 28, mechanismClass: 'alkylating',  indications: ['SLE', 'ANCA-V', 'SSc'] },
] as const;

// ============================================
// TAG STYLING (for DiagnosisTag component)
// ============================================

export const TAG_STYLES: Record<string, string> = {
  // Diagnoses
  RA: 'tag-ra',
  SLE: 'tag-sle',
  SpA: 'tag-spa',
  PsA: 'tag-psa',
  Vasculitis: 'tag-vasculitis',
  'ANCA-V': 'tag-vasculitis',
  FM: 'tag-fm',
  SSc: 'tag-ssc',
  SS: 'tag-ss',
  'PM/DM': 'tag-pmdm',
  MCTD: 'tag-mctd',
  APS: 'tag-aps',
  OA: 'tag-oa',
  Crystal: 'tag-crystal',
  // Therapies
  biologic: 'tag-biologic',
  infusion: 'tag-infusion',
  MTX: 'tag-mtx',
  LEF: 'tag-lef',
  HCQ: 'tag-hcq',
  'JAK-i': 'tag-jaki',
  CYC: 'tag-cyc',
  AZA: 'tag-aza',
  MMF: 'tag-mmf',
  Pred: 'tag-pred',
  'CS-inj': 'tag-cs',
  BEL: 'tag-bel',
  RTX: 'tag-rtx',
  IVIg: 'tag-ivig',
  'GC-pulse': 'tag-pred',
  // Risk flags
  pregnancy: 'tag-pregnancy',
  infection: 'tag-infection',
  'TB+': 'tag-infection',
  'HBV+': 'tag-infection',
  'HCV+': 'tag-infection',
  'HIV+': 'tag-infection',
  malignancy: 'tag-malignancy',
  'renal-fail': 'tag-renal',
  DM: 'tag-dm',
  osteoporosis: 'tag-osteo',
  'anti-coag': 'tag-anticoag',
};

// ============================================
// SLEDAI-2K SCORING (SLE Disease Activity Index)
// ============================================

export interface SLEDAIItem {
  id: string;
  label: string;
  description: string;
  weight: number;
  category: 'cns' | 'vascular' | 'renal' | 'musculoskeletal' | 'mucocutaneous' | 'serositis' | 'immunologic' | 'constitutional';
}

export const SLEDAI_CATEGORY_LABELS: Record<string, string> = {
  cns: 'Central Nervous System',
  vascular: 'Vascular',
  renal: 'Renal',
  musculoskeletal: 'Musculoskeletal',
  mucocutaneous: 'Mucocutaneous',
  serositis: 'Serositis',
  immunologic: 'Immunologic',
  constitutional: 'Constitutional',
};

/** SLEDAI-2K interpretation:
 *  0 = no activity; 1-5 = mild; 6-10 = moderate; 11-19 = high; ≥20 = very high */
export const SLEDAI_INTERPRETATION = [
  { min: 0,  max: 0,  label: 'Remission',   color: 'success' },
  { min: 1,  max: 5,  label: 'Mild',        color: 'gold' },
  { min: 6,  max: 10, label: 'Moderate',    color: 'warning' },
  { min: 11, max: 19, label: 'High',        color: 'error' },
  { min: 20, max: 105,label: 'Very High',   color: 'error' },
] as const;

export const SLEDAI_ITEMS: readonly SLEDAIItem[] = [
  // CNS (8 points each)
  { id: 'seizure',        label: 'Seizure',                 description: 'Recent onset, exclude metabolic, infectious or drug causes',               weight: 8, category: 'cns' },
  { id: 'psychosis',      label: 'Psychosis',               description: 'Altered ability to function, exclude uremia and drugs',                    weight: 8, category: 'cns' },
  { id: 'organic_brain',  label: 'Organic Brain Syndrome',  description: 'Altered mental function with impaired orientation, memory or other function', weight: 8, category: 'cns' },
  { id: 'visual',         label: 'Visual Disturbance',      description: 'Retinal changes of SLE, exclude hypertension',                             weight: 8, category: 'cns' },
  { id: 'cranial_nerve',  label: 'Cranial Nerve Disorder',  description: 'New onset sensory or motor neuropathy involving cranial nerves',            weight: 8, category: 'cns' },
  { id: 'lupus_headache', label: 'Lupus Headache',          description: 'Severe persistent headache, may be migrainous, not responsive to narcotics', weight: 8, category: 'cns' },
  { id: 'cva',            label: 'CVA',                     description: 'New onset cerebrovascular accident, exclude arteriosclerosis',              weight: 8, category: 'cns' },
  // Vascular (8 points)
  { id: 'vasculitis',     label: 'Vasculitis',              description: 'Ulceration, gangrene, tender finger nodules, periungual infarction, splinter hemorrhages', weight: 8, category: 'vascular' },
  // Renal (4 points each)
  { id: 'urinary_casts',  label: 'Urinary Casts',           description: 'Heme-granular or RBC casts',                                               weight: 4, category: 'renal' },
  { id: 'hematuria',      label: 'Hematuria',               description: '>5 RBC/HPF, exclude stone, infection, or other cause',                     weight: 4, category: 'renal' },
  { id: 'proteinuria',    label: 'Proteinuria',             description: '>0.5 g/24h or UPCR >0.5, new onset or recent increase',                   weight: 4, category: 'renal' },
  { id: 'pyuria',         label: 'Pyuria',                  description: '>5 WBC/HPF, exclude infection',                                            weight: 4, category: 'renal' },
  // Musculoskeletal (4 points)
  { id: 'arthritis',      label: 'Arthritis',               description: '≥2 joints with pain and signs of inflammation (tenderness, swelling, effusion)', weight: 4, category: 'musculoskeletal' },
  // Mucocutaneous (2 points each)
  { id: 'rash',           label: 'Rash',                    description: 'New or ongoing inflammatory rash',                                          weight: 2, category: 'mucocutaneous' },
  { id: 'alopecia',       label: 'Alopecia',                description: 'New or ongoing abnormal, patchy or diffuse hair loss',                     weight: 2, category: 'mucocutaneous' },
  { id: 'mucosal_ulcers', label: 'Mucosal Ulcers',          description: 'New or ongoing oral or nasal ulcers',                                       weight: 2, category: 'mucocutaneous' },
  // Serositis (2 points each)
  { id: 'pleurisy',       label: 'Pleurisy',                description: 'Pleuritic chest pain with rub or effusion, or pleural thickening',          weight: 2, category: 'serositis' },
  { id: 'pericarditis',   label: 'Pericarditis',            description: 'Pericardial pain with rub, effusion, or ECG/echo confirmation',            weight: 2, category: 'serositis' },
  // Immunologic (2 points each)
  { id: 'low_complement', label: 'Low Complement',          description: 'Decrease in CH50, C3, or C4 below lab normal',                             weight: 2, category: 'immunologic' },
  { id: 'increased_dna',  label: 'Increased DNA Binding',   description: '>25% binding by Farr assay or above normal range (anti-dsDNA elevated)',   weight: 2, category: 'immunologic' },
  // Constitutional (1 point each)
  { id: 'fever',          label: 'Fever',                   description: '>38°C, exclude infection',                                                  weight: 1, category: 'constitutional' },
  { id: 'thrombocytopenia', label: 'Thrombocytopenia',      description: '<100,000 platelets/mm³',                                                    weight: 1, category: 'constitutional' },
  { id: 'leukopenia',     label: 'Leukopenia',              description: '<3,000 WBC/mm³, exclude drug causes',                                       weight: 1, category: 'constitutional' },
] as const;

// ============================================
// DAS28 SCORING (RA Disease Activity)
// ============================================

/** DAS28-ESR = 0.56√TJC28 + 0.28√SJC28 + 0.70 ln(ESR) + 0.014 GH
 *  DAS28-CRP = 0.56√TJC28 + 0.28√SJC28 + 0.36 ln(CRP+1) + 0.014 GH + 0.96 */
export const DAS28_INTERPRETATION = [
  { max: 2.6,  label: 'Remission',              color: 'success' },
  { max: 3.2,  label: 'Low Disease Activity',   color: 'gold' },
  { max: 5.1,  label: 'Moderate Disease Activity', color: 'warning' },
  { max: Infinity, label: 'High Disease Activity', color: 'error' },
] as const;

export function calcDAS28ESR(tjc28: number, sjc28: number, esr: number, gh: number): number {
  return +(0.56 * Math.sqrt(tjc28) + 0.28 * Math.sqrt(sjc28) + 0.70 * Math.log(esr || 1) + 0.014 * gh).toFixed(2);
}

export function calcDAS28CRP(tjc28: number, sjc28: number, crp: number, gh: number): number {
  return +(0.56 * Math.sqrt(tjc28) + 0.28 * Math.sqrt(sjc28) + 0.36 * Math.log((crp || 0) + 1) + 0.014 * gh + 0.96).toFixed(2);
}

// ============================================
// SDAI / CDAI SCORING (RA — simpler at bedside)
// ============================================

/** SDAI = TJC28 + SJC28 + PGA(0-10) + PhGA(0-10) + CRP(mg/dL)
 *  CDAI = TJC28 + SJC28 + PGA(0-10) + PhGA(0-10)  (no labs needed) */
export const SDAI_INTERPRETATION = [
  { max: 3.3,  label: 'Remission',              color: 'success' },
  { max: 11,   label: 'Low Disease Activity',   color: 'gold' },
  { max: 26,   label: 'Moderate Disease Activity', color: 'warning' },
  { max: Infinity, label: 'High Disease Activity', color: 'error' },
] as const;

export const CDAI_INTERPRETATION = [
  { max: 2.8,  label: 'Remission',              color: 'success' },
  { max: 10,   label: 'Low Disease Activity',   color: 'gold' },
  { max: 22,   label: 'Moderate Disease Activity', color: 'warning' },
  { max: Infinity, label: 'High Disease Activity', color: 'error' },
] as const;

// ============================================
// DAPSA SCORING (PsA — GRAPPA/EULAR recommended)
// ============================================

/** DAPSA = TJC66 + SJC68 + PatVAS(0-10) + PatPain(0-10) + CRP(mg/dL) */
export const DAPSA_INTERPRETATION = [
  { max: 4,   label: 'Remission',              color: 'success' },
  { max: 14,  label: 'Low Disease Activity',   color: 'gold' },
  { max: 28,  label: 'Moderate Disease Activity', color: 'warning' },
  { max: Infinity, label: 'High Disease Activity', color: 'error' },
] as const;

// ============================================
// BASDAI SCORING (SpA / AxSpA)
// ============================================

/** BASDAI score (0-10): mean of 6 NRS items (fatigue, back pain, peripheral pain/swelling,
 *  areas of tenderness, morning stiffness quality, morning stiffness duration)
 *  ≥4 = active disease (consider biologic) */
export const BASDAI_INTERPRETATION = [
  { max: 4,       label: 'Low/Inactive',    color: 'success' },
  { max: Infinity, label: 'Active Disease', color: 'error' },
] as const;

export const BASDAI_ITEMS = [
  { id: 'fatigue',             label: 'Fatigue / tiredness',                description: 'How much fatigue/tiredness have you experienced? (0=none, 10=severe)' },
  { id: 'back_pain',           label: 'Neck/back/hip pain',                 description: 'Spinal/axial pain level' },
  { id: 'peripheral_pain',     label: 'Peripheral joint pain/swelling',     description: 'Pain/swelling in joints other than neck/back/hips' },
  { id: 'tenderness',          label: 'Areas of tenderness',                description: 'Discomfort from touch or pressure (enthesitis)' },
  { id: 'morning_stiffness_q', label: 'Morning stiffness severity',         description: 'How severe is your morning stiffness?' },
  { id: 'morning_stiffness_d', label: 'Morning stiffness duration',         description: 'Duration: 0=0h, 10=2h or more' },
] as const;

// ============================================
// HAQ-DI (Health Assessment Questionnaire)
// ============================================

/** HAQ-DI 0–3: 0=no difficulty, 3=unable to do
 *  Score ≥1.5 associated with worse outcomes / disability */
export const HAQ_INTERPRETATION = [
  { max: 0.5,  label: 'None/Mild disability',   color: 'success' },
  { max: 1.5,  label: 'Moderate disability',     color: 'warning' },
  { max: 3.0,  label: 'Severe disability',        color: 'error' },
] as const;

export const HAQ_CATEGORIES = [
  'Dressing & Grooming',
  'Arising',
  'Eating',
  'Walking',
  'Hygiene',
  'Reach',
  'Grip',
  'Activities',
] as const;
