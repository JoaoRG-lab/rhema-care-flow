 import { useState } from 'react';
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Calculator, Save, Info, ArrowLeftRight } from 'lucide-react';
 import { AlertTriangle } from 'lucide-react';
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 import { addToHistory } from '@/lib/calculators';
 import { cn } from '@/lib/utils';
 import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
 import { useLoginPrompt } from '@/hooks/useLoginPrompt';
 import { LoginPromptDialog } from './LoginPromptDialog';
 
 interface ScoreResult {
   score: number;
   interpretation: {
     text: string;
     color: string;
     bg: string;
   };
 }
 
 export function DAS28ComparisonCalculator() {
   const { user } = useAuth();
   const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
   const [tjc, setTjc] = useState<number>(0);
   const [sjc, setSjc] = useState<number>(0);
   const [esr, setEsr] = useState<number>(1);
   const [crp, setCrp] = useState<number>(0);
   const [globalHealth, setGlobalHealth] = useState<number>(0);
   const [esrResult, setEsrResult] = useState<ScoreResult | null>(null);
   const [crpResult, setCrpResult] = useState<ScoreResult | null>(null);
   const [isSaving, setIsSaving] = useState<'esr' | 'crp' | null>(null);
 
   const getInterpretation = (score: number) => {
     if (score < 2.6) return { text: 'Remission', color: 'text-success', bg: 'bg-success/10' };
     if (score < 3.2) return { text: 'Low Disease Activity', color: 'text-info', bg: 'bg-info/10' };
     if (score <= 5.1) return { text: 'Moderate Disease Activity', color: 'text-warning', bg: 'bg-warning/10' };
     return { text: 'High Disease Activity', color: 'text-destructive', bg: 'bg-destructive/10' };
   };
 
   const calculateBoth = () => {
     // DAS28-ESR formula: 0.56×√TJC + 0.28×√SJC + 0.70×ln(ESR) + 0.014×GH
     const esrScore = 0.56 * Math.sqrt(tjc) + 
                      0.28 * Math.sqrt(sjc) + 
                      0.70 * Math.log(esr) + 
                      0.014 * globalHealth;
     const roundedEsr = Math.round(esrScore * 100) / 100;
     
     // DAS28-CRP formula: 0.56×√TJC + 0.28×√SJC + 0.36×ln(CRP+1) + 0.014×GH + 0.96
     const crpScore = 0.56 * Math.sqrt(tjc) + 
                      0.28 * Math.sqrt(sjc) + 
                      0.36 * Math.log(crp + 1) + 
                      0.014 * globalHealth + 
                      0.96;
     const roundedCrp = Math.round(crpScore * 100) / 100;
     
     setEsrResult({ score: roundedEsr, interpretation: getInterpretation(roundedEsr) });
     setCrpResult({ score: roundedCrp, interpretation: getInterpretation(roundedCrp) });
     
     // Add both to history
     addToHistory({
       calculatorId: 'das28-esr',
       score: roundedEsr,
       inputs: { tjc, sjc, esr, globalHealth },
     });
     addToHistory({
       calculatorId: 'das28-crp',
       score: roundedCrp,
       inputs: { tjc, sjc, crp, globalHealth },
     });
   };
 
   const saveScore = async (type: 'esr' | 'crp') => {
     const result = type === 'esr' ? esrResult : crpResult;
     if (!result) return;
     
     if (!requireAuth(() => performSave(type))) return;
   };
 
   const performSave = async (type: 'esr' | 'crp') => {
     if (!user) return;
     const result = type === 'esr' ? esrResult : crpResult;
     if (!result) return;
     
     setIsSaving(type);
     
     try {
       const { error } = await supabase.from('score_entries').insert({
         user_id: user.id,
         score_type: type === 'esr' ? 'DAS28-ESR' : 'DAS28-CRP',
         data_json: type === 'esr' 
           ? { tjc, sjc, esr, globalHealth } as any
           : { tjc, sjc, crp, globalHealth } as any,
         calculated_score: result.score,
       });
       
       if (error) throw error;
       toast.success(`DAS28-${type.toUpperCase()} score saved`);
     } catch (error) {
       console.error('Error saving score:', error);
       toast.error('Failed to save score');
     } finally {
       setIsSaving(null);
     }
   };
 
   const saveBoth = async () => {
     if (!requireAuth(async () => {
       await performSave('esr');
       await performSave('crp');
     })) return;
   };
 
   const resetForm = () => {
     setTjc(0);
     setSjc(0);
     setEsr(1);
     setCrp(0);
     setGlobalHealth(0);
     setEsrResult(null);
     setCrpResult(null);
   };
 
   const scoreDifference = esrResult && crpResult 
     ? Math.abs(esrResult.score - crpResult.score).toFixed(2)
     : null;
 
   const hasCategoryDiscrepancy = esrResult && crpResult && 
     esrResult.interpretation.text !== crpResult.interpretation.text;
 
   const getDiscrepancyMessage = () => {
     if (!esrResult || !crpResult || !hasCategoryDiscrepancy) return null;
     
     const esrCategory = esrResult.interpretation.text;
     const crpCategory = crpResult.interpretation.text;
     
     // Determine which is higher
     const esrHigher = esrResult.score > crpResult.score;
     
     return {
       title: `Category Discrepancy: ${esrCategory} vs ${crpCategory}`,
       message: esrHigher
         ? 'ESR suggests higher disease activity than CRP. Consider ESR may be elevated by non-RA factors (age, anemia, infection) or CRP may be suppressed.'
         : 'CRP suggests higher disease activity than ESR. CRP responds faster to inflammation changes; ESR may lag behind acute flares.',
       clinicalNote: 'When scores disagree, correlate with clinical examination and consider repeating labs. DAS28-CRP may be more sensitive to rapid changes.',
     };
   };
 
   const discrepancyInfo = getDiscrepancyMessage();
 
   return (
     <Card>
       <CardHeader>
         <div className="flex items-start justify-between">
           <div>
             <CardTitle className="flex items-center gap-2">
               <ArrowLeftRight className="h-5 w-5 text-primary" />
               DAS28-ESR vs DAS28-CRP Comparison
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger>
                     <Info className="h-4 w-4 text-muted-foreground" />
                   </TooltipTrigger>
                   <TooltipContent className="max-w-sm">
                     <p className="font-medium mb-2">Compare both formulas:</p>
                     <div className="space-y-1 text-xs font-mono">
                       <p><strong>ESR:</strong> 0.56×√TJC + 0.28×√SJC + 0.70×ln(ESR) + 0.014×GH</p>
                       <p><strong>CRP:</strong> 0.56×√TJC + 0.28×√SJC + 0.36×ln(CRP+1) + 0.014×GH + 0.96</p>
                     </div>
                   </TooltipContent>
                 </Tooltip>
               </TooltipProvider>
             </CardTitle>
             <CardDescription>
               Compare Disease Activity Scores using both ESR and CRP markers side by side
             </CardDescription>
           </div>
         </div>
       </CardHeader>
       <CardContent>
         <div className="space-y-6">
           {/* Shared Inputs */}
           <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
             <div>
               <Label htmlFor="tjc-compare">TJC28</Label>
               <Input 
                 id="tjc-compare"
                 type="number" 
                 min={0} 
                 max={28} 
                 value={tjc} 
                 onChange={(e) => setTjc(Math.min(28, Math.max(0, Number(e.target.value))))} 
                 className="mt-1" 
               />
               <p className="text-xs text-muted-foreground mt-1">Tender joints</p>
             </div>
             <div>
               <Label htmlFor="sjc-compare">SJC28</Label>
               <Input 
                 id="sjc-compare"
                 type="number" 
                 min={0} 
                 max={28} 
                 value={sjc} 
                 onChange={(e) => setSjc(Math.min(28, Math.max(0, Number(e.target.value))))} 
                 className="mt-1" 
               />
               <p className="text-xs text-muted-foreground mt-1">Swollen joints</p>
             </div>
             <div>
               <Label htmlFor="esr-compare">ESR (mm/h)</Label>
               <Input 
                 id="esr-compare"
                 type="number" 
                 min={1}
                 value={esr} 
                 onChange={(e) => setEsr(Math.max(1, Number(e.target.value)))} 
                 className="mt-1" 
               />
               <p className="text-xs text-muted-foreground mt-1">For ESR formula</p>
             </div>
             <div>
               <Label htmlFor="crp-compare">CRP (mg/L)</Label>
               <Input 
                 id="crp-compare"
                 type="number" 
                 min={0}
                 step={0.1}
                 value={crp} 
                 onChange={(e) => setCrp(Math.max(0, Number(e.target.value)))} 
                 className="mt-1" 
               />
               <p className="text-xs text-muted-foreground mt-1">For CRP formula</p>
             </div>
             <div>
               <Label htmlFor="gh-compare">Global Health</Label>
               <Input 
                 id="gh-compare"
                 type="number" 
                 min={0} 
                 max={100} 
                 value={globalHealth} 
                 onChange={(e) => setGlobalHealth(Math.min(100, Math.max(0, Number(e.target.value))))} 
                 className="mt-1" 
               />
               <p className="text-xs text-muted-foreground mt-1">VAS 0-100</p>
             </div>
           </div>
 
           {/* Action Buttons */}
           <div className="flex gap-2">
             <Button onClick={calculateBoth} className="flex-1 gap-2">
               <Calculator className="h-4 w-4" />
               Calculate Both
             </Button>
             <Button variant="outline" onClick={resetForm}>
               Reset
             </Button>
           </div>
 
           {/* Side by Side Results */}
           {(esrResult || crpResult) && (
             <div className={cn(
               "grid md:grid-cols-2 gap-4",
               hasCategoryDiscrepancy && "ring-2 ring-warning/50 ring-offset-2 ring-offset-background rounded-lg"
             )}>
               {/* DAS28-ESR Result */}
               <div className={cn(
                 "flex flex-col items-center justify-center rounded-lg p-6 border-2",
                 esrResult ? esrResult.interpretation.bg : 'bg-muted/50',
                 esrResult ? 'border-primary/20' : 'border-transparent'
               )}>
                 <p className="text-sm font-medium text-muted-foreground mb-1">DAS28-ESR</p>
                 {esrResult ? (
                   <>
                     <p className="text-4xl font-bold text-foreground">{esrResult.score}</p>
                     <p className={cn("text-sm font-medium mt-1", esrResult.interpretation.color)}>
                       {esrResult.interpretation.text}
                     </p>
                     <Button 
                       variant="outline" 
                       size="sm" 
                       className="mt-3 gap-1.5" 
                       onClick={() => saveScore('esr')}
                       disabled={isSaving === 'esr'}
                     >
                       <Save className="h-3.5 w-3.5" />
                       {isSaving === 'esr' ? 'Saving...' : 'Save'}
                     </Button>
                   </>
                 ) : (
                   <p className="text-muted-foreground text-sm">—</p>
                 )}
               </div>
 
               {/* DAS28-CRP Result */}
               <div className={cn(
                 "flex flex-col items-center justify-center rounded-lg p-6 border-2",
                 crpResult ? crpResult.interpretation.bg : 'bg-muted/50',
                 crpResult ? 'border-primary/20' : 'border-transparent'
               )}>
                 <p className="text-sm font-medium text-muted-foreground mb-1">DAS28-CRP</p>
                 {crpResult ? (
                   <>
                     <p className="text-4xl font-bold text-foreground">{crpResult.score}</p>
                     <p className={cn("text-sm font-medium mt-1", crpResult.interpretation.color)}>
                       {crpResult.interpretation.text}
                     </p>
                     <Button 
                       variant="outline" 
                       size="sm" 
                       className="mt-3 gap-1.5" 
                       onClick={() => saveScore('crp')}
                       disabled={isSaving === 'crp'}
                     >
                       <Save className="h-3.5 w-3.5" />
                       {isSaving === 'crp' ? 'Saving...' : 'Save'}
                     </Button>
                   </>
                 ) : (
                   <p className="text-muted-foreground text-sm">—</p>
                 )}
               </div>
             </div>
           )}
 
           {/* Score Difference & Interpretation Guide */}
           {esrResult && crpResult && (
             <div className="space-y-3">
               {/* Category Discrepancy Alert */}
               {hasCategoryDiscrepancy && discrepancyInfo && (
                 <Alert variant="destructive" className="border-warning bg-warning/10 text-foreground [&>svg]:text-warning">
                   <AlertTriangle className="h-4 w-4" />
                   <AlertTitle className="text-warning-foreground font-semibold">
                     {discrepancyInfo.title}
                   </AlertTitle>
                   <AlertDescription className="text-sm space-y-2">
                     <p>{discrepancyInfo.message}</p>
                     <p className="text-xs text-muted-foreground italic">
                       {discrepancyInfo.clinicalNote}
                     </p>
                   </AlertDescription>
                 </Alert>
               )}
 
               {/* Score Difference */}
               <div className="flex items-center justify-center gap-3 p-3 bg-muted/50 rounded-lg">
                 <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                 <span className="text-sm">
                   Score Difference: <strong>{scoreDifference}</strong>
                 </span>
                 {hasCategoryDiscrepancy && (
                   <span className="text-xs text-warning font-medium px-2 py-0.5 bg-warning/20 rounded-full border border-warning/30">
                     Different categories
                   </span>
                 )}
               </div>
 
               {/* Interpretation Guide */}
               <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                 <span><span className="inline-block w-2 h-2 rounded-full bg-success mr-1" />Remission: &lt;2.6</span>
                 <span><span className="inline-block w-2 h-2 rounded-full bg-info mr-1" />Low: 2.6-3.2</span>
                 <span><span className="inline-block w-2 h-2 rounded-full bg-warning mr-1" />Moderate: 3.2-5.1</span>
                 <span><span className="inline-block w-2 h-2 rounded-full bg-destructive mr-1" />High: &gt;5.1</span>
               </div>
 
               {/* Save Both */}
               <div className="flex justify-center">
                 <Button variant="outline" className="gap-2" onClick={saveBoth} disabled={!!isSaving}>
                   <Save className="h-4 w-4" />
                   Save Both Scores
                 </Button>
               </div>
             </div>
           )}
         </div>
       </CardContent>
       <LoginPromptDialog
         open={showLoginDialog}
         onOpenChange={setShowLoginDialog}
         onLogin={goToLogin}
         onSignup={goToSignup}
       />
     </Card>
   );
 }