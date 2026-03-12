// ─── Article & Study Types ───────────────────────────────────────────
export type CitationStyle = 'vancouver' | 'apa';

export type ArticleType =
  | 'original' | 'clinical_trial' | 'cohort' | 'case_control'
  | 'cross_sectional' | 'diagnostic_accuracy' | 'case_report'
  | 'case_series' | 'narrative_review' | 'systematic_review'
  | 'meta_analysis' | 'qualitative' | 'experimental'
  | 'brief_communication' | 'letter';

export type SectionStatus = 'empty' | 'draft' | 'revised' | 'complete';
export type WritingMode = 'basic' | 'advanced';

export interface ArticleTypeInfo {
  id: ArticleType;
  label: string;
  reportingChecklist: ReportingChecklist | null;
  abstractStructured: boolean;
  typicalWordCount: [number, number];
}

export type ReportingChecklist = 'CONSORT' | 'STROBE' | 'PRISMA' | 'CARE' | 'STARD' | 'SRQR';

export interface ManuscriptSection {
  id: string;
  title: string;
  category: 'core' | 'advanced';
  required: boolean;
  purpose: string;
  mustInclude: string[];
  mustNotInclude: string[];
  commonMistakes: string[];
  writingPrompt: string;
  sentenceStarters: string[];
  placeholder: string;
  content: string;
  status: SectionStatus;
  coauthorNote: string;
  wordCountTarget?: [number, number];
}

export interface ManuscriptState {
  title: string;
  articleType: ArticleType;
  citationStyle: CitationStyle;
  mode: WritingMode;
  sections: ManuscriptSection[];
  activeSection: string;
  journalNotes: string;
  coverLetter: string;
  lastSaved: string | null;
}

// ─── Article Type Registry ──────────────────────────────────────────
export const ARTICLE_TYPES: ArticleTypeInfo[] = [
  { id: 'original', label: 'Original Article', reportingChecklist: null, abstractStructured: true, typicalWordCount: [3000, 5000] },
  { id: 'clinical_trial', label: 'Clinical Trial', reportingChecklist: 'CONSORT', abstractStructured: true, typicalWordCount: [3500, 6000] },
  { id: 'cohort', label: 'Cohort Study', reportingChecklist: 'STROBE', abstractStructured: true, typicalWordCount: [3000, 5000] },
  { id: 'case_control', label: 'Case-Control Study', reportingChecklist: 'STROBE', abstractStructured: true, typicalWordCount: [3000, 5000] },
  { id: 'cross_sectional', label: 'Cross-Sectional Study', reportingChecklist: 'STROBE', abstractStructured: true, typicalWordCount: [3000, 4500] },
  { id: 'diagnostic_accuracy', label: 'Diagnostic Accuracy Study', reportingChecklist: 'STARD', abstractStructured: true, typicalWordCount: [3000, 5000] },
  { id: 'case_report', label: 'Case Report', reportingChecklist: 'CARE', abstractStructured: false, typicalWordCount: [1500, 3000] },
  { id: 'case_series', label: 'Case Series', reportingChecklist: 'CARE', abstractStructured: false, typicalWordCount: [2000, 4000] },
  { id: 'narrative_review', label: 'Narrative Review', reportingChecklist: null, abstractStructured: false, typicalWordCount: [4000, 8000] },
  { id: 'systematic_review', label: 'Systematic Review', reportingChecklist: 'PRISMA', abstractStructured: true, typicalWordCount: [4000, 8000] },
  { id: 'meta_analysis', label: 'Meta-Analysis', reportingChecklist: 'PRISMA', abstractStructured: true, typicalWordCount: [4000, 8000] },
  { id: 'qualitative', label: 'Qualitative Study', reportingChecklist: 'SRQR', abstractStructured: true, typicalWordCount: [4000, 7000] },
  { id: 'experimental', label: 'Experimental / Laboratory', reportingChecklist: null, abstractStructured: true, typicalWordCount: [3000, 5000] },
  { id: 'brief_communication', label: 'Brief Communication', reportingChecklist: null, abstractStructured: false, typicalWordCount: [1000, 2000] },
  { id: 'letter', label: 'Letter to the Editor', reportingChecklist: null, abstractStructured: false, typicalWordCount: [400, 1000] },
];

// ─── Reporting Checklists ───────────────────────────────────────────
export const CHECKLIST_INFO: Record<ReportingChecklist, { name: string; fullName: string; items: string[] }> = {
  CONSORT: {
    name: 'CONSORT',
    fullName: 'Consolidated Standards of Reporting Trials',
    items: [
      'Title identifies study as randomized',
      'Structured abstract with trial design, methods, results, conclusions',
      'Scientific background and rationale',
      'Specific objectives or hypotheses',
      'Eligibility criteria for participants',
      'Settings and locations of data collection',
      'Interventions described with sufficient detail',
      'Primary and secondary outcomes defined',
      'Sample size determination',
      'Randomization: sequence generation, allocation concealment',
      'Blinding (masking) described',
      'Statistical methods for primary/secondary outcomes',
      'Participant flow diagram (CONSORT flow)',
      'Baseline demographic and clinical characteristics',
      'Numbers analyzed for each group',
      'Primary outcome results with effect size and precision',
      'All harms or adverse events reported',
      'Trial registration number and registry name',
    ],
  },
  STROBE: {
    name: 'STROBE',
    fullName: 'Strengthening the Reporting of Observational Studies in Epidemiology',
    items: [
      'Title indicates study design',
      'Abstract provides informative summary',
      'Scientific background and rationale',
      'Specific objectives and hypotheses',
      'Study design presented early',
      'Setting, locations, dates described',
      'Eligibility criteria, sources, methods of selection',
      'Variables clearly defined',
      'Data sources and measurement described',
      'Bias: efforts to address potential bias',
      'Study size explained',
      'Statistical methods described',
      'Number of participants at each stage reported',
      'Descriptive and outcome data presented',
      'Main results with confidence intervals',
      'Key results summarized with reference to objectives',
      'Limitations discussed',
      'Funding sources disclosed',
    ],
  },
  PRISMA: {
    name: 'PRISMA',
    fullName: 'Preferred Reporting Items for Systematic Reviews and Meta-Analyses',
    items: [
      'Title identifies report as systematic review/meta-analysis',
      'Structured abstract',
      'Rationale and objectives stated',
      'Protocol and registration described',
      'Eligibility criteria specified',
      'Information sources listed with dates',
      'Search strategy presented for at least one database',
      'Study selection process described',
      'Data extraction process described',
      'Risk of bias assessment method described',
      'Synthesis methods described',
      'Study selection results (PRISMA flow diagram)',
      'Study characteristics presented',
      'Risk of bias within studies assessed',
      'Results of syntheses presented',
      'Certainty of evidence assessed',
      'Summary of main findings',
      'Limitations of evidence discussed',
    ],
  },
  CARE: {
    name: 'CARE',
    fullName: 'CAse REport Guidelines',
    items: [
      'Title includes "case report" and area of focus',
      'Key words for case report indexing',
      'Abstract summarizes case and learning points',
      'Background: why is this case important?',
      'Patient information: demographics, symptoms, history',
      'Clinical findings described',
      'Timeline of events presented',
      'Diagnostic assessment described',
      'Therapeutic interventions detailed',
      'Follow-up and outcomes reported',
      'Discussion: strengths, limitations, relevant literature',
      'Patient perspective included when appropriate',
      'Informed consent documented',
    ],
  },
  STARD: {
    name: 'STARD',
    fullName: 'Standards for Reporting Diagnostic Accuracy Studies',
    items: [
      'Title identifies study as diagnostic accuracy',
      'Scientific rationale for study',
      'Study objectives and hypotheses',
      'Data collection: prospective or retrospective',
      'Eligibility criteria',
      'Participant sampling described',
      'Index test described in detail',
      'Reference standard described in detail',
      'Test positivity cut-offs defined',
      'Sample size justification',
      'Analysis plan pre-specified',
      'Participant flow diagram',
      'Baseline characteristics of participants',
      'Cross-tabulation of index test and reference standard',
      'Sensitivity, specificity with confidence intervals',
      'Indeterminate results reported',
      'Adverse events of testing',
    ],
  },
  SRQR: {
    name: 'SRQR',
    fullName: 'Standards for Reporting Qualitative Research',
    items: [
      'Title concisely describes study',
      'Problem formulation and purpose',
      'Qualitative approach and paradigm',
      'Researcher characteristics and reflexivity',
      'Context of the study',
      'Sampling strategy described',
      'Ethical issues and approvals',
      'Data collection methods described',
      'Data analysis described',
      'Techniques to enhance trustworthiness',
      'Synthesis and interpretation presented',
      'Links to empirical data provided',
      'Integration with prior work',
      'Limitations described',
      'Conflicts of interest declared',
    ],
  },
};

// ─── Study-Design-Specific Methods Prompts ──────────────────────────
export const STUDY_DESIGN_METHODS: Partial<Record<ArticleType, string[]>> = {
  clinical_trial: [
    'Randomization method and sequence generation',
    'Allocation concealment mechanism',
    'Blinding: who was blinded and how',
    'Intervention details (dose, duration, delivery)',
    'Control/comparator description',
    'Primary outcome definition and measurement',
    'Secondary outcomes',
    'Adverse event monitoring',
    'Trial registration number',
    'Interim analyses and stopping rules',
  ],
  cohort: [
    'Exposure definition and ascertainment',
    'Follow-up period and loss to follow-up',
    'Outcome measurement and validation',
    'Confounding variables and control strategies',
    'Matching or propensity score methods if used',
    'Sensitivity analyses',
  ],
  case_control: [
    'Case definition and identification',
    'Control selection and source',
    'Matching criteria',
    'Exposure ascertainment',
    'Confounding control strategy',
  ],
  case_report: [
    'Patient demographics and history',
    'Presenting symptoms and timeline',
    'Diagnostic workup and reasoning',
    'Intervention or management',
    'Outcome and follow-up',
    'Patient consent and ethics',
  ],
  systematic_review: [
    'Protocol registration (e.g., PROSPERO)',
    'Search strategy with full search strings',
    'Databases searched with dates',
    'Eligibility criteria (PICOS)',
    'Study selection process (independent reviewers)',
    'Data extraction process',
    'Risk of bias assessment tool',
    'Synthesis approach (narrative, meta-analysis)',
    'Certainty of evidence assessment (e.g., GRADE)',
  ],
  meta_analysis: [
    'Protocol registration (e.g., PROSPERO)',
    'Search strategy with full search strings',
    'Databases searched with dates',
    'Eligibility criteria (PICOS)',
    'Data extraction and validation',
    'Effect measure (OR, RR, MD, SMD)',
    'Statistical model (fixed vs. random effects)',
    'Heterogeneity assessment (I², Q test)',
    'Publication bias assessment (funnel plot, Egger)',
    'Subgroup and sensitivity analyses',
  ],
  diagnostic_accuracy: [
    'Index test description and positivity threshold',
    'Reference standard description',
    'Test order and timing between tests',
    'Blinding of test interpretation',
    'Sensitivity and specificity calculation',
    'ROC curve / AUC analysis',
    'Indeterminate result handling',
  ],
  qualitative: [
    'Qualitative approach (phenomenology, grounded theory, etc.)',
    'Researcher positionality and reflexivity',
    'Participant recruitment and sampling strategy',
    'Data collection (interviews, focus groups, observation)',
    'Data saturation approach',
    'Analysis method (thematic, framework, content analysis)',
    'Trustworthiness strategies (triangulation, member checking)',
  ],
};

// ─── Citation Style Examples ────────────────────────────────────────
export const CITATION_EXAMPLES: Record<CitationStyle, { journal: string; book: string }> = {
  vancouver: {
    journal: 'Smolen JS, Aletaha D, McInnes IB. Rheumatoid arthritis. Lancet. 2016;388(10055):2023-38.',
    book: 'Firestein GS, Budd RC, Gabriel SE, et al., editors. Firestein & Kelley\'s Textbook of Rheumatology. 11th ed. Philadelphia: Elsevier; 2021.',
  },
  apa: {
    journal: 'Smolen, J. S., Aletaha, D., & McInnes, I. B. (2016). Rheumatoid arthritis. The Lancet, 388(10055), 2023–2038. https://doi.org/10.1016/S0140-6736(16)30173-8',
    book: 'Firestein, G. S., Budd, R. C., Gabriel, S. E., Koretzky, G. A., McInnes, I. B., & O\'Dell, J. R. (Eds.). (2021). Firestein & Kelley\'s textbook of rheumatology (11th ed.). Elsevier.',
  },
};

// ─── Default Sections ───────────────────────────────────────────────
export function createDefaultSections(): ManuscriptSection[] {
  return [
    {
      id: 'title', title: 'Title', category: 'core', required: true, status: 'empty', content: '', coauthorNote: '',
      wordCountTarget: undefined,
      purpose: 'A clear, specific, informative title that conveys the main finding or scope of the study.',
      mustInclude: ['Key variables or interventions', 'Study population or setting when relevant', 'Study design (e.g., randomized controlled trial, cohort study)'],
      mustNotInclude: ['Abbreviations', 'Sensational or exaggerated claims', 'Results or conclusions', 'Questions (unless stylistically appropriate)'],
      commonMistakes: ['Too vague or broad', 'Too long (aim for <20 words)', 'Using undefined abbreviations', 'Overpromising results in the title'],
      writingPrompt: 'What is the central topic, the study design, and the population you investigated?',
      sentenceStarters: ['Efficacy of [intervention] in [population]: A [design]', 'Association between [exposure] and [outcome] in [population]', '[Intervention] versus [comparator] for [condition]: A [design]'],
      placeholder: 'e.g., "Efficacy of Methotrexate Versus Leflunomide in Early Rheumatoid Arthritis: A Multicenter Randomized Controlled Trial"',
    },
    {
      id: 'running_title', title: 'Running Title', category: 'core', required: true, status: 'empty', content: '', coauthorNote: '',
      wordCountTarget: undefined,
      purpose: 'A shortened version of the title used as a header on manuscript pages (typically ≤50 characters).',
      mustInclude: ['Abbreviated but recognizable version of the main title'],
      mustNotInclude: ['Full-length title', 'Undefined abbreviations'],
      commonMistakes: ['Exceeding the character limit', 'Making it unrecognizable from the full title'],
      writingPrompt: 'Create a concise version of your title (≤50 characters).',
      sentenceStarters: ['MTX vs LEF in Early RA', 'Biomarkers in Lupus Nephritis'],
      placeholder: 'e.g., "MTX vs LEF in Early RA"',
    },
    {
      id: 'authors', title: 'Authors', category: 'core', required: true, status: 'empty', content: '', coauthorNote: '',
      purpose: 'List all individuals who meet ICMJE authorship criteria.',
      mustInclude: ['Full names of all authors', 'Academic degrees or credentials', 'ORCID identifiers when available'],
      mustNotInclude: ['Individuals who do not meet ICMJE criteria (acknowledge them instead)', 'Ghost authors or honorary authors'],
      commonMistakes: ['Omitting contributing authors', 'Including honorary authors', 'Not following journal-specific name formatting'],
      writingPrompt: 'List all authors who made substantial contributions to conception, execution, or writing.',
      sentenceStarters: [],
      placeholder: 'João da Silva, MD, PhD¹; Maria Santos, MD²; ...',
    },
    {
      id: 'affiliations', title: 'Affiliations', category: 'core', required: true, status: 'empty', content: '', coauthorNote: '',
      purpose: 'Institutional affiliations for each author, numbered to match author list.',
      mustInclude: ['Department/division', 'Institution name', 'City, state/province, country'],
      mustNotInclude: ['Personal addresses', 'Redundant or overly detailed sub-affiliations'],
      commonMistakes: ['Mismatched numbering between authors and affiliations', 'Incomplete institutional information'],
      writingPrompt: 'List each unique affiliation with corresponding superscript numbers.',
      sentenceStarters: [],
      placeholder: '¹ Department of Rheumatology, University Hospital, São Paulo, Brazil\n² Division of Clinical Research, National Institute of Health, Brasília, Brazil',
    },
    {
      id: 'corresponding', title: 'Corresponding Author', category: 'core', required: true, status: 'empty', content: '', coauthorNote: '',
      purpose: 'The author responsible for all communication regarding the manuscript.',
      mustInclude: ['Full name', 'Institutional address', 'Email address', 'ORCID (recommended)'],
      mustNotInclude: ['Personal phone numbers in some contexts', 'Multiple corresponding authors (unless journal allows)'],
      commonMistakes: ['Using a non-institutional email', 'Forgetting the postal address some journals require'],
      writingPrompt: 'Who will handle all correspondence related to this manuscript?',
      sentenceStarters: ['Correspondence to:', 'Address for correspondence:'],
      placeholder: 'Correspondence: João da Silva, MD, PhD\nDepartment of Rheumatology, University Hospital\nAv. Dr. Arnaldo, 455 — São Paulo, SP 01246-903, Brazil\nEmail: j.silva@hospital.edu | ORCID: 0000-0000-0000-0000',
    },
    {
      id: 'abstract', title: 'Abstract', category: 'core', required: true, status: 'empty', content: '', coauthorNote: '',
      wordCountTarget: [200, 350],
      purpose: 'A concise, self-contained summary of the entire study. Often the only section read by reviewers and readers.',
      mustInclude: ['Objective/purpose', 'Study design and setting', 'Key methods', 'Principal results with numerical data', 'Main conclusion'],
      mustNotInclude: ['References', 'Abbreviations (unless widely known)', 'Data not in the manuscript', 'Excessive detail'],
      commonMistakes: ['Exceeding the word limit', 'Including results not in the paper', 'Vague conclusions without data', 'Not writing it last'],
      writingPrompt: 'Summarize the objective, methods, results, and conclusion in a self-contained paragraph.',
      sentenceStarters: ['Background: ', 'Objective: To evaluate...', 'Methods: We conducted a...', 'Results: Among...', 'Conclusion: In this study...'],
      placeholder: 'Background: Rheumatoid arthritis (RA) remains a leading cause of disability...\nObjective: To compare the efficacy of methotrexate versus leflunomide...\nMethods: This multicenter, double-blind, randomized controlled trial enrolled...\nResults: At 24 weeks, ACR50 response was achieved by 67% vs. 52%...\nConclusion: Methotrexate demonstrated superior efficacy...',
    },
    {
      id: 'keywords', title: 'Keywords', category: 'core', required: true, status: 'empty', content: '', coauthorNote: '',
      purpose: 'Terms for indexing and discoverability. Use Medical Subject Headings (MeSH) when possible.',
      mustInclude: ['3–6 terms', 'Disease/condition', 'Intervention or exposure', 'Outcome or method'],
      mustNotInclude: ['Words already in the title', 'Very broad or generic terms', 'Abbreviations'],
      commonMistakes: ['Using terms identical to the title words', 'Too few or too many keywords', 'Not using MeSH-controlled vocabulary'],
      writingPrompt: 'What 3–6 MeSH terms best describe your study?',
      sentenceStarters: [],
      placeholder: 'Rheumatoid Arthritis; Methotrexate; Disease-Modifying Antirheumatic Drugs; Randomized Controlled Trial; Treatment Outcome',
    },
    {
      id: 'introduction', title: 'Introduction', category: 'core', required: true, status: 'empty', content: '', coauthorNote: '',
      wordCountTarget: [400, 800],
      purpose: 'Establish context, identify the knowledge gap, and state the study objective or hypothesis.',
      mustInclude: ['Background and significance of the topic', 'Summary of relevant prior literature', 'Clear identification of the knowledge gap', 'Explicit statement of the study objective or hypothesis'],
      mustNotInclude: ['Extensive literature review', 'Methods or results', 'Your own unpublished data', 'Conclusions'],
      commonMistakes: ['Too broad or too long', 'Not clearly stating the gap', 'No clear objective at the end', 'Citing too many or too few references'],
      writingPrompt: 'What is the problem? What do we already know? What is the gap? What is your objective?',
      sentenceStarters: ['[Disease] is a major cause of...', 'Despite advances in [field], the...', 'Current evidence suggests that...', 'However, the [specific gap] remains unclear.', 'The objective of this study was to...'],
      placeholder: 'Rheumatoid arthritis (RA) is a chronic systemic autoimmune disease characterized by persistent synovitis...\n\nCurrent treatment guidelines recommend early initiation of disease-modifying antirheumatic drugs (DMARDs)...\n\nHowever, the optimal choice between methotrexate and leflunomide as initial monotherapy remains a subject of debate...\n\nThe objective of this study was to compare the clinical efficacy and safety of methotrexate versus leflunomide in DMARD-naïve patients with early RA.',
    },
    {
      id: 'methods', title: 'Methods', category: 'core', required: true, status: 'empty', content: '', coauthorNote: '',
      wordCountTarget: [800, 2000],
      purpose: 'Describe the study design and procedures with enough detail for reproducibility.',
      mustInclude: ['Study design', 'Setting and timeframe', 'Participants and eligibility criteria', 'Variables, exposures, or interventions', 'Outcomes and their measurement', 'Statistical methods', 'Ethical approval statement'],
      mustNotInclude: ['Results or data', 'Discussion or interpretation', 'Lengthy justifications (keep for introduction)'],
      commonMistakes: ['Insufficient detail for reproducibility', 'Omitting statistical methods', 'Not stating the ethics approval', 'Mixing results into methods'],
      writingPrompt: 'Describe the design, setting, participants, procedures, variables, analysis, and ethics.',
      sentenceStarters: ['This was a [design] study conducted at...', 'Participants were eligible if they...', 'The primary outcome was defined as...', 'Statistical analyses were performed using...', 'This study was approved by...'],
      placeholder: 'Study Design and Setting\nThis was a prospective, multicenter, double-blind, randomized controlled trial conducted at 12 rheumatology centers across Brazil from January 2023 to December 2024.\n\nParticipants\nAdults aged 18–65 years meeting the 2010 ACR/EULAR classification criteria for RA were eligible...\n\nStatistical Analysis\nThe primary analysis compared ACR50 response rates between groups using the chi-square test...\n\nEthics\nThis study was approved by the institutional review board of the coordinating center (Protocol #2023-XXX)...',
    },
    {
      id: 'results', title: 'Results', category: 'core', required: true, status: 'empty', content: '', coauthorNote: '',
      wordCountTarget: [600, 1500],
      purpose: 'Present findings objectively, without interpretation. Use data, tables, and figures.',
      mustInclude: ['Participant flow and numbers analyzed', 'Baseline characteristics', 'Primary outcome results with effect sizes and confidence intervals', 'Secondary outcomes', 'Adverse events (if applicable)'],
      mustNotInclude: ['Interpretation or discussion of findings', 'Speculation on mechanisms', 'References to other studies', 'Repetition of methods'],
      commonMistakes: ['Interpreting results (save for Discussion)', 'Not reporting all pre-specified outcomes', 'Missing confidence intervals or p-values', 'Redundant text that repeats tables'],
      writingPrompt: 'What did you find? Present data objectively with numbers, tables, and figures.',
      sentenceStarters: ['A total of [N] participants were enrolled...', 'Baseline characteristics were similar between groups (Table 1).', 'The primary outcome was achieved by [X]% vs. [Y]% (p=...).', 'No significant differences were observed in...', 'Adverse events occurred in [X]% of participants...'],
      placeholder: 'Participants\nA total of 240 patients were randomized (120 per group). The CONSORT flow diagram is shown in Figure 1...\n\nBaseline Characteristics\nBaseline demographic and clinical characteristics were similar between groups (Table 1)...\n\nPrimary Outcome\nACR50 response at 24 weeks was achieved by 80 (67%) patients in the methotrexate group versus 62 (52%) in the leflunomide group (absolute difference 15%, 95% CI 3.2–26.8; p=0.021)...',
    },
    {
      id: 'discussion', title: 'Discussion', category: 'core', required: true, status: 'empty', content: '', coauthorNote: '',
      wordCountTarget: [800, 1800],
      purpose: 'Interpret findings, compare with existing evidence, discuss implications and limitations.',
      mustInclude: ['Summary of principal findings', 'Comparison with prior literature', 'Possible mechanisms or explanations', 'Clinical or scientific implications', 'Strengths and limitations', 'Suggestions for future research'],
      mustNotInclude: ['New results not presented in Results', 'Repetition of raw data from Results', 'Unsubstantiated claims', 'Excessive self-citation'],
      commonMistakes: ['Simply repeating results without interpretation', 'Overclaiming significance', 'Ignoring limitations', 'Not comparing with contradictory studies'],
      writingPrompt: 'What do the findings mean? How do they compare with the literature? What are the implications and limitations?',
      sentenceStarters: ['The principal finding of this study was that...', 'These results are consistent with [study] which found...', 'In contrast to our findings, [study] reported...', 'A possible explanation for this finding is...', 'This study has several limitations...', 'Future research should investigate...'],
      placeholder: 'The principal finding of this multicenter randomized trial was that methotrexate monotherapy achieved significantly higher ACR50 response rates compared to leflunomide in DMARD-naïve patients with early RA...\n\nStrengths and Limitations\nStrengths of this study include the multicenter design, rigorous randomization, and double-blinding...',
    },
    {
      id: 'conclusion', title: 'Conclusion', category: 'core', required: true, status: 'empty', content: '', coauthorNote: '',
      wordCountTarget: [50, 200],
      purpose: 'Provide a concise, direct answer to the study objective. State the main takeaway.',
      mustInclude: ['Direct answer to the research question', 'Main clinical or scientific message', 'Brief mention of implications when appropriate'],
      mustNotInclude: ['New data or results', 'Lengthy discussion points', 'Vague or generic statements', 'Overclaiming or extrapolation beyond data'],
      commonMistakes: ['Overclaiming or speculating', 'Too long or too vague', 'Not matching the stated objective', 'Introducing information not in the paper'],
      writingPrompt: 'What is the main takeaway? Answer the research question directly and concisely.',
      sentenceStarters: ['In this [design], [intervention] demonstrated...', 'These findings support...', 'Our results suggest that...'],
      placeholder: 'In DMARD-naïve patients with early rheumatoid arthritis, methotrexate monotherapy demonstrated superior clinical efficacy compared to leflunomide at 24 weeks, with a comparable safety profile. These findings support current guideline recommendations positioning methotrexate as the preferred first-line DMARD.',
    },
    {
      id: 'references', title: 'References', category: 'core', required: true, status: 'empty', content: '', coauthorNote: '',
      purpose: 'All cited sources, formatted according to the target journal\'s style.',
      mustInclude: ['All works cited in the manuscript', 'Consistent formatting throughout', 'DOIs or URLs when available'],
      mustNotInclude: ['Uncited references', 'Personal communications (cite in text only)', 'Unpublished or unverifiable sources'],
      commonMistakes: ['Inconsistent formatting', 'Missing references cited in text', 'Including references not cited', 'Outdated references when newer evidence exists'],
      writingPrompt: 'List all references cited in your manuscript using the selected citation style.',
      sentenceStarters: [],
      placeholder: '1. Smolen JS, Aletaha D, McInnes IB. Rheumatoid arthritis. Lancet. 2016;388(10055):2023-38.\n2. Fraenkel L, Bathon JM, England BR, et al. 2021 American College of Rheumatology guideline for the treatment of rheumatoid arthritis. Arthritis Care Res. 2021;73(7):924-39.',
    },
    // ─── Advanced / Publishing-Ready Sections ───
    {
      id: 'ethics', title: 'Ethics Approval', category: 'advanced', required: false, status: 'empty', content: '', coauthorNote: '',
      purpose: 'Formal statement of ethics/IRB approval for the study.',
      mustInclude: ['Ethics committee name', 'Approval number/protocol', 'Approval date'],
      mustNotInclude: ['Lengthy descriptions of the ethics process'],
      commonMistakes: ['Omitting the protocol number', 'Not mentioning the committee name'],
      writingPrompt: 'Provide your ethics committee approval details.',
      sentenceStarters: ['This study was approved by the...', 'Ethical approval was obtained from...'],
      placeholder: 'This study was approved by the Research Ethics Committee of the University Hospital (Protocol #2023-0456, approved March 15, 2023) and was conducted in accordance with the Declaration of Helsinki.',
    },
    {
      id: 'consent', title: 'Informed Consent', category: 'advanced', required: false, status: 'empty', content: '', coauthorNote: '',
      purpose: 'Statement confirming informed consent was obtained from participants.',
      mustInclude: ['Confirmation that consent was obtained', 'Type of consent (written, verbal)'],
      mustNotInclude: ['Patient identifiable information'],
      commonMistakes: ['Omitting this section entirely', 'Not specifying the type of consent'],
      writingPrompt: 'How was informed consent obtained?',
      sentenceStarters: ['Written informed consent was obtained from all...', 'The requirement for informed consent was waived by...'],
      placeholder: 'Written informed consent was obtained from all participants prior to enrollment. The consent process was conducted by trained study coordinators in the participant\'s primary language.',
    },
    {
      id: 'trial_registration', title: 'Trial Registration', category: 'advanced', required: false, status: 'empty', content: '', coauthorNote: '',
      purpose: 'Required for all clinical trials. Provide registry and ID number.',
      mustInclude: ['Registry name (e.g., ClinicalTrials.gov, REBEC)', 'Registration number', 'Date of registration'],
      mustNotInclude: [],
      commonMistakes: ['Registering after enrollment began', 'Not including the registration number in the abstract'],
      writingPrompt: 'Where is your trial registered?',
      sentenceStarters: ['This trial was registered at...'],
      placeholder: 'ClinicalTrials.gov Identifier: NCT04XXXXXXX (registered January 10, 2023, before enrollment of the first participant).',
    },
    {
      id: 'funding', title: 'Funding', category: 'advanced', required: false, status: 'empty', content: '', coauthorNote: '',
      purpose: 'Disclose all funding sources and their role (or lack of role) in the study.',
      mustInclude: ['All grant numbers and agencies', 'Funder role in study design/conduct/analysis', '"None" if unfunded'],
      mustNotInclude: ['Unrelated funding'],
      commonMistakes: ['Not specifying the funder\'s role', 'Omitting the grant number'],
      writingPrompt: 'Who funded this research and what was their role?',
      sentenceStarters: ['This work was supported by...', 'The funders had no role in...', 'This research received no specific grant...'],
      placeholder: 'This work was supported by FAPESP (Grant #2023/XXXXX-X) and CNPq (Grant #XXX/2023). The funders had no role in study design, data collection, analysis, interpretation, or manuscript preparation.',
    },
    {
      id: 'conflicts', title: 'Conflicts of Interest', category: 'advanced', required: false, status: 'empty', content: '', coauthorNote: '',
      purpose: 'Transparent declaration of financial and non-financial competing interests.',
      mustInclude: ['Individual disclosures per author', '"None declared" if applicable'],
      mustNotInclude: ['Vague or incomplete disclosures'],
      commonMistakes: ['Using a blanket "no conflicts" when some exist', 'Not disclosing consulting or advisory roles'],
      writingPrompt: 'Do any authors have relationships that could be perceived as conflicts?',
      sentenceStarters: ['[Author] has received...', 'All other authors declare no conflicts of interest.', 'The authors have no conflicts of interest to declare.'],
      placeholder: 'JDS has received consulting fees from Pfizer and research support from Abbvie. MCS declares speaker honoraria from Novartis. All other authors declare no conflicts of interest.',
    },
    {
      id: 'author_contributions', title: 'Author Contributions', category: 'advanced', required: false, status: 'empty', content: '', coauthorNote: '',
      purpose: 'Specify each author\'s contribution using CRediT taxonomy or equivalent.',
      mustInclude: ['Specific contributions per author', 'All ICMJE criteria addressed'],
      mustNotInclude: ['Vague statements like "all authors contributed equally"'],
      commonMistakes: ['Using vague language', 'Not matching ICMJE criteria', 'Omitting data analysis contributions'],
      writingPrompt: 'What did each author contribute to this work?',
      sentenceStarters: ['JDS: Conceptualization, Methodology, Writing — original draft.', 'MCS: Data curation, Formal analysis, Writing — review & editing.'],
      placeholder: 'JDS: Conceptualization, Methodology, Investigation, Writing — original draft. MCS: Formal analysis, Data curation, Writing — review & editing. RAP: Supervision, Funding acquisition, Writing — review & editing. All authors approved the final version of the manuscript.',
    },
    {
      id: 'data_availability', title: 'Data Availability', category: 'advanced', required: false, status: 'empty', content: '', coauthorNote: '',
      purpose: 'State whether and how the data underlying the study can be accessed.',
      mustInclude: ['Availability statement', 'Repository or access mechanism', 'Restrictions if any'],
      mustNotInclude: ['Actual data in this section'],
      commonMistakes: ['Omitting this section entirely', 'Being vague about access conditions'],
      writingPrompt: 'How can other researchers access your data?',
      sentenceStarters: ['The data that support the findings are available...', 'Anonymized data are available upon reasonable request...', 'All data generated during this study are included...'],
      placeholder: 'The anonymized dataset supporting this study is available from the corresponding author upon reasonable request, subject to institutional data governance policies.',
    },
    {
      id: 'acknowledgments', title: 'Acknowledgments', category: 'advanced', required: false, status: 'empty', content: '', coauthorNote: '',
      purpose: 'Recognize contributors who do not meet authorship criteria.',
      mustInclude: ['Names and contributions of acknowledged individuals', 'Permission obtained from named persons'],
      mustNotInclude: ['Authors (they are listed separately)', 'Funding (separate section)'],
      commonMistakes: ['Acknowledging without permission', 'Including people who qualify for authorship'],
      writingPrompt: 'Who contributed without meeting authorship criteria?',
      sentenceStarters: ['The authors thank...', 'We acknowledge the contribution of...'],
      placeholder: 'The authors thank Dr. Ana Pereira for expert statistical consultation and the nursing staff at the participating centers for their dedicated patient care during the trial.',
    },
    {
      id: 'tables', title: 'Tables', category: 'advanced', required: false, status: 'empty', content: '', coauthorNote: '',
      purpose: 'Present complex data in structured tabular format. Each table should be self-explanatory.',
      mustInclude: ['Table number and descriptive title', 'Column headers', 'Units of measurement', 'Footnotes for abbreviations', 'Statistical notations'],
      mustNotInclude: ['Data better shown in a figure', 'Excessive decimal places', 'Redundant data already in text'],
      commonMistakes: ['Tables not cited in text', 'Missing units', 'Too many tables', 'Inconsistent formatting'],
      writingPrompt: 'What data is best communicated in tabular form?',
      sentenceStarters: ['Table 1. Baseline Demographic and Clinical Characteristics', 'Table 2. Primary and Secondary Outcomes at 24 Weeks'],
      placeholder: 'Table 1. Baseline Demographic and Clinical Characteristics of Study Participants\n\n| Characteristic | MTX Group (n=120) | LEF Group (n=120) | p-value |\n|---|---|---|---|\n| Age, years, mean ± SD | 48.3 ± 12.1 | 47.8 ± 11.6 | 0.74 |\n| Female, n (%) | 96 (80) | 93 (78) | 0.62 |',
    },
    {
      id: 'figures', title: 'Figures & Legends', category: 'advanced', required: false, status: 'empty', content: '', coauthorNote: '',
      purpose: 'Visual representation of data or concepts. Each figure needs a descriptive legend.',
      mustInclude: ['Figure number', 'Descriptive title', 'Legend explaining all elements', 'Abbreviation definitions', 'Statistical annotations'],
      mustNotInclude: ['Low-resolution images', 'Copyright-protected images without permission', 'Redundant figures'],
      commonMistakes: ['Legends that don\'t explain all elements', 'Figures not cited in text', 'Poor resolution or colors'],
      writingPrompt: 'What data would benefit from visual representation?',
      sentenceStarters: ['Figure 1. CONSORT Flow Diagram', 'Figure 2. Primary Outcome by Treatment Group'],
      placeholder: 'Figure 1. CONSORT Flow Diagram of Patient Enrollment and Randomization\nLegend: Flow diagram showing screening (n=412), randomization (n=240), allocation, follow-up, and analysis populations.\n\nFigure 2. ACR50 Response Rates Over 24 Weeks\nLegend: Proportion of patients achieving ACR50 at weeks 4, 8, 12, 16, 20, and 24 in the methotrexate (solid line) and leflunomide (dashed line) groups. Error bars represent 95% confidence intervals. *p<0.05.',
    },
    {
      id: 'supplementary', title: 'Supplementary Material', category: 'advanced', required: false, status: 'empty', content: '', coauthorNote: '',
      purpose: 'Additional data or methods that support but are not essential to the main manuscript.',
      mustInclude: ['Numbered supplementary items (Table S1, Figure S1)', 'Reference in main text'],
      mustNotInclude: ['Essential results that belong in the main paper'],
      commonMistakes: ['Not referencing supplements in the main text', 'Placing critical data only in supplements'],
      writingPrompt: 'What additional material supports your manuscript?',
      sentenceStarters: ['Supplementary Table S1:', 'Supplementary Figure S1:', 'Supplementary Methods:'],
      placeholder: 'Supplementary Table S1. Extended Baseline Characteristics\nSupplementary Figure S1. Sensitivity Analysis Results\nSupplementary Methods. Detailed Description of the Randomization Algorithm',
    },
    {
      id: 'cover_letter', title: 'Cover Letter', category: 'advanced', required: false, status: 'empty', content: '', coauthorNote: '',
      purpose: 'A persuasive letter to the journal editor explaining why the manuscript merits publication.',
      mustInclude: ['Manuscript title', 'Key findings and significance', 'Why this journal is appropriate', 'Statement of originality', 'Confirmation of author approval', 'Conflict of interest disclosure'],
      mustNotInclude: ['Detailed methods or results', 'Excessive flattery', 'Irrelevant personal information'],
      commonMistakes: ['Generic letter not tailored to the journal', 'Repeating the abstract verbatim', 'Not explaining significance'],
      writingPrompt: 'Why should this journal publish your manuscript?',
      sentenceStarters: ['Dear Editor,', 'We submit the enclosed manuscript entitled...', 'We believe this work is well-suited for [Journal] because...', 'All authors have approved the final manuscript...'],
      placeholder: 'Dear Editor,\n\nWe submit the enclosed manuscript entitled "[Title]" for consideration as an Original Article in [Journal Name].\n\nThis multicenter randomized controlled trial provides new evidence on the comparative efficacy of first-line DMARDs in early rheumatoid arthritis...\n\nWe believe this work is well-suited for [Journal] given its focus on evidence-based rheumatology therapeutics...\n\nAll authors meet ICMJE criteria and have approved the final manuscript. This work has not been published elsewhere and is not under consideration by another journal.\n\nSincerely,\n[Corresponding Author]',
    },
    {
      id: 'journal_notes', title: 'Submission Notes', category: 'advanced', required: false, status: 'empty', content: '', coauthorNote: '',
      purpose: 'Internal notes about target journal, submission requirements, and editorial strategy.',
      mustInclude: ['Target journal name', 'Scope fit rationale', 'Word/figure limits', 'Submission checklist items'],
      mustNotInclude: [],
      commonMistakes: ['Not checking the journal\'s author guidelines', 'Ignoring word limits'],
      writingPrompt: 'Which journal are you targeting? What are their requirements?',
      sentenceStarters: ['Target journal:', 'Word limit:', 'Special requirements:'],
      placeholder: 'Target Journal: Annals of the Rheumatic Diseases\nImpact Factor: 27.4\nWord Limit: 4000 (excluding abstract, references, tables, figures)\nAbstract: Structured, max 250 words\nReferences: Max 40\nTables/Figures: Max 6 combined\nSubmission System: ScholarOne',
    },
  ];
}
