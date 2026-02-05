 import { useState } from 'react';
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Calculator, Save, Info, CheckCircle, XCircle } from 'lucide-react';
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 import { addToHistory } from '@/lib/calculators';
 import { cn } from '@/lib/utils';
 import { useLoginPrompt } from '@/hooks/useLoginPrompt';
 import { LoginPromptDialog } from './LoginPromptDialog';
 
 interface MDAInputs {
   tjc: number;
   sjc: number;
   pasi: number;
   painVas: number;
   pgaVas: number;
   haq: number;
   tenderEntheseal: number;
 }
 
 interface CriterionStatus {
   met: boolean;
   label: string;
   description: string;
 }
 
 export function MDACalculator() {
   const { user } = useAuth();
   const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
   const [inputs, setInputs] = useState<MDAInputs>({
     tjc: 0,
     sjc: 0,
     pasi: 0,
     painVas: 0,
     pgaVas: 0,
     haq: 0,
     tenderEntheseal: 0,
   });
   const [calculated, setCalculated] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
 
   const getCriteriaStatus = (): CriterionStatus[] => {
     return [
       {
         met: inputs.tjc <= 1,
         label: 'Tender Joint Count ≤1',
         description: `TJC68: ${inputs.tjc}`,
       },
       {
         met: inputs.sjc <= 1,
         label: 'Swollen Joint Count ≤1',
         description: `SJC66: ${inputs.sjc}`,
       },
       {
         met: inputs.pasi <= 1,
         label: 'PASI ≤1 or BSA ≤3%',
         description: `PASI: ${inputs.pasi}`,
       },
       {
         met: inputs.painVas <= 15,
         label: 'Patient Pain VAS ≤15',
         description: `Pain: ${inputs.painVas}mm`,
       },
       {
         met: inputs.pgaVas <= 20,
         label: 'Patient Global VAS ≤20',
         description: `PGA: ${inputs.pgaVas}mm`,
       },
       {
         met: inputs.haq <= 0.5,
         label: 'HAQ ≤0.5',
         description: `HAQ: ${inputs.haq}`,
       },
       {
         met: inputs.tenderEntheseal <= 1,
         label: 'Tender Entheseal Points ≤1',
         description: `Entheseal: ${inputs.tenderEntheseal}`,
       },
     ];
   };
 
   const criteriaStatus = getCriteriaStatus();
   const criteriaMet = criteriaStatus.filter(c => c.met).length;
   const isMDA = criteriaMet >= 5;
 
   const calculate = () => {
     setCalculated(true);
     
     addToHistory({
       calculatorId: 'mda',
       score: criteriaMet,
       inputs: inputs as unknown as Record<string, number>,
     });
   };
 
   const saveScore = async () => {
     if (!requireAuth(() => performSave())) return;
   };
 
   const performSave = async () => {
     if (!user) return;
     setIsSaving(true);
     
     try {
       const { error } = await supabase.from('score_entries').insert({
         user_id: user.id,
         score_type: 'MDA',
         data_json: { ...inputs, criteriaMet, isMDA } as any,
         calculated_score: criteriaMet,
       });
       
       if (error) throw error;
       toast.success('MDA assessment saved');
     } catch (error) {
       console.error('Error saving score:', error);
       toast.error('Failed to save assessment');
     } finally {
       setIsSaving(false);
     }
   };
 
   const resetForm = () => {
     setInputs({
       tjc: 0,
       sjc: 0,
       pasi: 0,
       painVas: 0,
       pgaVas: 0,
       haq: 0,
       tenderEntheseal: 0,
     });
     setCalculated(false);
   };
 
   const updateInput = (field: keyof MDAInputs, value: number, max: number) => {
     setInputs(prev => ({
       ...prev,
       [field]: Math.min(max, Math.max(0, value)),
     }));
   };
 
   return (
     <Card>
       <CardHeader>
         <div className="flex items-start justify-between">
           <div>
             <CardTitle className="flex items-center gap-2">
               Minimal Disease Activity (MDA)
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger>
                     <Info className="h-4 w-4 text-muted-foreground" />
                   </TooltipTrigger>
                   <TooltipContent className="max-w-xs">
                     <p className="font-medium mb-1">Criteria:</p>
                     <p className="text-xs">Patient must satisfy 5 of 7 criteria to achieve MDA. Coates et al. 2010</p>
                   </TooltipContent>
                 </Tooltip>
               </TooltipProvider>
             </CardTitle>
             <CardDescription>
               Treatment target for Psoriatic Arthritis (5 of 7 criteria required)
             </CardDescription>
           </div>
         </div>
       </CardHeader>
       <CardContent>
         <div className="grid lg:grid-cols-2 gap-6">
           {/* Input Section */}
           <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="mda-tjc">Tender Joint Count (TJC68)</Label>
                 <Input 
                   id="mda-tjc"
                   type="number" 
                   min={0} 
                   max={68} 
                   value={inputs.tjc} 
                   onChange={(e) => updateInput('tjc', Number(e.target.value), 68)} 
                   className="mt-1" 
                 />
                 <p className="text-xs text-muted-foreground mt-1">Target: ≤1</p>
               </div>
               <div>
                 <Label htmlFor="mda-sjc">Swollen Joint Count (SJC66)</Label>
                 <Input 
                   id="mda-sjc"
                   type="number" 
                   min={0} 
                   max={66} 
                   value={inputs.sjc} 
                   onChange={(e) => updateInput('sjc', Number(e.target.value), 66)} 
                   className="mt-1" 
                 />
                 <p className="text-xs text-muted-foreground mt-1">Target: ≤1</p>
               </div>
             </div>
             
             <div>
               <Label htmlFor="mda-pasi">PASI Score (or BSA %)</Label>
               <Input 
                 id="mda-pasi"
                 type="number" 
                 min={0} 
                 max={72}
                 step={0.1}
                 value={inputs.pasi} 
                 onChange={(e) => updateInput('pasi', Number(e.target.value), 72)} 
                 className="mt-1" 
               />
               <p className="text-xs text-muted-foreground mt-1">Target: PASI ≤1 or BSA ≤3%</p>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="mda-pain">Patient Pain VAS (mm)</Label>
                 <Input 
                   id="mda-pain"
                   type="number" 
                   min={0} 
                   max={100}
                   value={inputs.painVas} 
                   onChange={(e) => updateInput('painVas', Number(e.target.value), 100)} 
                   className="mt-1" 
                 />
                 <p className="text-xs text-muted-foreground mt-1">Target: ≤15mm (0-100)</p>
               </div>
               <div>
                 <Label htmlFor="mda-pga">Patient Global VAS (mm)</Label>
                 <Input 
                   id="mda-pga"
                   type="number" 
                   min={0} 
                   max={100}
                   value={inputs.pgaVas} 
                   onChange={(e) => updateInput('pgaVas', Number(e.target.value), 100)} 
                   className="mt-1" 
                 />
                 <p className="text-xs text-muted-foreground mt-1">Target: ≤20mm (0-100)</p>
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="mda-haq">HAQ Score</Label>
                 <Input 
                   id="mda-haq"
                   type="number" 
                   min={0} 
                   max={3}
                   step={0.125}
                   value={inputs.haq} 
                   onChange={(e) => updateInput('haq', Number(e.target.value), 3)} 
                   className="mt-1" 
                 />
                 <p className="text-xs text-muted-foreground mt-1">Target: ≤0.5 (0-3)</p>
               </div>
               <div>
                 <Label htmlFor="mda-entheseal">Tender Entheseal Points</Label>
                 <Input 
                   id="mda-entheseal"
                   type="number" 
                   min={0} 
                   max={13}
                   value={inputs.tenderEntheseal} 
                   onChange={(e) => updateInput('tenderEntheseal', Number(e.target.value), 13)} 
                   className="mt-1" 
                 />
                 <p className="text-xs text-muted-foreground mt-1">Target: ≤1 (LEI 0-6 or SPARCC 0-16)</p>
               </div>
             </div>
             
             <div className="flex gap-2">
               <Button onClick={calculate} className="flex-1 gap-2">
                 <Calculator className="h-4 w-4" />
                 Assess MDA
               </Button>
               <Button variant="outline" onClick={resetForm}>
                 Reset
               </Button>
             </div>
           </div>
           
           {/* Results Section */}
           <div className="space-y-4">
             <div className={cn(
               'flex flex-col items-center justify-center rounded-lg p-6',
               calculated
                 ? isMDA
                   ? 'bg-success/10'
                   : 'bg-warning/10'
                 : 'bg-muted/50'
             )}>
               {calculated ? (
                 <>
                   <p className="text-sm text-muted-foreground mb-2">MDA Status</p>
                   {isMDA ? (
                     <CheckCircle className="h-12 w-12 text-success mb-2" />
                   ) : (
                     <XCircle className="h-12 w-12 text-warning mb-2" />
                   )}
                   <p className={cn(
                     'text-2xl font-bold',
                     isMDA ? 'text-success' : 'text-warning'
                   )}>
                     {isMDA ? 'MDA Achieved' : 'MDA Not Achieved'}
                   </p>
                   <p className="text-sm text-muted-foreground mt-1">
                     {criteriaMet}/7 criteria met (≥5 required)
                   </p>
                   
                   <Button 
                     variant="outline" 
                     size="sm" 
                     className="mt-4 gap-2" 
                     onClick={saveScore}
                     disabled={isSaving}
                   >
                     <Save className="h-4 w-4" />
                     {isSaving ? 'Saving...' : 'Save Assessment'}
                   </Button>
                 </>
               ) : (
                 <div className="text-center">
                   <p className="text-muted-foreground">Enter values and assess</p>
                   <p className="text-xs text-muted-foreground mt-2">
                     MDA is a treat-to-target goal for PsA
                   </p>
                 </div>
               )}
             </div>
             
             {/* Criteria Checklist */}
             <div className="border rounded-lg p-4">
               <h4 className="font-medium mb-3">Criteria Status</h4>
               <div className="space-y-2">
                 {criteriaStatus.map((criterion, index) => (
                   <div 
                     key={index}
                     className={cn(
                       'flex items-center justify-between p-2 rounded text-sm',
                       calculated
                         ? criterion.met
                           ? 'bg-success/10'
                           : 'bg-destructive/10'
                         : 'bg-muted/30'
                     )}
                   >
                     <div className="flex items-center gap-2">
                       {calculated && (
                         criterion.met 
                           ? <CheckCircle className="h-4 w-4 text-success" />
                           : <XCircle className="h-4 w-4 text-destructive" />
                       )}
                       <span>{criterion.label}</span>
                     </div>
                     <span className="text-muted-foreground text-xs">
                       {criterion.description}
                     </span>
                   </div>
                 ))}
               </div>
             </div>
           </div>
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