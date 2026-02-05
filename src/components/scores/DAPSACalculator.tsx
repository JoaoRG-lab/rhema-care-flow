 import { useState } from 'react';
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Calculator, Save, Info } from 'lucide-react';
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 import { addToHistory } from '@/lib/calculators';
 import { useLoginPrompt } from '@/hooks/useLoginPrompt';
 import { LoginPromptDialog } from './LoginPromptDialog';
 
 export function DAPSACalculator() {
   const { user } = useAuth();
   const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
   const [tjc, setTjc] = useState<number>(0);
   const [sjc, setSjc] = useState<number>(0);
   const [painVas, setPainVas] = useState<number>(0);
   const [pga, setPga] = useState<number>(0);
   const [crp, setCrp] = useState<number>(0);
   const [result, setResult] = useState<number | null>(null);
   const [isSaving, setIsSaving] = useState(false);
 
   const calculate = () => {
     // DAPSA formula: TJC66 + SJC66 + Pain VAS (0-10) + PGA (0-10) + CRP (mg/dL)
     // Note: Pain VAS and PGA are on 0-10 cm scale
     const score = tjc + sjc + painVas + pga + crp;
     const roundedScore = Math.round(score * 100) / 100;
     setResult(roundedScore);
     
     addToHistory({
       calculatorId: 'dapsa',
       score: roundedScore,
       inputs: { tjc, sjc, painVas, pga, crp },
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
         score_type: 'DAPSA',
         data_json: { tjc, sjc, painVas, pga, crp } as any,
         calculated_score: result,
       });
       
       if (error) throw error;
       toast.success('DAPSA score saved');
     } catch (error) {
       console.error('Error saving score:', error);
       toast.error('Failed to save score');
     } finally {
       setIsSaving(false);
     }
   };
 
   const getInterpretation = (score: number) => {
     // DAPSA thresholds per Schoels et al. 2016
     if (score <= 4) return { text: 'Remission', color: 'text-success', bg: 'bg-success/10' };
     if (score <= 14) return { text: 'Low Disease Activity', color: 'text-info', bg: 'bg-info/10' };
     if (score <= 28) return { text: 'Moderate Disease Activity', color: 'text-warning', bg: 'bg-warning/10' };
     return { text: 'High Disease Activity', color: 'text-destructive', bg: 'bg-destructive/10' };
   };
 
   const resetForm = () => {
     setTjc(0);
     setSjc(0);
     setPainVas(0);
     setPga(0);
     setCrp(0);
     setResult(null);
   };
 
   return (
     <Card>
       <CardHeader>
         <div className="flex items-start justify-between">
           <div>
             <CardTitle className="flex items-center gap-2">
               Disease Activity in Psoriatic Arthritis (DAPSA)
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger>
                     <Info className="h-4 w-4 text-muted-foreground" />
                   </TooltipTrigger>
                   <TooltipContent className="max-w-xs">
                     <p className="font-medium mb-1">Formula:</p>
                     <p className="text-xs font-mono">TJC66 + SJC66 + Pain VAS + PGA + CRP</p>
                     <p className="text-xs mt-2">Validated for peripheral joint involvement in PsA. Does not include skin or entheseal assessment.</p>
                   </TooltipContent>
                 </Tooltip>
               </TooltipProvider>
             </CardTitle>
             <CardDescription>
               Disease Activity Index for Psoriatic Arthritis (peripheral joints)
             </CardDescription>
           </div>
         </div>
       </CardHeader>
       <CardContent>
         <div className="grid md:grid-cols-2 gap-6">
           <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="dapsa-tjc">Tender Joint Count (TJC66)</Label>
                 <Input 
                   id="dapsa-tjc"
                   type="number" 
                   min={0} 
                   max={66} 
                   value={tjc} 
                   onChange={(e) => setTjc(Math.min(66, Math.max(0, Number(e.target.value))))} 
                   className="mt-1" 
                 />
                 <p className="text-xs text-muted-foreground mt-1">0-66 joints</p>
               </div>
               <div>
                 <Label htmlFor="dapsa-sjc">Swollen Joint Count (SJC66)</Label>
                 <Input 
                   id="dapsa-sjc"
                   type="number" 
                   min={0} 
                   max={66} 
                   value={sjc} 
                   onChange={(e) => setSjc(Math.min(66, Math.max(0, Number(e.target.value))))} 
                   className="mt-1" 
                 />
                 <p className="text-xs text-muted-foreground mt-1">0-66 joints</p>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="dapsa-pain">Patient Pain VAS</Label>
                 <Input 
                   id="dapsa-pain"
                   type="number" 
                   min={0} 
                   max={10}
                   step={0.1}
                   value={painVas} 
                   onChange={(e) => setPainVas(Math.min(10, Math.max(0, Number(e.target.value))))} 
                   className="mt-1" 
                 />
                 <p className="text-xs text-muted-foreground mt-1">0-10 cm VAS</p>
               </div>
               <div>
                 <Label htmlFor="dapsa-pga">Patient Global Assessment</Label>
                 <Input 
                   id="dapsa-pga"
                   type="number" 
                   min={0} 
                   max={10}
                   step={0.1}
                   value={pga} 
                   onChange={(e) => setPga(Math.min(10, Math.max(0, Number(e.target.value))))} 
                   className="mt-1" 
                 />
                 <p className="text-xs text-muted-foreground mt-1">0-10 cm VAS</p>
               </div>
             </div>
             <div>
               <Label htmlFor="dapsa-crp">CRP (mg/dL)</Label>
               <Input 
                 id="dapsa-crp"
                 type="number" 
                 min={0}
                 max={30}
                 step={0.1}
                 value={crp} 
                 onChange={(e) => setCrp(Math.min(30, Math.max(0, Number(e.target.value))))} 
                 className="mt-1" 
               />
               <p className="text-xs text-muted-foreground mt-1">C-reactive protein in mg/dL (note: mg/dL not mg/L)</p>
             </div>
             <div className="flex gap-2">
               <Button onClick={calculate} className="flex-1 gap-2">
                 <Calculator className="h-4 w-4" />
                 Calculate DAPSA
               </Button>
               <Button variant="outline" onClick={resetForm}>
                 Reset
               </Button>
             </div>
           </div>
           
           <div className={`flex flex-col items-center justify-center rounded-lg p-6 ${result !== null ? getInterpretation(result).bg : 'bg-muted/50'}`}>
             {result !== null ? (
               <>
                 <p className="text-sm text-muted-foreground mb-2">DAPSA Score</p>
                 <p className="text-5xl font-bold text-foreground">{result}</p>
                 <p className={`text-lg font-medium mt-2 ${getInterpretation(result).color}`}>
                   {getInterpretation(result).text}
                 </p>
                 
                 {/* Interpretation guide */}
                 <div className="mt-4 text-xs text-muted-foreground space-y-1 text-center">
                   <p>Remission: ≤4 | Low: 4-14</p>
                   <p>Moderate: 14-28 | High: &gt;28</p>
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
                 <p className="text-muted-foreground">Enter values and calculate</p>
                 <p className="text-xs text-muted-foreground mt-2">
                   DAPSA uses 66-joint count for PsA peripheral involvement
                 </p>
               </div>
             )}
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