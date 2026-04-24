import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { errorResponse } from "../_shared/errors.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// High-impact sources for medical literature search - ALL CLINICAL MEDICINE
const AUTHORITATIVE_SOURCES = [
  // General Medicine
  'nejm.org',
  'thelancet.com',
  'nature.com',
  'bmj.com',
  'jamanetwork.com',
  'annals.org', // Annals of Internal Medicine
  'pubmed.ncbi.nlm.nih.gov',
  
  // Rheumatology
  'eular.org',
  'rheumatology.org',
  'ard.bmj.com',
  'reumatologia.org.br',
  
  // Cardiology
  'acc.org',
  'escardio.org',
  'ahajournals.org',
  'jacc.org',
  
  // Oncology
  'asco.org',
  'esmo.org',
  'cancer.gov',
  'jco.ascopubs.org',
  
  // Neurology
  'aan.com',
  'neurology.org',
  
  // Infectious Disease
  'idsociety.org',
  'cdc.gov',
  'who.int',
  
  // Endocrinology
  'endocrine.org',
  'diabetes.org',
  'thyroid.org',
  
  // Pulmonology
  'thoracic.org',
  'ersnet.org',
  
  // Gastroenterology
  'gastro.org',
  'ueg.eu',
  
  // Nephrology
  'asn-online.org',
  'kdigo.org',
  
  // Hematology
  'hematology.org',
  
  // Psychiatry
  'psychiatry.org',
  
  // Pediatrics
  'aap.org',
  
  // Emergency Medicine
  'acep.org',
  
  // Surgery
  'facs.org',
];

// Comprehensive seed topics for ALL CLINICAL MEDICINE knowledge base
const SEED_TOPICS = [
  // ============ RHEUMATOLOGY ============
  { topic: 'ACR/EULAR 2024 Rheumatoid Arthritis Classification Criteria', category: 'Guidelines', disease_area: 'Rheumatology', priority: 10, sources: ['ACR', 'EULAR'] },
  { topic: 'JAK Inhibitors Comparative Efficacy and Safety in Rheumatoid Arthritis', category: 'Pharmacology', disease_area: 'Rheumatology', priority: 10, sources: ['NEJM', 'Lancet'] },
  { topic: 'EULAR/ACR 2019 SLE Classification Criteria Update 2024', category: 'Guidelines', disease_area: 'Rheumatology', priority: 10, sources: ['EULAR', 'ACR'] },
  { topic: 'Lupus Nephritis: ISN/RPS Classification and KDIGO Management', category: 'Guidelines', disease_area: 'Rheumatology', priority: 10, sources: ['NEJM', 'Nature Reviews'] },
  { topic: 'ANCA-Associated Vasculitis: ACR/EULAR 2022 Classification', category: 'Guidelines', disease_area: 'Rheumatology', priority: 10, sources: ['ACR', 'EULAR'] },
  { topic: 'ASAS Classification Criteria for Axial Spondyloarthritis', category: 'Guidelines', disease_area: 'Rheumatology', priority: 9, sources: ['ASAS', 'EULAR'] },
  { topic: 'Psoriatic Arthritis: CASPAR Criteria and Treatment Algorithm', category: 'Guidelines', disease_area: 'Rheumatology', priority: 9, sources: ['ACR', 'GRAPPA'] },
  { topic: 'Gout Management: ACR Guidelines 2024', category: 'Guidelines', disease_area: 'Rheumatology', priority: 9, sources: ['ACR'] },
  
  // ============ CARDIOLOGY ============
  { topic: 'ACC/AHA Heart Failure Guidelines 2024', category: 'Guidelines', disease_area: 'Cardiology', priority: 10, sources: ['ACC', 'AHA'] },
  { topic: 'SGLT2 Inhibitors in Heart Failure: Evidence and Practice', category: 'Pharmacology', disease_area: 'Cardiology', priority: 10, sources: ['NEJM', 'Lancet'] },
  { topic: 'Atrial Fibrillation: ESC Guidelines and Anticoagulation', category: 'Guidelines', disease_area: 'Cardiology', priority: 10, sources: ['ESC'] },
  { topic: 'Acute Coronary Syndrome: STEMI and NSTEMI Management', category: 'Treatment Protocols', disease_area: 'Cardiology', priority: 10, sources: ['ACC', 'ESC'] },
  { topic: 'Hypertension Management: JNC and ESC Guidelines', category: 'Guidelines', disease_area: 'Cardiology', priority: 9, sources: ['ACC', 'ESC'] },
  { topic: 'Lipid Management and PCSK9 Inhibitors', category: 'Pharmacology', disease_area: 'Cardiology', priority: 9, sources: ['ACC', 'NEJM'] },
  { topic: 'Cardiac Amyloidosis: Diagnosis and Treatment', category: 'Clinical Assessment', disease_area: 'Cardiology', priority: 8, sources: ['JACC', 'NEJM'] },
  { topic: 'Valvular Heart Disease: TAVR and Surgical Management', category: 'Treatment Protocols', disease_area: 'Cardiology', priority: 8, sources: ['ACC', 'ESC'] },
  { topic: 'Pulmonary Arterial Hypertension: Classification and Treatment', category: 'Guidelines', disease_area: 'Cardiology', priority: 8, sources: ['ESC', 'CHEST'] },
  { topic: 'Cardiac Resynchronization and ICD Therapy', category: 'Treatment Protocols', disease_area: 'Cardiology', priority: 7, sources: ['ACC', 'ESC'] },
  
  // ============ ONCOLOGY ============
  { topic: 'Immune Checkpoint Inhibitors: Mechanisms and Management', category: 'Pharmacology', disease_area: 'Oncology', priority: 10, sources: ['ASCO', 'NEJM'] },
  { topic: 'CAR-T Cell Therapy: Current Indications and Toxicity Management', category: 'Treatment Protocols', disease_area: 'Oncology', priority: 10, sources: ['ASCO', 'NEJM'] },
  { topic: 'Non-Small Cell Lung Cancer: Molecular Testing and Targeted Therapy', category: 'Treatment Protocols', disease_area: 'Oncology', priority: 10, sources: ['ASCO', 'ESMO'] },
  { topic: 'Breast Cancer: HER2, ER/PR and Treatment Algorithm', category: 'Guidelines', disease_area: 'Oncology', priority: 10, sources: ['ASCO', 'NCCN'] },
  { topic: 'Colorectal Cancer Screening and Treatment', category: 'Guidelines', disease_area: 'Oncology', priority: 9, sources: ['ASCO', 'ACS'] },
  { topic: 'Prostate Cancer: Active Surveillance and Treatment', category: 'Treatment Protocols', disease_area: 'Oncology', priority: 9, sources: ['ASCO', 'AUA'] },
  { topic: 'Melanoma: BRAF/MEK Inhibition and Immunotherapy', category: 'Pharmacology', disease_area: 'Oncology', priority: 9, sources: ['ASCO', 'NEJM'] },
  { topic: 'Oncologic Emergencies: Recognition and Management', category: 'Treatment Protocols', disease_area: 'Oncology', priority: 8, sources: ['ASCO'] },
  { topic: 'Cancer Survivorship and Long-term Effects', category: 'Clinical Assessment', disease_area: 'Oncology', priority: 7, sources: ['ASCO', 'NCI'] },
  { topic: 'Palliative Care Integration in Oncology', category: 'Treatment Protocols', disease_area: 'Oncology', priority: 8, sources: ['ASCO'] },
  
  // ============ NEUROLOGY ============
  { topic: 'Acute Ischemic Stroke: Thrombolysis and Thrombectomy', category: 'Treatment Protocols', disease_area: 'Neurology', priority: 10, sources: ['AAN', 'NEJM'] },
  { topic: 'Multiple Sclerosis: DMTs and Disease Monitoring', category: 'Treatment Protocols', disease_area: 'Neurology', priority: 10, sources: ['AAN', 'Lancet Neurology'] },
  { topic: 'Parkinson Disease: Diagnosis and Management', category: 'Guidelines', disease_area: 'Neurology', priority: 9, sources: ['AAN', 'MDS'] },
  { topic: 'Epilepsy: Seizure Classification and AED Selection', category: 'Treatment Protocols', disease_area: 'Neurology', priority: 9, sources: ['AAN', 'ILAE'] },
  { topic: 'Alzheimer Disease: Diagnosis and Anti-Amyloid Therapy', category: 'Treatment Protocols', disease_area: 'Neurology', priority: 9, sources: ['AAN', 'NEJM'] },
  { topic: 'Migraine: Acute and Preventive Treatment', category: 'Treatment Protocols', disease_area: 'Neurology', priority: 8, sources: ['AAN', 'AHS'] },
  { topic: 'Guillain-Barré Syndrome and CIDP: Diagnosis and Treatment', category: 'Clinical Assessment', disease_area: 'Neurology', priority: 8, sources: ['AAN', 'NEJM'] },
  { topic: 'Myasthenia Gravis: Diagnosis and Treatment', category: 'Treatment Protocols', disease_area: 'Neurology', priority: 8, sources: ['AAN'] },
  { topic: 'Status Epilepticus: Emergency Management', category: 'Treatment Protocols', disease_area: 'Neurology', priority: 9, sources: ['AAN'] },
  { topic: 'Neuropathic Pain: Diagnosis and Management', category: 'Treatment Protocols', disease_area: 'Neurology', priority: 7, sources: ['AAN', 'IASP'] },
  
  // ============ INFECTIOUS DISEASE ============
  { topic: 'Antimicrobial Stewardship: Principles and Practice', category: 'Treatment Protocols', disease_area: 'Infectious Disease', priority: 10, sources: ['IDSA', 'CDC'] },
  { topic: 'Sepsis and Septic Shock: Surviving Sepsis Campaign', category: 'Guidelines', disease_area: 'Infectious Disease', priority: 10, sources: ['SCCM', 'IDSA'] },
  { topic: 'Community-Acquired Pneumonia: Diagnosis and Treatment', category: 'Guidelines', disease_area: 'Infectious Disease', priority: 9, sources: ['IDSA', 'ATS'] },
  { topic: 'HIV: ART Guidelines and Prevention (PrEP/PEP)', category: 'Treatment Protocols', disease_area: 'Infectious Disease', priority: 10, sources: ['DHHS', 'WHO'] },
  { topic: 'Hepatitis C: DAA Treatment and Cure', category: 'Treatment Protocols', disease_area: 'Infectious Disease', priority: 9, sources: ['AASLD', 'IDSA'] },
  { topic: 'MRSA and VRE: Diagnosis and Treatment', category: 'Treatment Protocols', disease_area: 'Infectious Disease', priority: 9, sources: ['IDSA'] },
  { topic: 'Clostridioides difficile Infection: Diagnosis and Treatment', category: 'Guidelines', disease_area: 'Infectious Disease', priority: 9, sources: ['IDSA', 'ACG'] },
  { topic: 'Fungal Infections in Immunocompromised Patients', category: 'Treatment Protocols', disease_area: 'Infectious Disease', priority: 8, sources: ['IDSA'] },
  { topic: 'Travel Medicine and Tropical Infections', category: 'Clinical Assessment', disease_area: 'Infectious Disease', priority: 7, sources: ['CDC', 'WHO'] },
  { topic: 'Vaccination in Adults: ACIP Recommendations', category: 'Guidelines', disease_area: 'Infectious Disease', priority: 9, sources: ['CDC', 'ACIP'] },
  
  // ============ ENDOCRINOLOGY ============
  { topic: 'Type 2 Diabetes: ADA Standards of Care 2024', category: 'Guidelines', disease_area: 'Endocrinology', priority: 10, sources: ['ADA', 'AACE'] },
  { topic: 'GLP-1 Receptor Agonists: Diabetes and Beyond', category: 'Pharmacology', disease_area: 'Endocrinology', priority: 10, sources: ['NEJM', 'Lancet'] },
  { topic: 'Thyroid Nodules and Thyroid Cancer: ATA Guidelines', category: 'Guidelines', disease_area: 'Endocrinology', priority: 9, sources: ['ATA'] },
  { topic: 'Osteoporosis: Diagnosis and Treatment', category: 'Guidelines', disease_area: 'Endocrinology', priority: 9, sources: ['AACE', 'Endocrine Society'] },
  { topic: 'Adrenal Insufficiency: Diagnosis and Glucocorticoid Replacement', category: 'Treatment Protocols', disease_area: 'Endocrinology', priority: 8, sources: ['Endocrine Society'] },
  { topic: 'Hyperthyroidism: Graves Disease Management', category: 'Treatment Protocols', disease_area: 'Endocrinology', priority: 8, sources: ['ATA'] },
  { topic: 'Pituitary Disorders: Acromegaly, Prolactinoma, Cushing', category: 'Clinical Assessment', disease_area: 'Endocrinology', priority: 8, sources: ['Endocrine Society'] },
  { topic: 'Hypogonadism: Testosterone Therapy Guidelines', category: 'Treatment Protocols', disease_area: 'Endocrinology', priority: 7, sources: ['Endocrine Society', 'AUA'] },
  { topic: 'Diabetic Ketoacidosis and HHS: Emergency Management', category: 'Treatment Protocols', disease_area: 'Endocrinology', priority: 9, sources: ['ADA'] },
  { topic: 'Continuous Glucose Monitoring and Insulin Pumps', category: 'Treatment Protocols', disease_area: 'Endocrinology', priority: 8, sources: ['ADA'] },
  
  // ============ PULMONOLOGY ============
  { topic: 'COPD: GOLD Guidelines and Treatment', category: 'Guidelines', disease_area: 'Pulmonology', priority: 10, sources: ['GOLD', 'ATS'] },
  { topic: 'Asthma: GINA Guidelines and Biologics', category: 'Guidelines', disease_area: 'Pulmonology', priority: 10, sources: ['GINA', 'ATS'] },
  { topic: 'Idiopathic Pulmonary Fibrosis: Diagnosis and Treatment', category: 'Treatment Protocols', disease_area: 'Pulmonology', priority: 9, sources: ['ATS', 'ERS'] },
  { topic: 'Pulmonary Embolism: Diagnosis and Anticoagulation', category: 'Treatment Protocols', disease_area: 'Pulmonology', priority: 10, sources: ['CHEST', 'ESC'] },
  { topic: 'Sleep Apnea: Diagnosis and CPAP Therapy', category: 'Treatment Protocols', disease_area: 'Pulmonology', priority: 8, sources: ['AASM'] },
  { topic: 'Acute Respiratory Distress Syndrome (ARDS)', category: 'Treatment Protocols', disease_area: 'Pulmonology', priority: 9, sources: ['ATS', 'SCCM'] },
  { topic: 'Lung Cancer Screening: USPSTF Guidelines', category: 'Guidelines', disease_area: 'Pulmonology', priority: 8, sources: ['USPSTF', 'ACS'] },
  { topic: 'Pleural Effusion: Diagnosis and Management', category: 'Clinical Assessment', disease_area: 'Pulmonology', priority: 7, sources: ['BTS', 'ATS'] },
  
  // ============ GASTROENTEROLOGY ============
  { topic: 'Inflammatory Bowel Disease: Crohn and Ulcerative Colitis', category: 'Treatment Protocols', disease_area: 'Gastroenterology', priority: 10, sources: ['ACG', 'AGA'] },
  { topic: 'Cirrhosis and Portal Hypertension Management', category: 'Treatment Protocols', disease_area: 'Gastroenterology', priority: 10, sources: ['AASLD', 'EASL'] },
  { topic: 'GERD and Barrett Esophagus', category: 'Guidelines', disease_area: 'Gastroenterology', priority: 8, sources: ['ACG', 'AGA'] },
  { topic: 'Hepatocellular Carcinoma: Surveillance and Treatment', category: 'Guidelines', disease_area: 'Gastroenterology', priority: 9, sources: ['AASLD', 'ASCO'] },
  { topic: 'Acute Pancreatitis: Diagnosis and Management', category: 'Treatment Protocols', disease_area: 'Gastroenterology', priority: 9, sources: ['ACG', 'AGA'] },
  { topic: 'Celiac Disease: Diagnosis and Gluten-Free Diet', category: 'Guidelines', disease_area: 'Gastroenterology', priority: 7, sources: ['ACG'] },
  { topic: 'Peptic Ulcer Disease and H. pylori Eradication', category: 'Treatment Protocols', disease_area: 'Gastroenterology', priority: 8, sources: ['ACG'] },
  { topic: 'GI Bleeding: Upper and Lower Management', category: 'Treatment Protocols', disease_area: 'Gastroenterology', priority: 9, sources: ['ACG', 'ASGE'] },
  
  // ============ NEPHROLOGY ============
  { topic: 'Chronic Kidney Disease: KDIGO Guidelines', category: 'Guidelines', disease_area: 'Nephrology', priority: 10, sources: ['KDIGO', 'ASN'] },
  { topic: 'Acute Kidney Injury: Prevention and Management', category: 'Treatment Protocols', disease_area: 'Nephrology', priority: 10, sources: ['KDIGO'] },
  { topic: 'Glomerulonephritis: Classification and Treatment', category: 'Treatment Protocols', disease_area: 'Nephrology', priority: 9, sources: ['KDIGO', 'ASN'] },
  { topic: 'Dialysis: Hemodialysis and Peritoneal Dialysis', category: 'Treatment Protocols', disease_area: 'Nephrology', priority: 9, sources: ['KDOQI', 'ASN'] },
  { topic: 'Electrolyte Disorders: Sodium and Potassium', category: 'Treatment Protocols', disease_area: 'Nephrology', priority: 9, sources: ['ASN'] },
  { topic: 'Diabetic Kidney Disease: Prevention and Treatment', category: 'Treatment Protocols', disease_area: 'Nephrology', priority: 9, sources: ['KDIGO', 'ADA'] },
  { topic: 'Kidney Transplantation: Immunosuppression', category: 'Treatment Protocols', disease_area: 'Nephrology', priority: 8, sources: ['AST', 'KDIGO'] },
  
  // ============ HEMATOLOGY ============
  { topic: 'Venous Thromboembolism: DVT and PE Treatment', category: 'Treatment Protocols', disease_area: 'Hematology', priority: 10, sources: ['ASH', 'CHEST'] },
  { topic: 'Anticoagulation: DOACs vs Warfarin', category: 'Pharmacology', disease_area: 'Hematology', priority: 10, sources: ['ASH', 'CHEST'] },
  { topic: 'Iron Deficiency Anemia: Diagnosis and Treatment', category: 'Treatment Protocols', disease_area: 'Hematology', priority: 8, sources: ['ASH'] },
  { topic: 'Myelodysplastic Syndromes: Diagnosis and Treatment', category: 'Treatment Protocols', disease_area: 'Hematology', priority: 8, sources: ['ASH', 'NCCN'] },
  { topic: 'Multiple Myeloma: Diagnosis and Novel Therapies', category: 'Treatment Protocols', disease_area: 'Hematology', priority: 9, sources: ['ASH', 'IMWG'] },
  { topic: 'Acute Leukemia: AML and ALL Treatment', category: 'Treatment Protocols', disease_area: 'Hematology', priority: 9, sources: ['ASH', 'NCCN'] },
  { topic: 'Lymphoma: Hodgkin and Non-Hodgkin Treatment', category: 'Treatment Protocols', disease_area: 'Hematology', priority: 9, sources: ['ASH', 'NCCN'] },
  { topic: 'Sickle Cell Disease: Hydroxyurea and Gene Therapy', category: 'Treatment Protocols', disease_area: 'Hematology', priority: 8, sources: ['ASH', 'NEJM'] },
  { topic: 'Thrombocytopenia: ITP and TTP', category: 'Treatment Protocols', disease_area: 'Hematology', priority: 8, sources: ['ASH'] },
  
  // ============ PSYCHIATRY ============
  { topic: 'Major Depressive Disorder: Treatment Algorithms', category: 'Treatment Protocols', disease_area: 'Psychiatry', priority: 10, sources: ['APA', 'NICE'] },
  { topic: 'Bipolar Disorder: Mood Stabilizers and Management', category: 'Treatment Protocols', disease_area: 'Psychiatry', priority: 9, sources: ['APA'] },
  { topic: 'Schizophrenia: Antipsychotics and Long-Acting Injectables', category: 'Treatment Protocols', disease_area: 'Psychiatry', priority: 9, sources: ['APA'] },
  { topic: 'Anxiety Disorders: GAD, Panic, Social Anxiety', category: 'Treatment Protocols', disease_area: 'Psychiatry', priority: 9, sources: ['APA'] },
  { topic: 'PTSD: Trauma-Focused Therapy and Pharmacology', category: 'Treatment Protocols', disease_area: 'Psychiatry', priority: 8, sources: ['APA', 'VA'] },
  { topic: 'Substance Use Disorders: MAT and Recovery', category: 'Treatment Protocols', disease_area: 'Psychiatry', priority: 9, sources: ['ASAM', 'APA'] },
  { topic: 'ADHD: Diagnosis and Stimulant Therapy', category: 'Treatment Protocols', disease_area: 'Psychiatry', priority: 8, sources: ['APA', 'AAP'] },
  { topic: 'Eating Disorders: Anorexia and Bulimia', category: 'Treatment Protocols', disease_area: 'Psychiatry', priority: 7, sources: ['APA'] },
  
  // ============ DERMATOLOGY ============
  { topic: 'Psoriasis: Biologics and Systemic Therapy', category: 'Treatment Protocols', disease_area: 'Dermatology', priority: 9, sources: ['AAD', 'NPF'] },
  { topic: 'Atopic Dermatitis: Dupilumab and JAK Inhibitors', category: 'Pharmacology', disease_area: 'Dermatology', priority: 9, sources: ['AAD', 'NEJM'] },
  { topic: 'Skin Cancer: Melanoma, BCC, SCC Screening', category: 'Guidelines', disease_area: 'Dermatology', priority: 9, sources: ['AAD', 'ASCO'] },
  { topic: 'Acne: Isotretinoin and Hormonal Therapy', category: 'Treatment Protocols', disease_area: 'Dermatology', priority: 7, sources: ['AAD'] },
  { topic: 'Drug Eruptions: Recognition and Management', category: 'Clinical Assessment', disease_area: 'Dermatology', priority: 8, sources: ['AAD'] },
  
  // ============ EMERGENCY MEDICINE ============
  { topic: 'Trauma: ATLS Principles and Management', category: 'Treatment Protocols', disease_area: 'Emergency Medicine', priority: 10, sources: ['ACEP', 'ACS'] },
  { topic: 'Cardiac Arrest: ACLS and Post-Arrest Care', category: 'Treatment Protocols', disease_area: 'Emergency Medicine', priority: 10, sources: ['AHA', 'ACEP'] },
  { topic: 'Toxicology: Common Overdoses and Antidotes', category: 'Treatment Protocols', disease_area: 'Emergency Medicine', priority: 9, sources: ['ACEP', 'AACT'] },
  { topic: 'Shock: Classification and Resuscitation', category: 'Treatment Protocols', disease_area: 'Emergency Medicine', priority: 10, sources: ['SCCM', 'ACEP'] },
  { topic: 'Acute Abdomen: Diagnosis and Surgical Emergencies', category: 'Clinical Assessment', disease_area: 'Emergency Medicine', priority: 9, sources: ['ACEP'] },
  
  // ============ PEDIATRICS ============
  { topic: 'Pediatric Fever: Evaluation and Management', category: 'Treatment Protocols', disease_area: 'Pediatrics', priority: 9, sources: ['AAP'] },
  { topic: 'Childhood Immunizations: CDC Schedule', category: 'Guidelines', disease_area: 'Pediatrics', priority: 10, sources: ['CDC', 'AAP'] },
  { topic: 'Pediatric Asthma: NAEPP Guidelines', category: 'Guidelines', disease_area: 'Pediatrics', priority: 9, sources: ['AAP', 'NAEPP'] },
  { topic: 'Neonatal Resuscitation: NRP Guidelines', category: 'Treatment Protocols', disease_area: 'Pediatrics', priority: 10, sources: ['AAP', 'AHA'] },
  { topic: 'Pediatric Obesity: Prevention and Treatment', category: 'Guidelines', disease_area: 'Pediatrics', priority: 8, sources: ['AAP'] },
  
  // ============ CRITICAL CARE ============
  { topic: 'Mechanical Ventilation: Strategies and Liberation', category: 'Treatment Protocols', disease_area: 'Critical Care', priority: 10, sources: ['SCCM', 'ATS'] },
  { topic: 'Vasopressors and Inotropes: Selection and Dosing', category: 'Pharmacology', disease_area: 'Critical Care', priority: 10, sources: ['SCCM'] },
  { topic: 'Sedation and Analgesia in ICU', category: 'Treatment Protocols', disease_area: 'Critical Care', priority: 9, sources: ['SCCM'] },
  { topic: 'ICU Nutrition: Enteral and Parenteral', category: 'Treatment Protocols', disease_area: 'Critical Care', priority: 8, sources: ['SCCM', 'ASPEN'] },
  { topic: 'ICU Delirium: Prevention and Management', category: 'Treatment Protocols', disease_area: 'Critical Care', priority: 8, sources: ['SCCM'] },
  
  // ============ GERIATRICS ============
  { topic: 'Polypharmacy and Deprescribing in Elderly', category: 'Treatment Protocols', disease_area: 'Geriatrics', priority: 9, sources: ['AGS'] },
  { topic: 'Frailty Assessment and Management', category: 'Clinical Assessment', disease_area: 'Geriatrics', priority: 8, sources: ['AGS'] },
  { topic: 'Falls Prevention in Older Adults', category: 'Guidelines', disease_area: 'Geriatrics', priority: 8, sources: ['AGS', 'CDC'] },
  { topic: 'Dementia: Non-Pharmacologic Management', category: 'Treatment Protocols', disease_area: 'Geriatrics', priority: 8, sources: ['AGS'] },
];

// Search authoritative sources using Perplexity
async function searchMedicalLiterature(topic: string, diseaseArea: string): Promise<{
  citations: string[];
  searchResults: string;
  keyFindings: string[];
}> {
  const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
  
  if (!perplexityKey) {
    console.log('⚠️ Perplexity API key not found, using synthetic search');
    return {
      citations: [],
      searchResults: '',
      keyFindings: []
    };
  }

  const searchQuery = `${topic} ${diseaseArea} clinical guidelines evidence-based medicine 2024`;
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are a medical research librarian specializing in clinical medicine across ALL specialties. Search for the latest evidence-based information from authoritative sources including:
- NEJM (New England Journal of Medicine)
- The Lancet and subspecialty journals
- JAMA Network
- BMJ
- Nature Medicine and Reviews
- Specialty society guidelines (ACC, AHA, ASCO, AAN, IDSA, ADA, etc.)
- CDC, WHO, FDA safety communications
- Cochrane Reviews and meta-analyses

Focus on ${diseaseArea}:
1. Current classification criteria and guidelines
2. High-impact clinical trials (RCTs, meta-analyses)
3. Treatment recommendations and algorithms
4. Safety data and monitoring protocols
5. Recent updates or changes in practice`
          },
          {
            role: 'user',
            content: `Search for the most current and authoritative medical literature on: "${topic}" in ${diseaseArea}. 

Provide:
1. Key findings from major trials and guidelines
2. Evidence level (Oxford OCEBM) 
3. Practical clinical recommendations
4. Recent updates or changes in practice (2023-2024)`
          }
        ],
        // Removed domain filter - sonar model searches intelligently across medical sources
        search_recency_filter: 'year',
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status);
      return { citations: [], searchResults: '', keyFindings: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];

    // Extract key findings
    const keyFindings = content
      .split('\n')
      .filter((line: string) => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
      .slice(0, 10);

    return {
      citations,
      searchResults: content,
      keyFindings
    };
  } catch (err) {
    console.error('Perplexity search error:', err);
    return { citations: [], searchResults: '', keyFindings: [] };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();

    if (action === 'seed_topics') {
      // Seed the topic queue with comprehensive topics
      const { data: existingTopics } = await supabase
        .from('research_topic_queue')
        .select('topic');
      
      const existingTopicNames = new Set(existingTopics?.map(t => t.topic) || []);
      const newTopics = SEED_TOPICS.filter(t => !existingTopicNames.has(t.topic));

      if (newTopics.length > 0) {
        const { error } = await supabase
          .from('research_topic_queue')
          .insert(newTopics.map(t => ({
            topic: t.topic,
            category: t.category,
            disease_area: t.disease_area,
            priority: t.priority,
            status: 'queued',
            source: 'system_seed'
          })));

        if (error) throw error;
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Seeded ${newTopics.length} new topics from authoritative sources`,
        total_topics: SEED_TOPICS.length,
        new_topics: newTopics.length,
        sources: ['EULAR', 'ACR', 'NEJM', 'Lancet', 'Nature', 'SBR', 'OARSI']
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'ignite') {
      // Full ignition: seed + trigger batch processing with real literature search
      console.log('🔥 IGNITION SEQUENCE STARTED - Mining authoritative medical literature');

      // Step 1: Seed topics
      const { data: existingTopics } = await supabase
        .from('research_topic_queue')
        .select('topic');
      
      const existingTopicNames = new Set(existingTopics?.map(t => t.topic) || []);
      const newTopics = SEED_TOPICS.filter(t => !existingTopicNames.has(t.topic));

      if (newTopics.length > 0) {
        await supabase.from('research_topic_queue').insert(
          newTopics.map(t => ({
            topic: t.topic,
            category: t.category,
            disease_area: t.disease_area,
            priority: t.priority,
            status: 'queued',
            source: 'system_seed'
          }))
        );
      }

      // Step 2: Get queued topics (prioritized) - Process 2 at a time for timeout safety
      const { data: queuedTopics } = await supabase
        .from('research_topic_queue')
        .select('*')
        .eq('status', 'queued')
        .order('priority', { ascending: false })
        .limit(2); // Reduced from 5 to 2 for edge function timeout safety

      if (!queuedTopics || queuedTopics.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: 'No queued topics to process',
          seeded: newTopics.length
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Step 3: Process each topic with real literature search
      const results = [];
      const geminiKey = Deno.env.get('GEMINI_API_KEY');

      for (const topic of queuedTopics) {
        try {
          // Mark as processing
          await supabase
            .from('research_topic_queue')
            .update({ status: 'processing', last_processed_at: new Date().toISOString() })
            .eq('id', topic.id);

          console.log(`📚 Researching: ${topic.topic}`);

          // Search authoritative literature first
          const literature = await searchMedicalLiterature(topic.topic, topic.disease_area || 'Rheumatology');
          
          const citationsText = literature.citations.length > 0 
            ? `\n\nAuthoritative Sources Found:\n${literature.citations.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
            : '';

          const literatureContext = literature.searchResults 
            ? `\n\nRecent Literature Evidence:\n${literature.searchResults.substring(0, 3000)}`
            : '';

          // Generate article content enhanced with real literature
          const articlePrompt = `You are a medical content expert specializing in ${topic.disease_area || 'Clinical Medicine'} writing for the UHS Health OS knowledge library. Generate a comprehensive, evidence-based article on: "${topic.topic}"

Category: ${topic.category}
Disease Area: ${topic.disease_area}
${literatureContext}
${citationsText}

CRITICAL REQUIREMENTS:
1. Write in academic medical style suitable for practicing clinicians in ${topic.disease_area || 'medicine'}
2. MUST include specific evidence from major trials and guidelines (cite by name)
3. Reference current guidelines from appropriate specialty societies
4. Include practical clinical pearls that can be applied immediately
5. Structure with clear sections: 
   - Clinical Overview
   - Key Evidence (cite specific landmark trials by name)
   - Current Guideline Recommendations  
   - Practical Application & Clinical Pearls
   - Safety Considerations
   - References
6. Be factually accurate with 2024 medical knowledge
7. Minimum 2500 words for comprehensive coverage
8. Include specific drug names, dosages, and monitoring parameters where relevant
9. Include tables or algorithms where appropriate (in markdown)

Respond in JSON format:
{
  "title": "Article title",
  "summary": "2-3 sentence summary highlighting key takeaways",
  "content": "Full markdown article content (2500+ words)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "evidence_level": "1a|1b|2a|2b|3a|3b|4|5",
  "evidence_grade": "A|B|C|D|I",
  "key_references": ["Reference 1", "Reference 2"]
}`;

          const genResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: articlePrompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 12000 }
              })
            }
          );

          const genData = await genResponse.json();
          const genText = genData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          // Parse the generated content
          let article;
          try {
            const jsonMatch = genText.match(/\{[\s\S]*\}/);
            article = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
          } catch {
            article = null;
          }

          if (!article) {
            results.push({ topic: topic.topic, status: 'generation_failed' });
            continue;
          }

          // Create pipeline entry with research sources
          const { data: pipelineEntry, error: pipelineError } = await supabase
            .from('ai_research_pipeline')
            .insert({
              user_id: '00000000-0000-0000-0000-000000000000', // System user
              topic: topic.topic,
              disease_area: topic.disease_area,
              generated_title: article.title,
              generated_summary: article.summary,
              generated_content: article.content,
              generated_tags: article.tags || [],
              evidence_level: article.evidence_level || 'pending',
              evidence_grade: article.evidence_grade || 'pending',
              status: 'ai_reviewing',
              priority: topic.priority,
              research_sources: literature.citations.length > 0 ? literature.citations : [],
              source_count: literature.citations.length
            })
            .select()
            .single();

          if (pipelineError) {
            console.error('Pipeline insert error:', pipelineError);
            results.push({ topic: topic.topic, status: 'pipeline_error' });
            continue;
          }

          // Run AI Judge evaluation with stricter criteria
          const judgePrompt = `You are a senior medical peer-reviewer evaluating rheumatology content for the UHS Health OS knowledge library.

ARTICLE TO REVIEW:
Title: ${article.title}
Disease Area: ${topic.disease_area}
Content Preview: ${article.content?.substring(0, 4000)}...

Number of Authoritative Citations: ${literature.citations.length}
${literature.citations.length > 0 ? `Citations: ${literature.citations.slice(0, 5).join(', ')}` : 'No external citations available'}

EVALUATION CRITERIA (Oxford OCEBM / GRADE):

1. EVIDENCE QUALITY (40 points)
   - Are specific trials/studies cited by name?
   - Is the evidence level appropriate for recommendations?
   - Are major society guidelines (ACR/EULAR) referenced?

2. CLINICAL ACCURACY (30 points)
   - Are drug names, dosages, and protocols correct?
   - Are contraindications and safety warnings included?
   - Is the information current (2024)?

3. PRACTICAL UTILITY (20 points)
   - Can a rheumatologist apply this immediately?
   - Are clinical pearls actionable?
   - Is the structure clear and navigable?

4. SAFETY (10 points)
   - Any potential for patient harm if followed?
   - Are appropriate warnings included?
   - Red flags for outdated or dangerous advice?

AUTO-APPROVE THRESHOLD: Score ≥85 AND Grade A/B AND Level 1-2 AND no safety concerns

Respond in JSON:
{
  "decision": "auto_approve" | "needs_human_review" | "reject",
  "confidence": 0-100,
  "evidence_level": "1a|1b|2a|2b|3a|3b|4|5",
  "grade": "A|B|C|D|I",
  "reasoning": "Detailed explanation of decision",
  "requires_human_review": true/false,
  "safety_concerns": [],
  "quality_scores": {
    "evidence": 0-40,
    "accuracy": 0-30,
    "utility": 0-20,
    "safety": 0-10
  }
}`;

          const judgeResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: judgePrompt }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
              })
            }
          );

          const judgeData = await judgeResponse.json();
          const judgeText = judgeData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          let judgment;
          try {
            const jsonMatch = judgeText.match(/\{[\s\S]*\}/);
            judgment = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
          } catch {
            judgment = { decision: 'needs_human_review', confidence: 50 };
          }

          // Stricter auto-approve criteria with literature backing
          const hasGoodEvidence = literature.citations.length >= 2 || judgment.confidence >= 90;
          const highGrade = ['A', 'B'].includes(judgment.grade);
          const goodLevel = ['1a', '1b', '2a', '2b'].includes(judgment.evidence_level);
          const noSafetyConcerns = !judgment.safety_concerns || judgment.safety_concerns.length === 0;
          
          const autoApprove = 
            judgment.decision === 'auto_approve' && 
            judgment.confidence >= 85 && 
            hasGoodEvidence &&
            highGrade &&
            goodLevel &&
            noSafetyConcerns;

          const newStatus = autoApprove ? 'approved' : 'pending_review';

          await supabase
            .from('ai_research_pipeline')
            .update({
              status: newStatus,
              ai_verification_score: judgment.confidence,
              ai_factcheck_passed: judgment.decision !== 'reject',
              judge_decision: judgment.decision,
              judge_confidence: judgment.confidence,
              judge_reasoning: judgment.reasoning,
              evidence_level: judgment.evidence_level || article.evidence_level,
              evidence_grade: judgment.grade || article.evidence_grade,
              requires_human_review: !autoApprove,
              auto_approved: autoApprove
            })
            .eq('id', pipelineEntry.id);

          // Log the review with detailed scores
          await supabase.from('ai_review_logs').insert({
            pipeline_id: pipelineEntry.id,
            reviewer_type: 'ai_judge',
            action: 'initial_review',
            decision: judgment.decision,
            confidence_score: judgment.confidence,
            evidence_level: judgment.evidence_level,
            evidence_grade: judgment.grade,
            reasoning: judgment.reasoning,
            metadata: {
              quality_scores: judgment.quality_scores,
              citations_count: literature.citations.length,
              auto_approved: autoApprove
            }
          });

          // If auto-approved, publish to education_content
          if (autoApprove) {
            const slug = article.title
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .slice(0, 100);

            // Map disease_area to specialty
            const specialtyMap: Record<string, string> = {
              'Rheumatology': 'rheumatology',
              'Cardiology': 'cardiology',
              'Oncology': 'oncology',
              'Neurology': 'neurology',
              'Endocrinology': 'endocrinology',
              'Nephrology': 'nephrology',
              'Hematology': 'hematology',
              'Infectious Disease': 'infectious-disease',
              'Pulmonology': 'pulmonology',
              'Gastroenterology': 'gastroenterology',
              'Psychiatry': 'psychiatry',
              'Dermatology': 'dermatology',
              'Emergency Medicine': 'emergency-medicine',
              'Pediatrics': 'pediatrics',
              'Critical Care': 'intensive-care',
              'Geriatrics': 'geriatrics',
            };
            
            const specialty = specialtyMap[topic.disease_area || 'Rheumatology'] || 'rheumatology';

            await supabase.from('education_content').insert({
              author_id: '00000000-0000-0000-0000-000000000000',
              title: article.title,
              summary: article.summary,
              content: article.content,
              slug: `${slug}-${Date.now()}`,
              category: topic.category,
              specialty: specialty,
              content_type: 'article',
              is_published: true,
              published_at: new Date().toISOString(),
              diagnosis_tags: article.tags || []
            });

            await supabase
              .from('ai_research_pipeline')
              .update({ status: 'published' })
              .eq('id', pipelineEntry.id);
              
            console.log(`✅ Auto-published: ${article.title}`);
          } else {
            console.log(`⏳ Pending review: ${article.title} (Score: ${judgment.confidence})`);
          }

          // Update queue status
          await supabase
            .from('research_topic_queue')
            .update({
              status: 'completed',
              articles_generated: 1
            })
            .eq('id', topic.id);

          results.push({
            topic: topic.topic,
            status: autoApprove ? 'auto_published' : 'pending_review',
            confidence: judgment.confidence,
            evidence_grade: judgment.grade,
            citations: literature.citations.length
          });

        } catch (err) {
          console.error('Error processing topic:', topic.topic, err);
          results.push({ topic: topic.topic, status: 'error', error: String(err) });
        }
      }

      // Get updated stats
      const { count: totalPublished } = await supabase
        .from('education_content')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      const { count: pendingReview } = await supabase
        .from('ai_research_pipeline')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review');

      const { count: queuedCount } = await supabase
        .from('research_topic_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'queued');

      return new Response(JSON.stringify({
        success: true,
        message: '🔥 Ignition complete! Mining authoritative medical literature from EULAR, ACR, NEJM, Lancet, Nature & SBR',
        seeded_topics: newTopics.length,
        processed: results.length,
        results,
        stats: {
          total_published: totalPublished,
          pending_review: pendingReview,
          topics_remaining: queuedCount
        },
        sources_used: AUTHORITATIVE_SOURCES
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      error: 'Invalid action. Use "seed_topics" or "ignite"'
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Ignition error:', error);
    return new Response(JSON.stringify({
      error: String(error)
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
