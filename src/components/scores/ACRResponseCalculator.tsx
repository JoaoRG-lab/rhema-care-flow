 import { useState } from 'react';
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { Calculator, Save, TrendingDown, TrendingUp, CheckCircle, XCircle, Info } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 import { useLoginPrompt } from '@/hooks/useLoginPrompt';
 import { LoginPromptDialog } from './LoginPromptDialog';
 import { Separator } from '@/components/ui/separator';
 import { cn } from '@/lib/utils';
 import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
 } from '@/components/ui/tooltip';
 
 interface ACRInputs {
   // Baseline values
   tjcBaseline: number;
   sjcBaseline: number;
   patientGlobalBaseline: number;
   physicianGlobalBaseline: number;
   painBaseline: number;
   haqBaseline: number;
   acutePhaseBaseline: number;
   
   // Follow-up values
   tjcFollowup: number;
   sjcFollowup: number;
   patientGlobalFollowup: number;
   physicianGlobalFollowup: number;
   painFollowup: number;
   haqFollowup: number;
   acutePhaseFollowup: number;
 }
 
 interface ACRResult {
   acr20: boolean;
   acr50: boolean;
   acr70: boolean;
   tjcImprovement: number;
   sjcImprovement: number;
   coreImprovements: {
     patientGlobal: number;
     physicianGlobal: number;
     pain: number;
     haq: number;
     acutePhase: number;
   };
   coreCriteriaMet: {
     threshold20: number;
     threshold50: number;
     threshold70: number;
   };
 }
 
 const INITIAL_INPUTS: ACRInputs = {
   tjcBaseline: 0,
   sjcBaseline: 0,
   patientGlobalBaseline: 50,
   physicianGlobalBaseline: 50,
   painBaseline: 50,
   haqBaseline: 1.0,
   acutePhaseBaseline: 20,
   tjcFollowup: 0,
   sjcFollowup: 0,
   patientGlobalFollowup: 50,
   physicianGlobalFollowup: 50,
   painFollowup: 50,
   haqFollowup: 1.0,
   acutePhaseFollowup: 20,
 };
 
 export function ACRResponseCalculator() {
   const { user } = useAuth();
   const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
   const [inputs, setInputs] = useState<ACRInputs>(INITIAL_INPUTS);
   const [result, setResult] = useState<ACRResult | null>(null);
   const [isSaving, setIsSaving] = useState(false);
 
   const updateInput = (field: keyof ACRInputs, value: number) => {
     setInputs(prev => ({ ...prev, [field]: value }));
   };
 
   const calculateImprovement = (baseline: number, followup: number): number => {
     if (baseline === 0) return 0;
     return ((baseline - followup) / baseline) * 100;
   };
 
   const calculate = () => {
     // Calculate percentage improvements
     const tjcImprovement = calculateImprovement(inputs.tjcBaseline, inputs.tjcFollowup);
     const sjcImprovement = calculateImprovement(inputs.sjcBaseline, inputs.sjcFollowup);
     
     const coreImprovements = {
       patientGlobal: calculateImprovement(inputs.patientGlobalBaseline, inputs.patientGlobalFollowup),
       physicianGlobal: calculateImprovement(inputs.physicianGlobalBaseline, inputs.physicianGlobalFollowup),
       pain: calculateImprovement(inputs.painBaseline, inputs.painFollowup),
       haq: calculateImprovement(inputs.haqBaseline, inputs.haqFollowup),
       acutePhase: calculateImprovement(inputs.acutePhaseBaseline, inputs.acutePhaseFollowup),
     };
     
     // Count core criteria met for each threshold
     const countCoreMet = (threshold: number): number => {
       let count = 0;
       if (coreImprovements.patientGlobal >= threshold) count++;
       if (coreImprovements.physicianGlobal >= threshold) count++;
       if (coreImprovements.pain >= threshold) count++;
       if (coreImprovements.haq >= threshold) count++;
       if (coreImprovements.acutePhase >= threshold) count++;
       return count;
     };
     
     const coreCriteriaMet = {
       threshold20: countCoreMet(20),
       threshold50: countCoreMet(50),
       threshold70: countCoreMet(70),
     };
     
     // ACR response requires:
     // 1. TJC improvement ≥ threshold AND
     // 2. SJC improvement ≥ threshold AND
     // 3. At least 3 of 5 core criteria ≥ threshold
     const acr20 = tjcImprovement >= 20 && sjcImprovement >= 20 && coreCriteriaMet.threshold20 >= 3;
     const acr50 = tjcImprovement >= 50 && sjcImprovement >= 50 && coreCriteriaMet.threshold50 >= 3;
     const acr70 = tjcImprovement >= 70 && sjcImprovement >= 70 && coreCriteriaMet.threshold70 >= 3;
     
     setResult({
       acr20,
       acr50,
       acr70,
       tjcImprovement,
       sjcImprovement,
       coreImprovements,
       coreCriteriaMet,
     });
   };
 
   const saveScore = async () => {
     if (result === null) return;
     if (!requireAuth(() => performSave())) return;
   };
 
   const performSave = async () => {
     if (!user || !result) return;
     setIsSaving(true);
     try {
       // Determine highest ACR response achieved
       let acrLevel = 0;
       if (result.acr70) acrLevel = 70;
       else if (result.acr50) acrLevel = 50;
       else if (result.acr20) acrLevel = 20;
       
       const { error } = await supabase.from('score_entries').insert({
         user_id: user.id,
         score_type: 'ACR-Response',
         data_json: { 
           inputs, 
           result: {
             acr20: result.acr20,
             acr50: result.acr50,
             acr70: result.acr70,
           }
         } as any,
         calculated_score: acrLevel,
       });
       if (error) throw error;
       toast.success(`ACR Response saved (ACR${acrLevel || 'Non-responder'})`);
     } catch (error) {
       console.error('Error saving score:', error);
       toast.error('Failed to save score');
     } finally {
       setIsSaving(false);
     }
   };
 
   const getResponseBadge = (achieved: boolean, label: string) => (
     <Badge 
       variant={achieved ? 'default' : 'outline'}
       className={cn(
         'text-lg px-4 py-2',
         achieved ? 'bg-success text-success-foreground' : 'text-muted-foreground'
       )}
     >
       {achieved ? <CheckCircle className="h-4 w-4 mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
       {label}
     </Badge>
   );
 
   const ImprovementIndicator = ({ value, threshold }: { value: number; threshold: number }) => {
     const met = value >= threshold;
     return (
       <span className={cn(
         'inline-flex items-center gap-1 text-sm font-medium',
         met ? 'text-success' : 'text-muted-foreground'
       )}>
         {met ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
         {value.toFixed(0)}%
       </span>
     );
   };
 
   return (
     <Card>
       <CardHeader>
         <div className="flex items-center gap-2">
           <CardTitle>ACR Response Calculator</CardTitle>
           <TooltipProvider>
             <Tooltip>
               <TooltipTrigger>
                 <Info className="h-4 w-4 text-muted-foreground" />
               </TooltipTrigger>
               <TooltipContent className="max-w-xs">
                 <p className="text-sm">
                   ACR response requires improvement in TJC AND SJC plus ≥3 of 5 core criteria 
                   (patient global, physician global, pain, HAQ, acute phase reactant).
                 </p>
               </TooltipContent>
             </Tooltip>
           </TooltipProvider>
         </div>
         <CardDescription>
           American College of Rheumatology 20/50/70 Treatment Response Criteria
         </CardDescription>
       </CardHeader>
       <CardContent className="space-y-6">
         {/* Input Grid */}
         <div className="grid md:grid-cols-2 gap-6">
           {/* Baseline Column */}
           <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2">
               <Badge variant="outline" className="bg-muted">Baseline</Badge>
               <span className="text-xs text-muted-foreground">Pre-treatment values</span>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
               <div>
                 <Label className="text-xs">Tender Joints (0-68)</Label>
                 <Input 
                   type="number" 
                   min={0} 
                   max={68} 
                   value={inputs.tjcBaseline} 
                   onChange={(e) => updateInput('tjcBaseline', Number(e.target.value))} 
                   className="mt-1"
                 />
               </div>
               <div>
                 <Label className="text-xs">Swollen Joints (0-66)</Label>
                 <Input 
                   type="number" 
                   min={0} 
                   max={66} 
                   value={inputs.sjcBaseline} 
                   onChange={(e) => updateInput('sjcBaseline', Number(e.target.value))} 
                   className="mt-1"
                 />
               </div>
             </div>
             
             <Separator />
             <p className="text-xs text-muted-foreground font-medium">5 Core Criteria</p>
             
             <div>
               <Label className="text-xs">Patient Global Assessment (0-100 VAS)</Label>
               <Input 
                 type="number" 
                 min={0} 
                 max={100} 
                 value={inputs.patientGlobalBaseline} 
                 onChange={(e) => updateInput('patientGlobalBaseline', Number(e.target.value))} 
                 className="mt-1"
               />
             </div>
             <div>
               <Label className="text-xs">Physician Global Assessment (0-100 VAS)</Label>
               <Input 
                 type="number" 
                 min={0} 
                 max={100} 
                 value={inputs.physicianGlobalBaseline} 
                 onChange={(e) => updateInput('physicianGlobalBaseline', Number(e.target.value))} 
                 className="mt-1"
               />
             </div>
             <div>
               <Label className="text-xs">Pain Score (0-100 VAS)</Label>
               <Input 
                 type="number" 
                 min={0} 
                 max={100} 
                 value={inputs.painBaseline} 
                 onChange={(e) => updateInput('painBaseline', Number(e.target.value))} 
                 className="mt-1"
               />
             </div>
             <div>
               <Label className="text-xs">HAQ-DI (0-3)</Label>
               <Input 
                 type="number" 
                 min={0} 
                 max={3} 
                 step={0.125}
                 value={inputs.haqBaseline} 
                 onChange={(e) => updateInput('haqBaseline', Number(e.target.value))} 
                 className="mt-1"
               />
             </div>
             <div>
               <Label className="text-xs">Acute Phase Reactant (ESR or CRP)</Label>
               <Input 
                 type="number" 
                 min={0}
                 value={inputs.acutePhaseBaseline} 
                 onChange={(e) => updateInput('acutePhaseBaseline', Number(e.target.value))} 
                 className="mt-1"
               />
             </div>
           </div>
 
           {/* Follow-up Column */}
           <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2">
               <Badge variant="outline" className="bg-primary/10 border-primary">Follow-up</Badge>
               <span className="text-xs text-muted-foreground">Post-treatment values</span>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
               <div>
                 <Label className="text-xs">Tender Joints (0-68)</Label>
                 <Input 
                   type="number" 
                   min={0} 
                   max={68} 
                   value={inputs.tjcFollowup} 
                   onChange={(e) => updateInput('tjcFollowup', Number(e.target.value))} 
                   className="mt-1"
                 />
               </div>
               <div>
                 <Label className="text-xs">Swollen Joints (0-66)</Label>
                 <Input 
                   type="number" 
                   min={0} 
                   max={66} 
                   value={inputs.sjcFollowup} 
                   onChange={(e) => updateInput('sjcFollowup', Number(e.target.value))} 
                   className="mt-1"
                 />
               </div>
             </div>
             
             <Separator />
             <p className="text-xs text-muted-foreground font-medium">5 Core Criteria</p>
             
             <div>
               <Label className="text-xs">Patient Global Assessment (0-100 VAS)</Label>
               <Input 
                 type="number" 
                 min={0} 
                 max={100} 
                 value={inputs.patientGlobalFollowup} 
                 onChange={(e) => updateInput('patientGlobalFollowup', Number(e.target.value))} 
                 className="mt-1"
               />
             </div>
             <div>
               <Label className="text-xs">Physician Global Assessment (0-100 VAS)</Label>
               <Input 
                 type="number" 
                 min={0} 
                 max={100} 
                 value={inputs.physicianGlobalFollowup} 
                 onChange={(e) => updateInput('physicianGlobalFollowup', Number(e.target.value))} 
                 className="mt-1"
               />
             </div>
             <div>
               <Label className="text-xs">Pain Score (0-100 VAS)</Label>
               <Input 
                 type="number" 
                 min={0} 
                 max={100} 
                 value={inputs.painFollowup} 
                 onChange={(e) => updateInput('painFollowup', Number(e.target.value))} 
                 className="mt-1"
               />
             </div>
             <div>
               <Label className="text-xs">HAQ-DI (0-3)</Label>
               <Input 
                 type="number" 
                 min={0} 
                 max={3} 
                 step={0.125}
                 value={inputs.haqFollowup} 
                 onChange={(e) => updateInput('haqFollowup', Number(e.target.value))} 
                 className="mt-1"
               />
             </div>
             <div>
               <Label className="text-xs">Acute Phase Reactant (ESR or CRP)</Label>
               <Input 
                 type="number" 
                 min={0}
                 value={inputs.acutePhaseFollowup} 
                 onChange={(e) => updateInput('acutePhaseFollowup', Number(e.target.value))} 
                 className="mt-1"
               />
             </div>
           </div>
         </div>
 
         <Button onClick={calculate} className="w-full gap-2">
           <Calculator className="h-4 w-4" />
           Calculate ACR Response
         </Button>
 
         {/* Results */}
         {result && (
           <div className="bg-muted/50 rounded-lg p-6 space-y-6">
             {/* ACR Response Badges */}
             <div className="flex flex-wrap justify-center gap-3">
               {getResponseBadge(result.acr20, 'ACR20')}
               {getResponseBadge(result.acr50, 'ACR50')}
               {getResponseBadge(result.acr70, 'ACR70')}
             </div>
 
             {/* Improvement Summary */}
             <div className="grid md:grid-cols-2 gap-4">
               {/* Required Criteria */}
               <Card>
                 <CardHeader className="py-3 px-4">
                   <CardTitle className="text-sm">Required: Joint Improvement</CardTitle>
                 </CardHeader>
                 <CardContent className="px-4 pb-4 space-y-2">
                   <div className="flex justify-between items-center">
                     <span className="text-sm">Tender Joint Count</span>
                     <div className="flex gap-2">
                       <ImprovementIndicator value={result.tjcImprovement} threshold={20} />
                       <span className="text-xs text-muted-foreground">
                         ({inputs.tjcBaseline} → {inputs.tjcFollowup})
                       </span>
                     </div>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm">Swollen Joint Count</span>
                     <div className="flex gap-2">
                       <ImprovementIndicator value={result.sjcImprovement} threshold={20} />
                       <span className="text-xs text-muted-foreground">
                         ({inputs.sjcBaseline} → {inputs.sjcFollowup})
                       </span>
                     </div>
                   </div>
                 </CardContent>
               </Card>
 
               {/* Core Criteria */}
               <Card>
                 <CardHeader className="py-3 px-4">
                   <CardTitle className="text-sm">Core Criteria (need ≥3 of 5)</CardTitle>
                 </CardHeader>
                 <CardContent className="px-4 pb-4 space-y-2">
                   <div className="flex justify-between items-center">
                     <span className="text-sm">Patient Global</span>
                     <ImprovementIndicator value={result.coreImprovements.patientGlobal} threshold={20} />
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm">Physician Global</span>
                     <ImprovementIndicator value={result.coreImprovements.physicianGlobal} threshold={20} />
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm">Pain Score</span>
                     <ImprovementIndicator value={result.coreImprovements.pain} threshold={20} />
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm">HAQ-DI</span>
                     <ImprovementIndicator value={result.coreImprovements.haq} threshold={20} />
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm">Acute Phase</span>
                     <ImprovementIndicator value={result.coreImprovements.acutePhase} threshold={20} />
                   </div>
                   <Separator className="my-2" />
                   <div className="text-xs text-muted-foreground">
                     Met at 20%: {result.coreCriteriaMet.threshold20}/5 | 
                     50%: {result.coreCriteriaMet.threshold50}/5 | 
                     70%: {result.coreCriteriaMet.threshold70}/5
                   </div>
                 </CardContent>
               </Card>
             </div>
 
             {/* Clinical Interpretation */}
             <div className="text-center">
               <p className={cn(
                 'text-lg font-semibold',
                 result.acr70 ? 'text-success' : 
                 result.acr50 ? 'text-primary' : 
                 result.acr20 ? 'text-info' : 
                 'text-muted-foreground'
               )}>
                 {result.acr70 ? 'Excellent Response (ACR70)' :
                  result.acr50 ? 'Good Response (ACR50)' :
                  result.acr20 ? 'Moderate Response (ACR20)' :
                  'No ACR Response (Non-responder)'}
               </p>
               <p className="text-xs text-muted-foreground mt-1">
                 Based on the ACR improvement criteria for rheumatoid arthritis
               </p>
             </div>
 
             <div className="flex justify-center">
               <Button variant="outline" size="sm" className="gap-2" onClick={saveScore} disabled={isSaving}>
                 <Save className="h-4 w-4" />
                 {isSaving ? 'Saving...' : 'Save Response'}
               </Button>
             </div>
           </div>
         )}
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