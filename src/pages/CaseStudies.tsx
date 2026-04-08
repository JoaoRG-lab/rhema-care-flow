import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { BookOpen, Brain, CheckCircle2, ChevronRight, ChevronLeft, Trophy, RotateCcw, Stethoscope, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface ScenarioStep {
  id: string;
  title: string;
  narrative: string;
  clinical_data?: string;
  question: string;
  options: { id: string; text: string; is_correct: boolean; feedback: string }[];
}

interface CaseStudy {
  id: string;
  title: string;
  description: string | null;
  specialty: string | null;
  difficulty: string;
  diagnosis_tags: string[];
  scenario_json: ScenarioStep[];
  is_published: boolean;
  view_count: number;
  completion_count: number;
  avg_score: number | null;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  intermediate: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

// Demo case studies seeded into UI
const DEMO_CASES: CaseStudy[] = [
  {
    id: 'demo-ra-1',
    title: 'Early Rheumatoid Arthritis in a Young Woman',
    description: 'A 32-year-old woman presents with bilateral hand joint pain and morning stiffness lasting >1 hour for the past 6 weeks.',
    specialty: 'Rheumatology',
    difficulty: 'intermediate',
    diagnosis_tags: ['Rheumatoid Arthritis'],
    is_published: true,
    view_count: 342,
    completion_count: 128,
    avg_score: 7.8,
    scenario_json: [
      {
        id: 's1',
        title: 'Initial Presentation',
        narrative: 'Maria, 32 years old, presents to your outpatient clinic complaining of bilateral pain and swelling in her MCP and PIP joints for the past 6 weeks. She reports morning stiffness lasting approximately 90 minutes daily. She has no significant past medical history.',
        clinical_data: 'Vitals: BP 120/80, HR 72, Temp 36.8°C\nExam: Bilateral MCP2-4 and PIP2-3 swelling and tenderness. Symmetric distribution. No nodules. No rash.',
        question: 'What is your most important next diagnostic step?',
        options: [
          { id: 'a', text: 'Order RF, Anti-CCP, ESR, CRP and hand X-rays', is_correct: true, feedback: 'Correct! Initial workup for suspected RA should include RF, anti-CCP antibodies, inflammatory markers (ESR/CRP), and baseline radiographs to assess for erosions per ACR/EULAR guidelines.' },
          { id: 'b', text: 'Start empiric prednisone 20mg and reassess in 4 weeks', is_correct: false, feedback: 'Starting glucocorticoids without establishing a diagnosis delays appropriate DMARD therapy. A diagnostic workup should precede treatment decisions.' },
          { id: 'c', text: 'Order ANA and start hydroxychloroquine', is_correct: false, feedback: 'While ANA can be informative, it is not the primary test for RA. Anti-CCP and RF are more specific. Starting treatment before diagnosis is premature.' },
          { id: 'd', text: 'Refer for joint aspiration of MCP joints', is_correct: false, feedback: 'Joint aspiration is useful for ruling out crystal arthropathy or infection, but in this symmetric polyarticular presentation, serological workup is the priority.' },
        ],
      },
      {
        id: 's2',
        title: 'Lab Results & Classification',
        narrative: 'Lab results return:\n- RF: 85 IU/mL (positive)\n- Anti-CCP: 120 U/mL (strongly positive)\n- ESR: 42 mm/hr\n- CRP: 2.8 mg/dL\n- Hand X-rays: Periarticular osteopenia in MCPs, no erosions yet\n- CBC, liver and renal function: Normal',
        clinical_data: 'ACR/EULAR 2010 Classification Score:\n- Joint involvement (4-10 small joints): 3 points\n- Serology (high positive RF + high positive anti-CCP): 3 points\n- Duration ≥6 weeks: 1 point\n- Acute phase reactants (abnormal ESR + CRP): 1 point\nTotal: 8/10 (≥6 = definite RA)',
        question: 'Based on these results, what is the most appropriate initial treatment strategy?',
        options: [
          { id: 'a', text: 'Start methotrexate 15mg/week + folic acid, with short course of prednisone bridge', is_correct: true, feedback: 'Correct! Per EULAR 2022 and ACR guidelines, methotrexate is the anchor DMARD for early RA. A short course of glucocorticoids as bridge therapy while MTX takes effect is standard of care. Treat-to-target approach aiming for remission or low disease activity.' },
          { id: 'b', text: 'Start with NSAIDs only and monitor for 3 months', is_correct: false, feedback: 'NSAIDs alone are inadequate for RA. Early DMARD initiation within the "window of opportunity" (first 3-6 months) significantly improves long-term outcomes and prevents joint damage.' },
          { id: 'c', text: 'Start adalimumab (anti-TNF) as monotherapy', is_correct: false, feedback: 'Biologic DMARDs are not first-line for treatment-naive RA per guidelines. csDMARDs like methotrexate should be tried first. Biologics are reserved for inadequate response to conventional therapy.' },
          { id: 'd', text: 'Start hydroxychloroquine monotherapy', is_correct: false, feedback: 'HCQ monotherapy is generally insufficient for seropositive RA with high inflammatory markers. Methotrexate is the preferred first-line DMARD for moderate-to-severe RA.' },
        ],
      },
      {
        id: 's3',
        title: 'Follow-up & Treatment Response',
        narrative: 'At 3-month follow-up on MTX 15mg/week:\n- Morning stiffness reduced to 30 minutes\n- Persistent swelling in MCP2-3 bilaterally\n- DAS28-CRP: 3.8 (moderate disease activity)\n- Target: DAS28 < 2.6 (remission) or < 3.2 (LDA)\n- MTX well tolerated, normal LFTs',
        question: 'The patient has not reached target. What is the best next step?',
        options: [
          { id: 'a', text: 'Increase MTX to 25mg/week (subcutaneous) and reassess at 3 months', is_correct: true, feedback: 'Correct! Before adding or switching therapies, optimizing MTX dose (up to 25mg/week, consider SC route for better bioavailability) is the recommended approach. If target not reached at optimized dose after 3 months, then escalate therapy.' },
          { id: 'b', text: 'Add adalimumab to current MTX dose', is_correct: false, feedback: 'Adding a biologic before optimizing MTX is premature. Guidelines recommend maximizing csDMARD dosing first. This also has cost and safety implications.' },
          { id: 'c', text: 'Switch to leflunomide monotherapy', is_correct: false, feedback: 'Switching away from MTX before optimizing it loses the benefit of the anchor drug. MTX dose escalation should be attempted first.' },
          { id: 'd', text: 'Continue current dose and add prednisone 10mg daily long-term', is_correct: false, feedback: 'Long-term glucocorticoids carry significant risks (osteoporosis, infections, metabolic effects) and should not substitute for proper DMARD optimization.' },
        ],
      },
    ],
  },
  {
    id: 'demo-lupus-1',
    title: 'Systemic Lupus Erythematosus with Renal Involvement',
    description: 'A 26-year-old woman with known SLE presents with new-onset proteinuria and rising anti-dsDNA titers.',
    specialty: 'Rheumatology',
    difficulty: 'advanced',
    diagnosis_tags: ['SLE', 'Lupus Nephritis'],
    is_published: true,
    view_count: 215,
    completion_count: 67,
    avg_score: 6.5,
    scenario_json: [
      {
        id: 's1',
        title: 'Clinical Presentation',
        narrative: 'Ana, 26 years old, diagnosed with SLE 2 years ago (malar rash, arthritis, positive ANA/anti-dsDNA). Currently on hydroxychloroquine 400mg/day. She presents with bilateral lower extremity edema, fatigue, and foamy urine for 2 weeks.',
        clinical_data: 'Labs: Creatinine 1.2 mg/dL, Albumin 2.8 g/dL, C3/C4 low, anti-dsDNA 1:640 (previously 1:160)\nUrinalysis: Protein 3+, RBC 15-20/hpf, RBC casts present\n24h urine protein: 3.2 g/day\nSLEDAI-2K: 16 (active)',
        question: 'What is the essential next step in management?',
        options: [
          { id: 'a', text: 'Renal biopsy to classify lupus nephritis', is_correct: true, feedback: 'Correct! Renal biopsy is essential to classify lupus nephritis (ISN/RPS classification). Treatment differs significantly between Class III/IV (proliferative) and Class V (membranous). The presence of active sediment and significant proteinuria mandates biopsy.' },
          { id: 'b', text: 'Start high-dose prednisone and cyclophosphamide immediately', is_correct: false, feedback: 'While urgent treatment may be needed, starting aggressive immunosuppression without histological classification can lead to over- or under-treatment. Biopsy guides therapy.' },
          { id: 'c', text: 'Increase hydroxychloroquine and add mycophenolate', is_correct: false, feedback: 'Treatment should be guided by biopsy findings. Class III/IV nephritis requires induction therapy, while Class V may have different approaches. HCQ should be continued regardless.' },
          { id: 'd', text: 'Order renal ultrasound and repeat labs in 2 weeks', is_correct: false, feedback: 'Delaying evaluation with active nephritis (RBC casts, nephrotic-range proteinuria) risks irreversible renal damage. Urgent biopsy is indicated.' },
        ],
      },
    ],
  },
];

export default function CaseStudies() {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseStudy[]>(DEMO_CASES);
  const [activeCase, setActiveCase] = useState<CaseStudy | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [responses, setResponses] = useState<{ stepId: string; answerId: string; correct: boolean }[]>([]);
  const [completed, setCompleted] = useState(false);

  // Also load from DB
  useEffect(() => {
    async function loadCases() {
      const { data } = await supabase
        .from('case_studies')
        .select('*')
        .eq('is_published', true);
      if (data && data.length > 0) {
        setCases([...DEMO_CASES, ...(data as unknown as CaseStudy[])]);
      }
    }
    loadCases();
  }, []);

  function startCase(cs: CaseStudy) {
    setActiveCase(cs);
    setCurrentStep(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setResponses([]);
    setCompleted(false);
  }

  function handleAnswer() {
    if (!selectedAnswer || !activeCase) return;
    const step = activeCase.scenario_json[currentStep];
    const option = step.options.find(o => o.id === selectedAnswer);
    setAnswered(true);
    setResponses(prev => [...prev, {
      stepId: step.id,
      answerId: selectedAnswer,
      correct: option?.is_correct || false,
    }]);
  }

  function nextStep() {
    if (!activeCase) return;
    if (currentStep < activeCase.scenario_json.length - 1) {
      setCurrentStep(prev => prev + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      setCompleted(true);
    }
  }

  function resetCase() {
    setCurrentStep(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setResponses([]);
    setCompleted(false);
  }

  // Completed view
  if (activeCase && completed) {
    const correctCount = responses.filter(r => r.correct).length;
    const total = responses.length;
    const pct = Math.round((correctCount / total) * 100);

    return (
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setActiveCase(null)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Cases
        </Button>
        <Card className="text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <Trophy className={`h-16 w-16 mx-auto ${pct >= 70 ? 'text-amber-500' : 'text-muted-foreground'}`} />
            <h2 className="text-2xl font-bold">Case Completed!</h2>
            <p className="text-lg text-muted-foreground">{activeCase.title}</p>
            <div className="text-4xl font-bold text-primary">{correctCount}/{total}</div>
            <p className="text-sm text-muted-foreground">correct answers ({pct}%)</p>
            <Progress value={pct} className="w-48 mx-auto" />
            <div className="flex justify-center gap-3 pt-4">
              <Button variant="outline" onClick={resetCase}>
                <RotateCcw className="h-4 w-4 mr-1" /> Retry
              </Button>
              <Button onClick={() => setActiveCase(null)}>
                More Cases
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active case scenario
  if (activeCase) {
    const step = activeCase.scenario_json[currentStep];
    const progress = ((currentStep + (answered ? 1 : 0)) / activeCase.scenario_json.length) * 100;
    const selectedOption = step.options.find(o => o.id === selectedAnswer);

    return (
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setActiveCase(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Exit
          </Button>
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {activeCase.scenario_json.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              {step.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed whitespace-pre-line">{step.narrative}</p>

            {step.clinical_data && (
              <div className="p-3 rounded-lg bg-muted/60 border font-mono text-xs whitespace-pre-line">
                {step.clinical_data}
              </div>
            )}

            <Separator />

            <h4 className="font-medium">{step.question}</h4>

            <RadioGroup value={selectedAnswer || ''} onValueChange={setSelectedAnswer} disabled={answered}>
              {step.options.map((opt) => {
                let optClass = '';
                if (answered) {
                  if (opt.is_correct) optClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950';
                  else if (opt.id === selectedAnswer) optClass = 'border-destructive bg-red-50 dark:bg-red-950';
                }
                return (
                  <div key={opt.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${optClass}`}>
                    <RadioGroupItem value={opt.id} id={opt.id} className="mt-0.5" />
                    <Label htmlFor={opt.id} className="text-sm cursor-pointer flex-1">
                      {opt.text}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>

            {answered && selectedOption && (
              <div className={`p-4 rounded-lg ${selectedOption.is_correct ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800' : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'} border`}>
                <p className="text-sm font-medium mb-1">
                  {selectedOption.is_correct ? '✓ Correct!' : '✗ Incorrect'}
                </p>
                <p className="text-sm text-muted-foreground">{selectedOption.feedback}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              {!answered ? (
                <Button onClick={handleAnswer} disabled={!selectedAnswer}>
                  Submit Answer <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={nextStep}>
                  {currentStep < activeCase.scenario_json.length - 1 ? 'Next Step' : 'See Results'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Case list
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          Interactive Case Studies
        </h1>
        <p className="text-muted-foreground mt-1">
          Practice clinical reasoning with real-world scenarios and immediate expert feedback
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cases.map((cs) => (
          <Card key={cs.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => startCase(cs)}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{cs.title}</CardTitle>
                <Badge className={DIFFICULTY_COLORS[cs.difficulty]}>
                  {cs.difficulty}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">{cs.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{cs.scenario_json.length} decision points</span>
                <span>•</span>
                <span>{cs.completion_count} completions</span>
                {cs.avg_score && (
                  <>
                    <span>•</span>
                    <span>Avg: {cs.avg_score.toFixed(1)}/10</span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {cs.diagnosis_tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
              <Button size="sm" className="mt-3 w-full">
                <BookOpen className="h-4 w-4 mr-1" /> Start Case
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
