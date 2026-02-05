 // Calculator Registry - Full hub with categories, search, and favorites
 
 export type CalculatorCategory = 
   | 'disease-activity'
   | 'classification'
   | 'functional'
   | 'prognosis'
   | 'monitoring';
 
 export type DiseaseType = 
   | 'ra'
   | 'sle'
   | 'spa'
   | 'psa'
   | 'vasculitis'
   | 'oa'
   | 'fm'
   | 'gout'
   | 'general';
 
 export interface Calculator {
   id: string;
   name: string;
   shortName: string;
   description: string;
   category: CalculatorCategory;
   diseases: DiseaseType[];
   formula?: string;
   reference?: string;
   implemented: boolean;
 }
 
 export const CALCULATOR_CATEGORIES: Record<CalculatorCategory, { label: string; description: string }> = {
   'disease-activity': { label: 'Disease Activity', description: 'Measure current disease activity levels' },
   'classification': { label: 'Classification Criteria', description: 'Diagnostic classification criteria' },
   'functional': { label: 'Functional Assessment', description: 'Physical function and disability measures' },
   'prognosis': { label: 'Prognosis & Risk', description: 'Risk stratification and prognosis tools' },
   'monitoring': { label: 'Monitoring', description: 'Treatment monitoring and response criteria' },
 };
 
 export const DISEASE_LABELS: Record<DiseaseType, { label: string; color: string }> = {
   ra: { label: 'RA', color: 'tag-ra' },
   sle: { label: 'SLE', color: 'tag-sle' },
   spa: { label: 'SpA', color: 'tag-spa' },
   psa: { label: 'PsA', color: 'tag-psa' },
   vasculitis: { label: 'Vasculitis', color: 'tag-vasculitis' },
   oa: { label: 'OA', color: 'bg-amber-100 text-amber-800 border-amber-300' },
   fm: { label: 'FM', color: 'tag-fm' },
   gout: { label: 'Gout', color: 'bg-orange-100 text-orange-800 border-orange-300' },
   general: { label: 'General', color: 'bg-slate-100 text-slate-700 border-slate-300' },
 };
 
 export const CALCULATORS: Calculator[] = [
   // Disease Activity Scores
   {
     id: 'das28-esr',
     name: 'DAS28-ESR',
     shortName: 'DAS28',
     description: 'Disease Activity Score using ESR for Rheumatoid Arthritis',
     category: 'disease-activity',
     diseases: ['ra'],
     formula: '0.56×√TJC + 0.28×√SJC + 0.70×ln(ESR) + 0.014×GH',
     reference: 'van der Heijde et al. 1990',
     implemented: true,
   },
   {
     id: 'das28-crp',
     name: 'DAS28-CRP',
     shortName: 'DAS28-CRP',
     description: 'Disease Activity Score using CRP for Rheumatoid Arthritis',
     category: 'disease-activity',
     diseases: ['ra'],
     formula: '0.56×√TJC + 0.28×√SJC + 0.36×ln(CRP+1) + 0.014×GH + 0.96',
    implemented: true,
   },
   {
     id: 'cdai',
     name: 'CDAI',
     shortName: 'CDAI',
     description: 'Clinical Disease Activity Index for RA',
     category: 'disease-activity',
     diseases: ['ra'],
     formula: 'TJC + SJC + PGA + EGA',
     implemented: true,
   },
   {
     id: 'sdai',
     name: 'SDAI',
     shortName: 'SDAI',
     description: 'Simplified Disease Activity Index for RA',
     category: 'disease-activity',
     diseases: ['ra'],
     formula: 'TJC + SJC + PGA + EGA + CRP',
     implemented: false,
   },
   {
     id: 'basdai',
     name: 'BASDAI',
     shortName: 'BASDAI',
     description: 'Bath Ankylosing Spondylitis Disease Activity Index',
     category: 'disease-activity',
     diseases: ['spa'],
     formula: '(Q1+Q2+Q3+Q4+(Q5+Q6)/2)/5',
     implemented: true,
   },
   {
     id: 'asdas-crp',
     name: 'ASDAS-CRP',
     shortName: 'ASDAS',
     description: 'Ankylosing Spondylitis Disease Activity Score',
     category: 'disease-activity',
     diseases: ['spa'],
     formula: '0.12×Back Pain + 0.06×Duration + 0.11×PGA + 0.07×Peripheral + 0.58×ln(CRP+1)',
     implemented: false,
   },
   {
     id: 'sledai',
     name: 'SLEDAI-2K',
     shortName: 'SLEDAI',
     description: 'Systemic Lupus Erythematosus Disease Activity Index',
     category: 'disease-activity',
     diseases: ['sle'],
     reference: 'Gladman et al. 2002',
     implemented: true,
   },
   {
     id: 'bilag',
     name: 'BILAG-2004',
     shortName: 'BILAG',
     description: 'British Isles Lupus Assessment Group Index',
     category: 'disease-activity',
     diseases: ['sle'],
     implemented: false,
   },
   {
     id: 'dapsa',
     name: 'DAPSA',
     shortName: 'DAPSA',
     description: 'Disease Activity in Psoriatic Arthritis',
     category: 'disease-activity',
     diseases: ['psa'],
     formula: 'TJC + SJC + Pain VAS + PGA + CRP',
     implemented: false,
   },
   {
     id: 'mda',
     name: 'MDA',
     shortName: 'MDA',
     description: 'Minimal Disease Activity for PsA (5/7 criteria)',
     category: 'disease-activity',
     diseases: ['psa'],
     implemented: false,
   },
   {
     id: 'bvas',
     name: 'BVAS v3',
     shortName: 'BVAS',
     description: 'Birmingham Vasculitis Activity Score',
     category: 'disease-activity',
     diseases: ['vasculitis'],
     implemented: false,
   },
   
   // Classification Criteria
   {
     id: 'acr-eular-ra',
     name: 'ACR/EULAR 2010 RA Criteria',
     shortName: 'RA Criteria',
     description: 'Classification criteria for Rheumatoid Arthritis (≥6 points)',
     category: 'classification',
     diseases: ['ra'],
     reference: 'Aletaha et al. 2010',
    implemented: true,
   },
   {
     id: 'slicc-sle',
     name: 'SLICC 2012 SLE Criteria',
     shortName: 'SLICC',
     description: 'Systemic Lupus International Collaborating Clinics criteria',
     category: 'classification',
     diseases: ['sle'],
     implemented: false,
   },
   {
     id: 'eular-acr-sle',
     name: 'EULAR/ACR 2019 SLE Criteria',
     shortName: 'SLE 2019',
     description: 'Latest classification criteria for SLE',
     category: 'classification',
     diseases: ['sle'],
     implemented: false,
   },
   {
     id: 'asas-axspa',
     name: 'ASAS axSpA Criteria',
     shortName: 'axSpA',
     description: 'Assessment of SpondyloArthritis criteria',
     category: 'classification',
     diseases: ['spa'],
     implemented: false,
   },
   {
     id: 'caspar',
     name: 'CASPAR Criteria',
     shortName: 'CASPAR',
     description: 'Classification Criteria for Psoriatic Arthritis',
     category: 'classification',
     diseases: ['psa'],
     implemented: false,
   },
   {
     id: 'acr-fibromyalgia',
     name: 'ACR 2016 FM Criteria',
     shortName: 'FM Criteria',
     description: 'Fibromyalgia diagnostic criteria (WPI + SSS)',
     category: 'classification',
     diseases: ['fm'],
     implemented: false,
   },
   {
     id: 'acr-eular-gout',
     name: 'ACR/EULAR 2015 Gout Criteria',
     shortName: 'Gout',
     description: 'Classification criteria for gout',
     category: 'classification',
     diseases: ['gout'],
     implemented: false,
   },
   
   // Functional Assessment
   {
     id: 'haq-di',
     name: 'HAQ-DI',
     shortName: 'HAQ',
     description: 'Health Assessment Questionnaire Disability Index',
     category: 'functional',
     diseases: ['ra', 'general'],
     implemented: false,
   },
   {
     id: 'rapid3',
     name: 'RAPID3',
     shortName: 'RAPID3',
     description: 'Routine Assessment of Patient Index Data 3',
     category: 'functional',
     diseases: ['ra'],
     formula: 'Function + Pain + PGA (0-30 scale)',
     implemented: false,
   },
   {
     id: 'basfi',
     name: 'BASFI',
     shortName: 'BASFI',
     description: 'Bath Ankylosing Spondylitis Functional Index',
     category: 'functional',
     diseases: ['spa'],
     implemented: false,
   },
   {
     id: 'womac',
     name: 'WOMAC',
     shortName: 'WOMAC',
     description: 'Western Ontario and McMaster Universities Index (numeric)',
     category: 'functional',
     diseases: ['oa'],
     implemented: false,
   },
   {
     id: 'fiq-r',
     name: 'FIQ-R',
     shortName: 'FIQ-R',
     description: 'Revised Fibromyalgia Impact Questionnaire',
     category: 'functional',
     diseases: ['fm'],
     implemented: false,
   },
   
   // Prognosis & Risk
   {
     id: 'slicc-sdi',
     name: 'SLICC/ACR SDI',
     shortName: 'SDI',
     description: 'Systemic Lupus International Damage Index',
     category: 'prognosis',
     diseases: ['sle'],
     implemented: false,
   },
   {
     id: 'sharp-score',
     name: 'Sharp/van der Heijde Score',
     shortName: 'Sharp',
     description: 'Radiographic progression scoring for RA',
     category: 'prognosis',
     diseases: ['ra'],
     implemented: false,
   },
   {
     id: 'five-factor-score',
     name: 'Five Factor Score',
     shortName: 'FFS',
     description: 'Prognostic score for systemic necrotizing vasculitis',
     category: 'prognosis',
     diseases: ['vasculitis'],
     implemented: false,
   },
   
   // Monitoring
   {
     id: 'eular-response',
     name: 'EULAR Response Criteria',
     shortName: 'EULAR Resp',
     description: 'Treatment response classification (DAS28-based)',
     category: 'monitoring',
     diseases: ['ra'],
     implemented: false,
   },
   {
     id: 'acr-response',
     name: 'ACR20/50/70 Response',
     shortName: 'ACR Resp',
     description: 'American College of Rheumatology improvement criteria',
     category: 'monitoring',
     diseases: ['ra'],
     implemented: false,
   },
   {
     id: 'asas-response',
     name: 'ASAS Response Criteria',
     shortName: 'ASAS Resp',
     description: 'Assessment of response in Spondyloarthritis',
     category: 'monitoring',
     diseases: ['spa'],
     implemented: false,
   },
   {
     id: 'sle-responder-index',
     name: 'SLE Responder Index',
     shortName: 'SRI',
     description: 'Composite response measure for SLE trials',
     category: 'monitoring',
     diseases: ['sle'],
     implemented: false,
   },
 ];
 
 // Favorites management
 const FAVORITES_KEY = 'rheumaflow_calculator_favorites';
 
 export function getFavorites(): string[] {
   try {
     const stored = localStorage.getItem(FAVORITES_KEY);
     return stored ? JSON.parse(stored) : [];
   } catch {
     return [];
   }
 }
 
 export function toggleFavorite(calculatorId: string): string[] {
   const favorites = getFavorites();
   const index = favorites.indexOf(calculatorId);
   if (index === -1) {
     favorites.push(calculatorId);
   } else {
     favorites.splice(index, 1);
   }
   localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
   return favorites;
 }
 
 // History management
 const HISTORY_KEY = 'rheumaflow_calculator_history';
 
 export interface HistoryEntry {
   calculatorId: string;
   timestamp: number;
   score: number;
   inputs: Record<string, number | string>;
 }
 
 export function getHistory(): HistoryEntry[] {
   try {
     const stored = localStorage.getItem(HISTORY_KEY);
     return stored ? JSON.parse(stored) : [];
   } catch {
     return [];
   }
 }
 
 export function addToHistory(entry: Omit<HistoryEntry, 'timestamp'>): void {
   const history = getHistory();
   history.unshift({ ...entry, timestamp: Date.now() });
   // Keep only last 50 entries
   localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
 }
 
 export function clearHistory(): void {
   localStorage.removeItem(HISTORY_KEY);
 }