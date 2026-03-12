import { useState, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Download,
  Eye,
  GripVertical,
  CheckCircle2,
  Circle,
  Lightbulb,
  BookOpen,
  Layers,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArticleSection {
  id: string;
  number: number;
  title: string;
  titlePt: string;
  purpose: string;
  tips: string[];
  guidePrompt: string;
  placeholder: string;
  content: string;
  required: boolean;
  category: 'core' | 'optional';
}

const defaultSections: ArticleSection[] = [
  {
    id: 'title',
    number: 1,
    title: 'Title',
    titlePt: 'Título',
    purpose: 'Clear, specific, and informative. Should convey the main finding or scope of the study.',
    tips: [
      'Keep it under 15 words when possible',
      'Include key variables and study design',
      'Avoid abbreviations and jargon',
      'Be specific about the population studied',
    ],
    guidePrompt: 'What is the main topic, population, and design of your study?',
    placeholder: 'e.g., "Efficacy of Methotrexate vs. Leflunomide in Early Rheumatoid Arthritis: A Randomized Controlled Trial"',
    content: '',
    required: true,
    category: 'core',
  },
  {
    id: 'authors',
    number: 2,
    title: 'Authors & Affiliations',
    titlePt: 'Autores e Afiliações',
    purpose: 'List all contributing authors with their institutional affiliations and the corresponding author\'s contact.',
    tips: [
      'Follow ICMJE authorship criteria',
      'Include ORCID identifiers when available',
      'Mark the corresponding author clearly',
      'List affiliations with department, institution, city, country',
    ],
    guidePrompt: 'Who contributed to this work? List names, departments, institutions, and contact info.',
    placeholder: 'e.g., João Silva¹*, Maria Santos², ...\n¹Department of Rheumatology, University Hospital, São Paulo, Brazil\n*Corresponding author: j.silva@hospital.edu',
    content: '',
    required: true,
    category: 'core',
  },
  {
    id: 'abstract',
    number: 3,
    title: 'Abstract',
    titlePt: 'Resumo',
    purpose: 'A concise summary of the objective, methods, main results, and conclusion (150–300 words).',
    tips: [
      'Write it last, after completing all sections',
      'Use structured format: Background, Methods, Results, Conclusion',
      'Include key numerical results',
      'Avoid references and abbreviations',
    ],
    guidePrompt: 'Summarize: What was the objective? What methods were used? What were the key findings? What is the conclusion?',
    placeholder: 'Background: Rheumatoid arthritis (RA) affects approximately 1% of the global population...\nMethods: We conducted a multicenter randomized controlled trial...\nResults: At 24 weeks, the methotrexate group showed...\nConclusion: Methotrexate demonstrated superior...',
    content: '',
    required: true,
    category: 'core',
  },
  {
    id: 'keywords',
    number: 4,
    title: 'Keywords',
    titlePt: 'Palavras-chave',
    purpose: 'Three to six relevant terms for indexing and discoverability. Use MeSH terms when possible.',
    tips: [
      'Use 3–6 terms',
      'Prefer MeSH (Medical Subject Headings) vocabulary',
      'Avoid words already in the title',
      'Include disease, intervention, and outcome terms',
    ],
    guidePrompt: 'What are the 3–6 key terms that best describe your study?',
    placeholder: 'e.g., Rheumatoid Arthritis; Methotrexate; Disease-Modifying Antirheumatic Drugs; Randomized Controlled Trial; DAS28',
    content: '',
    required: true,
    category: 'core',
  },
  {
    id: 'introduction',
    number: 5,
    title: 'Introduction',
    titlePt: 'Introdução',
    purpose: 'Contextualize the topic, identify the knowledge gap, and state the study objective or hypothesis.',
    tips: [
      'Move from broad context to specific problem',
      'Cite key prior studies (literature review)',
      'Clearly state the knowledge gap',
      'End with a clear objective/hypothesis statement',
    ],
    guidePrompt: 'What is the problem? What is the gap in the literature? What is your objective or hypothesis?',
    placeholder: 'Rheumatoid arthritis (RA) is a chronic systemic autoimmune disease characterized by persistent synovitis and progressive joint destruction [1]. Despite advances in treatment, the optimal first-line DMARD strategy remains debated...\n\nThe objective of this study was to compare...',
    content: '',
    required: true,
    category: 'core',
  },
  {
    id: 'methods',
    number: 6,
    title: 'Methods',
    titlePt: 'Métodos',
    purpose: 'Describe the study design, participants, procedures, variables, instruments, statistical analysis, and ethical aspects.',
    tips: [
      'Specify study design (RCT, cohort, case-control, etc.)',
      'Detail inclusion/exclusion criteria',
      'Describe interventions and comparators',
      'State primary and secondary outcomes',
      'Include statistical methods and software used',
      'Mention ethics committee approval and informed consent',
    ],
    guidePrompt: 'What study design? Who were the participants? What procedures were followed? What variables and instruments were used? What statistical analysis was performed? Were ethical standards met?',
    placeholder: 'Study Design: This was a prospective, multicenter, double-blind, randomized controlled trial...\n\nParticipants: Adults aged 18–65 years meeting 2010 ACR/EULAR criteria for RA...\n\nInclusion criteria: Disease duration <2 years, DMARD-naïve...\n\nStatistical Analysis: Continuous variables were compared using...\n\nEthics: The study was approved by the institutional review board (Protocol #2024-xxx)...',
    content: '',
    required: true,
    category: 'core',
  },
  {
    id: 'results',
    number: 7,
    title: 'Results',
    titlePt: 'Resultados',
    purpose: 'Present findings objectively with data, tables, and figures. No interpretation here.',
    tips: [
      'Present results in logical order matching methods',
      'Use tables for complex numerical data',
      'Include confidence intervals and p-values',
      'Describe figures and tables in the text',
      'Report all pre-specified outcomes',
    ],
    guidePrompt: 'What was found objectively? Present the data without interpretation.',
    placeholder: 'A total of 240 patients were randomized (120 per group). Baseline characteristics were similar between groups (Table 1).\n\nThe primary endpoint (ACR50 at week 24) was achieved by 67% in the methotrexate group vs. 52% in the leflunomide group (p=0.02, 95% CI: 3.2–26.8)...',
    content: '',
    required: true,
    category: 'core',
  },
  {
    id: 'discussion',
    number: 8,
    title: 'Discussion',
    titlePt: 'Discussão',
    purpose: 'Interpret findings, compare with existing literature, discuss implications and limitations.',
    tips: [
      'Start with a summary of key findings',
      'Compare results with prior studies',
      'Discuss clinical/practical implications',
      'Address strengths and limitations honestly',
      'Suggest future research directions',
    ],
    guidePrompt: 'What do the findings mean? How do they compare with the literature? What are the implications and limitations?',
    placeholder: 'Our findings demonstrate that methotrexate achieved significantly higher ACR50 response rates compared to leflunomide in DMARD-naïve early RA patients. This is consistent with the landmark study by...\n\nLimitations: The relatively short follow-up period of 24 weeks...',
    content: '',
    required: true,
    category: 'core',
  },
  {
    id: 'conclusion',
    number: 9,
    title: 'Conclusion',
    titlePt: 'Conclusão',
    purpose: 'Provide the final answer to the study objective and the main takeaway message.',
    tips: [
      'Directly answer the study objective',
      'Be concise (1–2 paragraphs)',
      'Avoid introducing new data',
      'State clinical relevance',
      'May suggest implications for practice or policy',
    ],
    guidePrompt: 'What is the main takeaway? What is the final answer to your research question?',
    placeholder: 'In DMARD-naïve patients with early rheumatoid arthritis, methotrexate monotherapy demonstrated superior efficacy compared to leflunomide at 24 weeks, with a comparable safety profile. These findings support current guideline recommendations for methotrexate as the preferred first-line DMARD.',
    content: '',
    required: true,
    category: 'core',
  },
  {
    id: 'references',
    number: 10,
    title: 'References',
    titlePt: 'Referências',
    purpose: 'List all cited sources in the format required by the target journal.',
    tips: [
      'Use a reference manager (Zotero, Mendeley, EndNote)',
      'Follow the target journal\'s citation style (Vancouver, APA, etc.)',
      'Include DOIs when available',
      'Verify all references are cited in the text',
      'Prefer recent, peer-reviewed sources',
    ],
    guidePrompt: 'List all references cited in your manuscript in the required format.',
    placeholder: '1. Smolen JS, et al. Rheumatoid arthritis. Lancet. 2016;388:2023-2038. doi:10.1016/...\n2. Fraenkel L, et al. 2021 ACR Guideline for Treatment of RA. Arthritis Care Res. 2021;73:924-939.\n3. ...',
    content: '',
    required: true,
    category: 'core',
  },
  // Optional sections
  {
    id: 'acknowledgments',
    number: 11,
    title: 'Acknowledgments',
    titlePt: 'Agradecimentos',
    purpose: 'Recognize individuals or organizations that contributed but do not meet authorship criteria.',
    tips: [
      'Thank research assistants, statisticians, etc.',
      'Acknowledge institutional support',
      'Get permission from those named',
    ],
    guidePrompt: 'Who contributed to this work without qualifying for authorship?',
    placeholder: 'The authors thank Dr. Ana Pereira for statistical consultation and the nursing staff at...',
    content: '',
    required: false,
    category: 'optional',
  },
  {
    id: 'funding',
    number: 12,
    title: 'Funding',
    titlePt: 'Financiamento',
    purpose: 'Disclose all funding sources and their role in the study.',
    tips: [
      'List all grants with numbers',
      'Specify the funder\'s role (or lack thereof) in study design',
      'Include fellowship and scholarship support',
    ],
    guidePrompt: 'Who funded this research? What was their role in the study?',
    placeholder: 'This work was supported by FAPESP (Grant #2024/xxxxx-x) and CNPq (Grant #xxx/2024). The funders had no role in study design, data collection, analysis, or manuscript preparation.',
    content: '',
    required: false,
    category: 'optional',
  },
  {
    id: 'conflicts',
    number: 13,
    title: 'Conflicts of Interest',
    titlePt: 'Conflitos de Interesse',
    purpose: 'Declare any financial or non-financial conflicts that could influence the work.',
    tips: [
      'Be transparent about all potential conflicts',
      'Include consulting, speaking fees, grants from industry',
      'State "none declared" if applicable',
    ],
    guidePrompt: 'Do any authors have financial or personal relationships that could bias this work?',
    placeholder: 'JS has received consulting fees from Pfizer and Abbvie. MS declares no conflicts of interest.',
    content: '',
    required: false,
    category: 'optional',
  },
  {
    id: 'supplementary',
    number: 14,
    title: 'Supplementary Material',
    titlePt: 'Material Suplementar',
    purpose: 'Additional data, tables, figures, or methods that support but are not essential to the main text.',
    tips: [
      'Reference each supplement in the main text',
      'Number as Table S1, Figure S1, etc.',
      'Include extended methods or raw data tables',
    ],
    guidePrompt: 'What additional data supports your findings that doesn\'t fit in the main manuscript?',
    placeholder: 'Supplementary Table S1: Baseline demographic characteristics (extended)\nSupplementary Figure S1: CONSORT flow diagram\nSupplementary Methods: Detailed description of the MRI scoring protocol...',
    content: '',
    required: false,
    category: 'optional',
  },
];

function SectionCard({
  section,
  isOpen,
  onToggle,
  onContentChange,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  section: ArticleSection;
  isOpen: boolean;
  onToggle: () => void;
  onContentChange: (value: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const hasContent = section.content.trim().length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div
        className={cn(
          'border rounded-lg transition-all duration-200',
          isOpen ? 'border-blue-300 shadow-sm bg-white' : 'border-border/50 bg-card hover:border-border',
          hasContent && !isOpen && 'border-l-4 border-l-emerald-500'
        )}
      >
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 p-4 text-left group">
            <div className="flex items-center gap-2 shrink-0">
              <GripVertical className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              {hasContent ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/30" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">{String(section.number).padStart(2, '0')}</span>
                <h3 className="font-semibold text-foreground text-sm">{section.title}</h3>
                <span className="text-xs text-muted-foreground italic hidden sm:inline">({section.titlePt})</span>
                {!section.required && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">Optional</Badge>
                )}
              </div>
              {!isOpen && section.content && (
                <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-md">
                  {section.content.substring(0, 80)}...
                </p>
              )}
            </div>
            {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            <Separator />

            {/* Purpose */}
            <div className="bg-blue-50/80 border border-blue-100 rounded-md p-3">
              <div className="flex items-start gap-2">
                <BookOpen className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-blue-800 mb-1">Purpose</p>
                  <p className="text-xs text-blue-700 leading-relaxed">{section.purpose}</p>
                </div>
              </div>
            </div>

            {/* Guide prompt */}
            <div className="bg-amber-50/80 border border-amber-100 rounded-md p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-800 mb-1">Guiding Question</p>
                  <p className="text-xs text-amber-700 italic leading-relaxed">{section.guidePrompt}</p>
                </div>
              </div>
            </div>

            {/* Writing tips */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Writing Tips</p>
              <ul className="space-y-0.5">
                {section.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-blue-400 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Textarea */}
            <div>
              <Textarea
                value={section.content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder={section.placeholder}
                className="min-h-[160px] text-sm font-serif leading-relaxed resize-y bg-background border-border/60 focus:border-blue-300 focus:ring-blue-200/50"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">
                  {section.content.length} characters · ~{Math.ceil(section.content.split(/\s+/).filter(Boolean).length)} words
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={onMoveUp}
                    disabled={!canMoveUp}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={onMoveDown}
                    disabled={!canMoveDown}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default function ArticleBuilder() {
  const [sections, setSections] = useState<ArticleSection[]>(defaultSections);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['title']));
  const [advancedMode, setAdvancedMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const visibleSections = useMemo(
    () => (advancedMode ? sections : sections.filter((s) => s.category === 'core')),
    [sections, advancedMode]
  );

  const progress = useMemo(() => {
    const relevant = visibleSections;
    const filled = relevant.filter((s) => s.content.trim().length > 20).length;
    return Math.round((filled / relevant.length) * 100);
  }, [visibleSections]);

  const totalWords = useMemo(
    () => sections.reduce((sum, s) => sum + s.content.split(/\s+/).filter(Boolean).length, 0),
    [sections]
  );

  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const updateContent = useCallback((id: string, value: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, content: value } : s)));
  }, []);

  const moveSection = useCallback((index: number, direction: -1 | 1) => {
    setSections((prev) => {
      const next = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((s, i) => ({ ...s, number: i + 1 }));
    });
  }, []);

  const exportMarkdown = useCallback(() => {
    const md = visibleSections
      .filter((s) => s.content.trim())
      .map((s) => `## ${s.number}. ${s.title}\n\n${s.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'article-draft.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [visibleSections]);

  if (showPreview) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-white">
          <div className="max-w-3xl mx-auto py-12 px-6">
            {/* Preview header */}
            <div className="flex items-center justify-between mb-8 print:hidden">
              <h2 className="text-sm font-medium text-muted-foreground">Article Preview</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Print / PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                  Back to Editor
                </Button>
              </div>
            </div>

            {/* Rendered article */}
            <article className="font-serif space-y-6 text-gray-900 leading-[1.8]">
              {visibleSections.filter((s) => s.content.trim()).map((s) => (
                <section key={s.id}>
                  {s.id === 'title' ? (
                    <h1 className="text-2xl font-bold text-center mb-2 leading-tight">{s.content}</h1>
                  ) : s.id === 'authors' ? (
                    <p className="text-center text-sm text-gray-600 whitespace-pre-line mb-6">{s.content}</p>
                  ) : s.id === 'keywords' ? (
                    <div className="mb-6">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Keywords</p>
                      <p className="text-sm italic text-gray-700">{s.content}</p>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-base font-bold uppercase tracking-wide text-gray-800 mb-2 border-b border-gray-200 pb-1">
                        {s.title}
                      </h2>
                      <div className="text-sm whitespace-pre-line text-gray-700">{s.content}</div>
                    </div>
                  )}
                </section>
              ))}
            </article>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar outline */}
          <aside className="hidden lg:block w-64 border-r border-border/40 bg-white/80 backdrop-blur-sm sticky top-0 h-screen overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h2 className="font-semibold text-sm text-foreground">Article Outline</h2>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Completion</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground">{totalWords} words total</p>
                </div>

                <Separator />

                {/* Nav items */}
                <nav className="space-y-0.5">
                  {visibleSections.map((s) => {
                    const hasContent = s.content.trim().length > 0;
                    const isActive = openSections.has(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          setOpenSections(new Set([s.id]));
                          document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className={cn(
                          'w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
                          isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-muted-foreground hover:bg-muted/50'
                        )}
                      >
                        {hasContent ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                        )}
                        <span className="font-mono text-[10px] text-muted-foreground/60 w-4">{String(s.number).padStart(2, '0')}</span>
                        <span className="truncate">{s.title}</span>
                      </button>
                    );
                  })}
                </nav>

                <Separator />

                {/* Mode toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Advanced</span>
                  </div>
                  <Switch checked={advancedMode} onCheckedChange={setAdvancedMode} />
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setShowPreview(true)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview Article
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={exportMarkdown}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Export Markdown
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </aside>

          {/* Main content */}
          <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 lg:px-8 lg:py-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground tracking-tight">Scientific Article Builder</h1>
                  <p className="text-xs text-muted-foreground">IMRaD-compliant academic paper structure</p>
                </div>
              </div>

              {/* Mobile controls */}
              <div className="flex items-center gap-3 mt-4 lg:hidden">
                <div className="flex-1">
                  <Progress value={progress} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground mt-1">{progress}% complete · {totalWords} words</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Adv</span>
                  <Switch checked={advancedMode} onCheckedChange={setAdvancedMode} />
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowPreview(true)}>
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportMarkdown}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Core sections */}
            <div className="space-y-2 mb-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Core Sections
              </h2>
              {visibleSections
                .filter((s) => s.category === 'core')
                .map((s, idx, arr) => (
                  <div key={s.id} id={`section-${s.id}`}>
                    <SectionCard
                      section={s}
                      isOpen={openSections.has(s.id)}
                      onToggle={() => toggleSection(s.id)}
                      onContentChange={(v) => updateContent(s.id, v)}
                      onMoveUp={() => moveSection(sections.findIndex((x) => x.id === s.id), -1)}
                      onMoveDown={() => moveSection(sections.findIndex((x) => x.id === s.id), 1)}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < arr.length - 1}
                    />
                  </div>
                ))}
            </div>

            {/* Optional sections */}
            {advancedMode && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Optional Sections
                </h2>
                {visibleSections
                  .filter((s) => s.category === 'optional')
                  .map((s, idx, arr) => (
                    <div key={s.id} id={`section-${s.id}`}>
                      <SectionCard
                        section={s}
                        isOpen={openSections.has(s.id)}
                        onToggle={() => toggleSection(s.id)}
                        onContentChange={(v) => updateContent(s.id, v)}
                        onMoveUp={() => moveSection(sections.findIndex((x) => x.id === s.id), -1)}
                        onMoveDown={() => moveSection(sections.findIndex((x) => x.id === s.id), 1)}
                        canMoveUp={idx > 0}
                        canMoveDown={idx < arr.length - 1}
                      />
                    </div>
                  ))}
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center text-[10px] text-muted-foreground/60 space-y-1">
              <p>Based on the IMRaD model (Introduction, Methods, Results, and Discussion)</p>
              <p>Following ICMJE Recommendations for the Conduct, Reporting, Editing, and Publication of Scholarly Work</p>
            </div>
          </main>
        </div>
      </div>
    </AppLayout>
  );
}
