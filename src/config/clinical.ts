 /**
  * Centralized clinical constants for the rheumatology application.
  * All medical/clinical constants should be defined here to ensure consistency.
  */
 
 // ============================================
 // DIAGNOSIS & PATIENT TAGGING
 // ============================================
 
 export const DIAGNOSIS_OPTIONS = ['RA', 'SLE', 'SpA', 'PsA', 'Vasculitis', 'FM'] as const;
 export type DiagnosisType = typeof DIAGNOSIS_OPTIONS[number];
 
 export const THERAPY_OPTIONS = ['biologic', 'infusion', 'MTX', 'LEF', 'HCQ', 'JAK-i'] as const;
 export type TherapyType = typeof THERAPY_OPTIONS[number];
 
 export const RISK_OPTIONS = ['pregnancy', 'infection', 'TB+', 'HBV+'] as const;
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
   'Flu Vaccine',
   'Pneumococcal Vaccine',
   'COVID Vaccine',
   'Eye Exam (HCQ)',
   'Chest X-ray',
 ] as const;
 export type EventType = typeof EVENT_TYPES[number];
 
 export const MED_CLASS_RECOMMENDATIONS: Record<string, readonly string[]> = {
   MTX: ['CBC', 'LFTs', 'Creatinine'],
   LEF: ['CBC', 'LFTs'],
   AZA: ['CBC', 'LFTs'],
   MMF: ['CBC', 'LFTs', 'Creatinine'],
   HCQ: ['Eye Exam (HCQ)'],
   Biologics: ['TB Screening', 'HBV Screening', 'HCV Screening', 'CBC'],
   'JAK-i': ['CBC', 'LFTs', 'Lipid Panel', 'TB Screening'],
 } as const;
 
 export const LAB_OPTIONS = [
   'CBC',
   'CMP',
   'LFTs',
   'ESR',
   'CRP',
   'RF',
   'Anti-CCP',
   'ANA',
   'dsDNA',
   'Complement',
   'Lipids',
   'HbA1c',
 ] as const;
 export type LabType = typeof LAB_OPTIONS[number];
 
 export const IMAGING_OPTIONS = [
   'X-ray hands',
   'X-ray feet',
   'X-ray spine',
   'MRI',
   'Ultrasound',
   'CT',
   'DXA',
 ] as const;
 export type ImagingType = typeof IMAGING_OPTIONS[number];
 
 export const ACTION_OPTIONS = [
   'Medication started',
   'Medication adjusted',
   'Medication stopped',
   'Injection given',
   'Referral made',
   'Imaging ordered',
   'Labs ordered',
 ] as const;
 export type ActionType = typeof ACTION_OPTIONS[number];
 
 // ============================================
 // BIOLOGIC INFUSIONS
 // ============================================
 
 export interface BiologicDrug {
   name: string;
   defaultInterval: number; // days
 }
 
 export const BIOLOGIC_DRUGS: readonly BiologicDrug[] = [
   { name: 'Infliximab', defaultInterval: 56 },
   { name: 'Rituximab', defaultInterval: 180 },
   { name: 'Abatacept IV', defaultInterval: 28 },
   { name: 'Tocilizumab IV', defaultInterval: 28 },
   { name: 'Belimumab', defaultInterval: 28 },
   { name: 'Secukinumab', defaultInterval: 28 },
   { name: 'Vedolizumab', defaultInterval: 56 },
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
   FM: 'tag-fm',
   // Therapies
   biologic: 'tag-biologic',
   infusion: 'tag-infusion',
   MTX: 'tag-mtx',
   LEF: 'tag-lef',
   HCQ: 'tag-hcq',
   'JAK-i': 'tag-jaki',
   // Risk flags
   pregnancy: 'tag-pregnancy',
   infection: 'tag-infection',
   'TB+': 'tag-infection',
   'HBV+': 'tag-infection',
 };
 
 // ============================================
 // SLEDAI SCORING (SLE Disease Activity Index)
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
 
 export const SLEDAI_ITEMS: readonly SLEDAIItem[] = [
   // CNS (8 points each)
   { id: 'seizure', label: 'Seizure', description: 'Recent onset, exclude metabolic, infectious or drug causes', weight: 8, category: 'cns' },
   { id: 'psychosis', label: 'Psychosis', description: 'Altered ability to function, exclude uremia and drugs', weight: 8, category: 'cns' },
   { id: 'organic_brain', label: 'Organic Brain Syndrome', description: 'Altered mental function with impaired orientation, memory or other function', weight: 8, category: 'cns' },
   { id: 'visual', label: 'Visual Disturbance', description: 'Retinal changes of SLE, exclude hypertension', weight: 8, category: 'cns' },
   { id: 'cranial_nerve', label: 'Cranial Nerve Disorder', description: 'New onset sensory or motor neuropathy involving cranial nerves', weight: 8, category: 'cns' },
   { id: 'lupus_headache', label: 'Lupus Headache', description: 'Severe persistent headache, may be migrainous, not responsive to narcotics', weight: 8, category: 'cns' },
   { id: 'cva', label: 'CVA', description: 'New onset cerebrovascular accident, exclude arteriosclerosis', weight: 8, category: 'cns' },
   // Vascular (8 points)
   { id: 'vasculitis', label: 'Vasculitis', description: 'Ulceration, gangrene, tender finger nodules, periungual infarction, splinter hemorrhages', weight: 8, category: 'vascular' },
   // Renal (4 points each)
   { id: 'urinary_casts', label: 'Urinary Casts', description: 'Heme-granular or RBC casts', weight: 4, category: 'renal' },
   { id: 'hematuria', label: 'Hematuria', description: '>5 RBC/HPF, exclude stone, infection, or other cause', weight: 4, category: 'renal' },
   { id: 'proteinuria', label: 'Proteinuria', description: '>0.5 g/24 hours, new onset or recent increase', weight: 4, category: 'renal' },
   { id: 'pyuria', label: 'Pyuria', description: '>5 WBC/HPF, exclude infection', weight: 4, category: 'renal' },
   // Musculoskeletal (4 points)
   { id: 'arthritis', label: 'Arthritis', description: '≥2 joints with pain and signs of inflammation', weight: 4, category: 'musculoskeletal' },
   // Mucocutaneous (2 points each)
   { id: 'rash', label: 'Rash', description: 'New or ongoing inflammatory rash', weight: 2, category: 'mucocutaneous' },
   { id: 'alopecia', label: 'Alopecia', description: 'New or ongoing abnormal, patchy or diffuse hair loss', weight: 2, category: 'mucocutaneous' },
   { id: 'mucosal_ulcers', label: 'Mucosal Ulcers', description: 'New or ongoing oral or nasal ulcers', weight: 2, category: 'mucocutaneous' },
   // Serositis (2 points each)
   { id: 'pleurisy', label: 'Pleurisy', description: 'Pleuritic chest pain with rub or effusion, or pleural thickening', weight: 2, category: 'serositis' },
   { id: 'pericarditis', label: 'Pericarditis', description: 'Pericardial pain with rub, effusion, or ECG/echo confirmation', weight: 2, category: 'serositis' },
   // Immunologic (2 points each)
   { id: 'low_complement', label: 'Low Complement', description: 'Decrease in CH50, C3, or C4 below lab normal', weight: 2, category: 'immunologic' },
   { id: 'increased_dna', label: 'Increased DNA Binding', description: '>25% binding by Farr assay or above normal range', weight: 2, category: 'immunologic' },
   // Constitutional (1 point each)
   { id: 'fever', label: 'Fever', description: '>38°C, exclude infection', weight: 1, category: 'constitutional' },
   { id: 'thrombocytopenia', label: 'Thrombocytopenia', description: '<100,000 platelets/mm³', weight: 1, category: 'constitutional' },
   { id: 'leukopenia', label: 'Leukopenia', description: '<3,000 WBC/mm³, exclude drug causes', weight: 1, category: 'constitutional' },
 ] as const;