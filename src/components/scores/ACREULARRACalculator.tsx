 import { useState } from 'react';
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Label } from '@/components/ui/label';
 import { Calculator, Save, Info, CheckCircle, XCircle } from 'lucide-react';
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
 import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
 import { Separator } from '@/components/ui/separator';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 import { addToHistory } from '@/lib/calculators';
 import { useLoginPrompt } from '@/hooks/useLoginPrompt';
 import { LoginPromptDialog } from './LoginPromptDialog';
 
 type JointInvolvement = '0' | '1' | '2' | '3' | '5';
 type Serology = '0' | '2' | '3';
 type AcutePhase = '0' | '1';
 type Duration = '0' | '1';
 
 export function ACREULARRACalculator() {
   const { user } = useAuth();
   const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
   const [jointInvolvement, setJointInvolvement] = useState<JointInvolvement | null>(null);
   const [serology, setSerology] = useState<Serology | null>(null);
   const [acutePhase, setAcutePhase] = useState<AcutePhase | null>(null);
   const [duration, setDuration] = useState<Duration | null>(null);
   const [result, setResult] = useState<number | null>(null);
   const [isSaving, setIsSaving] = useState(false);
 
   const calculate = () => {
     if (jointInvolvement === null || serology === null || acutePhase === null || duration === null) {
       toast.error('Please complete all sections');
       return;
     }
     
     const score = Number(jointInvolvement) + Number(serology) + Number(acutePhase) + Number(duration);
     setResult(score);
     
     addToHistory({
       calculatorId: 'acr-eular-ra',
       score,
       inputs: { 
         jointInvolvement: Number(jointInvolvement), 
         serology: Number(serology), 
         acutePhase: Number(acutePhase), 
         duration: Number(duration) 
       },
     });
   };
 
   const saveScore = async () => {
     if (result === null) return;
     if (!requireAuth(() => performSave())) return;
   };
 
   const performSave = async () => {
     if (!user) return;
     setIsSaving(true);
     
     try {
       const { error } = await supabase.from('score_entries').insert({
         user_id: user.id,
         score_type: 'ACR-EULAR-RA-2010',
         data_json: { 
           jointInvolvement: Number(jointInvolvement), 
           serology: Number(serology), 
           acutePhase: Number(acutePhase), 
           duration: Number(duration) 
         } as any,
         calculated_score: result,
       });
       
       if (error) throw error;
       toast.success('ACR/EULAR criteria score saved');
     } catch (error) {
       console.error('Error saving score:', error);
       toast.error('Failed to save score');
     } finally {
       setIsSaving(false);
     }
   };
 
   const resetForm = () => {
     setJointInvolvement(null);
     setSerology(null);
     setAcutePhase(null);
     setDuration(null);
     setResult(null);
   };
 
   const meetsClassification = result !== null && result >= 6;
 
   return (
     <Card>
       <CardHeader>
         <div className="flex items-start justify-between">
           <div>
             <CardTitle className="flex items-center gap-2">
               ACR/EULAR 2010 RA Criteria
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger>
                     <Info className="h-4 w-4 text-muted-foreground" />
                   </TooltipTrigger>
                   <TooltipContent className="max-w-xs">
                     <p className="text-xs">Score ≥6 points needed for classification as definite RA. Applies to patients with at least 1 swollen joint not better explained by another disease.</p>
                   </TooltipContent>
                 </Tooltip>
               </TooltipProvider>
             </CardTitle>
             <CardDescription>Classification criteria for Rheumatoid Arthritis (≥6 points = definite RA)</CardDescription>
           </div>
         </div>
       </CardHeader>
       <CardContent>
         <div className="grid lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
             {/* A. Joint Involvement */}
             <div className="space-y-3">
               <Label className="text-base font-semibold">A. Joint Involvement</Label>
               <RadioGroup 
                 value={jointInvolvement || ''} 
                 onValueChange={(v) => setJointInvolvement(v as JointInvolvement)}
                 className="space-y-2"
               >
                 <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                   <RadioGroupItem value="0" id="joint-0" />
                   <Label htmlFor="joint-0" className="flex-1 cursor-pointer">
                     <span className="font-medium">1 large joint</span>
                     <span className="ml-2 text-muted-foreground">(0 points)</span>
                   </Label>
                 </div>
                 <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                   <RadioGroupItem value="1" id="joint-1" />
                   <Label htmlFor="joint-1" className="flex-1 cursor-pointer">
                     <span className="font-medium">2-10 large joints</span>
                     <span className="ml-2 text-muted-foreground">(1 point)</span>
                   </Label>
                 </div>
                 <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                   <RadioGroupItem value="2" id="joint-2" />
                   <Label htmlFor="joint-2" className="flex-1 cursor-pointer">
                     <span className="font-medium">1-3 small joints (± large joints)</span>
                     <span className="ml-2 text-muted-foreground">(2 points)</span>
                   </Label>
                 </div>
                 <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                   <RadioGroupItem value="3" id="joint-3" />
                   <Label htmlFor="joint-3" className="flex-1 cursor-pointer">
                     <span className="font-medium">4-10 small joints (± large joints)</span>
                     <span className="ml-2 text-muted-foreground">(3 points)</span>
                   </Label>
                 </div>
                 <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                   <RadioGroupItem value="5" id="joint-5" />
                   <Label htmlFor="joint-5" className="flex-1 cursor-pointer">
                     <span className="font-medium">&gt;10 joints (at least 1 small joint)</span>
                     <span className="ml-2 text-muted-foreground">(5 points)</span>
                   </Label>
                 </div>
               </RadioGroup>
             </div>
 
             <Separator />
 
             {/* B. Serology */}
             <div className="space-y-3">
               <Label className="text-base font-semibold">B. Serology (RF and anti-CCP)</Label>
               <RadioGroup 
                 value={serology || ''} 
                 onValueChange={(v) => setSerology(v as Serology)}
                 className="space-y-2"
               >
                 <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                   <RadioGroupItem value="0" id="sero-0" />
                   <Label htmlFor="sero-0" className="flex-1 cursor-pointer">
                     <span className="font-medium">Negative RF AND negative anti-CCP</span>
                     <span className="ml-2 text-muted-foreground">(0 points)</span>
                   </Label>
                 </div>
                 <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                   <RadioGroupItem value="2" id="sero-2" />
                   <Label htmlFor="sero-2" className="flex-1 cursor-pointer">
                     <span className="font-medium">Low-positive RF OR low-positive anti-CCP</span>
                     <span className="ml-2 text-muted-foreground">(2 points)</span>
                   </Label>
                 </div>
                 <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                   <RadioGroupItem value="3" id="sero-3" />
                   <Label htmlFor="sero-3" className="flex-1 cursor-pointer">
                     <span className="font-medium">High-positive RF OR high-positive anti-CCP</span>
                     <span className="ml-2 text-muted-foreground">(3 points)</span>
                   </Label>
                 </div>
               </RadioGroup>
               <p className="text-xs text-muted-foreground">Low-positive: ≤3× ULN; High-positive: &gt;3× ULN</p>
             </div>
 
             <Separator />
 
             {/* C. Acute-Phase Reactants */}
             <div className="space-y-3">
               <Label className="text-base font-semibold">C. Acute-Phase Reactants</Label>
               <RadioGroup 
                 value={acutePhase || ''} 
                 onValueChange={(v) => setAcutePhase(v as AcutePhase)}
                 className="space-y-2"
               >
                 <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                   <RadioGroupItem value="0" id="acute-0" />
                   <Label htmlFor="acute-0" className="flex-1 cursor-pointer">
                     <span className="font-medium">Normal CRP AND normal ESR</span>
                     <span className="ml-2 text-muted-foreground">(0 points)</span>
                   </Label>
                 </div>
                 <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                   <RadioGroupItem value="1" id="acute-1" />
                   <Label htmlFor="acute-1" className="flex-1 cursor-pointer">
                     <span className="font-medium">Abnormal CRP OR abnormal ESR</span>
                     <span className="ml-2 text-muted-foreground">(1 point)</span>
                   </Label>
                 </div>
               </RadioGroup>
             </div>
 
             <Separator />
 
             {/* D. Duration of Symptoms */}
             <div className="space-y-3">
               <Label className="text-base font-semibold">D. Duration of Symptoms</Label>
               <RadioGroup 
                 value={duration || ''} 
                 onValueChange={(v) => setDuration(v as Duration)}
                 className="space-y-2"
               >
                 <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                   <RadioGroupItem value="0" id="dur-0" />
                   <Label htmlFor="dur-0" className="flex-1 cursor-pointer">
                     <span className="font-medium">&lt;6 weeks</span>
                     <span className="ml-2 text-muted-foreground">(0 points)</span>
                   </Label>
                 </div>
                 <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                   <RadioGroupItem value="1" id="dur-1" />
                   <Label htmlFor="dur-1" className="flex-1 cursor-pointer">
                     <span className="font-medium">≥6 weeks</span>
                     <span className="ml-2 text-muted-foreground">(1 point)</span>
                   </Label>
                 </div>
               </RadioGroup>
             </div>
 
             <div className="flex gap-2 pt-4">
               <Button onClick={calculate} className="flex-1 gap-2">
                 <Calculator className="h-4 w-4" />
                 Calculate Score
               </Button>
               <Button variant="outline" onClick={resetForm}>
                 Reset
               </Button>
             </div>
           </div>
           
           {/* Result Panel */}
           <div className={`flex flex-col items-center justify-center rounded-lg p-6 ${
             result !== null 
               ? meetsClassification 
                 ? 'bg-destructive/10' 
                 : 'bg-success/10'
               : 'bg-muted/50'
           }`}>
             {result !== null ? (
               <>
                 <p className="text-sm text-muted-foreground mb-2">Total Score</p>
                 <p className="text-5xl font-bold text-foreground">{result}/10</p>
                 
                 <div className={`flex items-center gap-2 mt-4 text-lg font-medium ${
                   meetsClassification ? 'text-destructive' : 'text-success'
                 }`}>
                   {meetsClassification ? (
                     <>
                       <CheckCircle className="h-5 w-5" />
                       Definite RA
                     </>
                   ) : (
                     <>
                       <XCircle className="h-5 w-5" />
                       Does Not Meet Criteria
                     </>
                   )}
                 </div>
                 
                 <p className="text-xs text-muted-foreground mt-2 text-center">
                   {meetsClassification 
                     ? 'Score ≥6 meets classification criteria for RA'
                     : 'Score <6 does not meet criteria (may still have RA)'}
                 </p>
 
                 {/* Score breakdown */}
                 <div className="mt-4 text-xs text-muted-foreground space-y-1 w-full">
                   <div className="flex justify-between">
                     <span>Joint Involvement:</span>
                     <span>{jointInvolvement} pts</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Serology:</span>
                     <span>{serology} pts</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Acute-Phase:</span>
                     <span>{acutePhase} pts</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Duration:</span>
                     <span>{duration} pts</span>
                   </div>
                 </div>
                 
                 <Button 
                   variant="outline" 
                   size="sm" 
                   className="mt-4 gap-2" 
                   onClick={saveScore}
                   disabled={isSaving}
                 >
                   <Save className="h-4 w-4" />
                   {isSaving ? 'Saving...' : 'Save Score'}
                 </Button>
               </>
             ) : (
               <div className="text-center">
                 <p className="text-muted-foreground">Complete all sections to calculate</p>
                 <p className="text-xs text-muted-foreground mt-2">
                   Target population: Patients with ≥1 swollen joint not explained by another disease
                 </p>
               </div>
             )}
           </div>
         </div>
 
         {/* Reference */}
         <div className="mt-6 p-3 bg-muted/30 rounded-md">
           <p className="text-xs text-muted-foreground">
             <strong>Reference:</strong> Aletaha D, et al. 2010 Rheumatoid arthritis classification criteria: 
             an American College of Rheumatology/European League Against Rheumatism collaborative initiative. 
             Arthritis Rheum. 2010;62(9):2569-2581.
           </p>
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