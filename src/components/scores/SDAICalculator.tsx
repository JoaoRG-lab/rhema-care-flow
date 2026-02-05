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
 
 export function SDAICalculator() {
   const { user } = useAuth();
   const [tjc, setTjc] = useState<number>(0);
   const [sjc, setSjc] = useState<number>(0);
   const [pga, setPga] = useState<number>(0);
   const [ega, setEga] = useState<number>(0);
   const [crp, setCrp] = useState<number>(0);
   const [result, setResult] = useState<number | null>(null);
   const [isSaving, setIsSaving] = useState(false);
 
   const calculate = () => {
     // SDAI formula: TJC + SJC + PGA + EGA + CRP
     // TJC and SJC: 0-28, PGA and EGA: 0-10 (cm VAS), CRP: mg/dL
     const score = tjc + sjc + pga + ega + crp;
     const roundedScore = Math.round(score * 100) / 100;
     setResult(roundedScore);
     
     addToHistory({
       calculatorId: 'sdai',
       score: roundedScore,
       inputs: { tjc, sjc, pga, ega, crp },
     });
   };
 
   const saveScore = async () => {
     if (!user || result === null) return;
     setIsSaving(true);
     
     try {
       const { error } = await supabase.from('score_entries').insert({
         user_id: user.id,
         score_type: 'SDAI',
         data_json: { tjc, sjc, pga, ega, crp } as any,
         calculated_score: result,
       });
       
       if (error) throw error;
       toast.success('SDAI score saved');
     } catch (error) {
       console.error('Error saving score:', error);
       toast.error('Failed to save score');
     } finally {
       setIsSaving(false);
     }
   };
 
   const getInterpretation = (score: number) => {
     // SDAI thresholds per ACR/EULAR
     if (score <= 3.3) return { text: 'Remission', color: 'text-success', bg: 'bg-success/10' };
     if (score <= 11) return { text: 'Low Disease Activity', color: 'text-info', bg: 'bg-info/10' };
     if (score <= 26) return { text: 'Moderate Disease Activity', color: 'text-warning', bg: 'bg-warning/10' };
     return { text: 'High Disease Activity', color: 'text-destructive', bg: 'bg-destructive/10' };
   };
 
   const resetForm = () => {
     setTjc(0);
     setSjc(0);
     setPga(0);
     setEga(0);
     setCrp(0);
     setResult(null);
   };
 
   return (
     <Card>
       <CardHeader>
         <div className="flex items-start justify-between">
           <div>
             <CardTitle className="flex items-center gap-2">
               Simplified Disease Activity Index (SDAI)
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger>
                     <Info className="h-4 w-4 text-muted-foreground" />
                   </TooltipTrigger>
                   <TooltipContent className="max-w-xs">
                     <p className="font-medium mb-1">Formula:</p>
                     <p className="text-xs font-mono">TJC28 + SJC28 + PGA + EGA + CRP</p>
                     <p className="text-xs mt-2">Unlike CDAI, SDAI includes CRP for objective inflammation marker.</p>
                   </TooltipContent>
                 </Tooltip>
               </TooltipProvider>
             </CardTitle>
             <CardDescription>
               Simplified Disease Activity Index for Rheumatoid Arthritis (includes CRP)
             </CardDescription>
           </div>
         </div>
       </CardHeader>
       <CardContent>
         <div className="grid md:grid-cols-2 gap-6">
           <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="tjc">Tender Joint Count (TJC28)</Label>
                 <Input 
                   id="tjc"
                   type="number" 
                   min={0} 
                   max={28} 
                   value={tjc} 
                   onChange={(e) => setTjc(Math.min(28, Math.max(0, Number(e.target.value))))} 
                   className="mt-1" 
                 />
                 <p className="text-xs text-muted-foreground mt-1">0-28 joints</p>
               </div>
               <div>
                 <Label htmlFor="sjc">Swollen Joint Count (SJC28)</Label>
                 <Input 
                   id="sjc"
                   type="number" 
                   min={0} 
                   max={28} 
                   value={sjc} 
                   onChange={(e) => setSjc(Math.min(28, Math.max(0, Number(e.target.value))))} 
                   className="mt-1" 
                 />
                 <p className="text-xs text-muted-foreground mt-1">0-28 joints</p>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="pga">Patient Global Assessment</Label>
                 <Input 
                   id="pga"
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
               <div>
                 <Label htmlFor="ega">Evaluator Global Assessment</Label>
                 <Input 
                   id="ega"
                   type="number" 
                   min={0} 
                   max={10}
                   step={0.1}
                   value={ega} 
                   onChange={(e) => setEga(Math.min(10, Math.max(0, Number(e.target.value))))} 
                   className="mt-1" 
                 />
                 <p className="text-xs text-muted-foreground mt-1">0-10 cm VAS</p>
               </div>
             </div>
             <div>
               <Label htmlFor="crp">CRP (mg/dL)</Label>
               <Input 
                 id="crp"
                 type="number" 
                 min={0}
                 max={10}
                 step={0.1}
                 value={crp} 
                 onChange={(e) => setCrp(Math.min(10, Math.max(0, Number(e.target.value))))} 
                 className="mt-1" 
               />
               <p className="text-xs text-muted-foreground mt-1">C-reactive protein 0-10 mg/dL (note: mg/dL not mg/L)</p>
             </div>
             <div className="flex gap-2">
               <Button onClick={calculate} className="flex-1 gap-2">
                 <Calculator className="h-4 w-4" />
                 Calculate SDAI
               </Button>
               <Button variant="outline" onClick={resetForm}>
                 Reset
               </Button>
             </div>
           </div>
           
           <div className={`flex flex-col items-center justify-center rounded-lg p-6 ${result !== null ? getInterpretation(result).bg : 'bg-muted/50'}`}>
             {result !== null ? (
               <>
                 <p className="text-sm text-muted-foreground mb-2">SDAI Score</p>
                 <p className="text-5xl font-bold text-foreground">{result}</p>
                 <p className={`text-lg font-medium mt-2 ${getInterpretation(result).color}`}>
                   {getInterpretation(result).text}
                 </p>
                 
                 {/* Interpretation guide */}
                 <div className="mt-4 text-xs text-muted-foreground space-y-1 text-center">
                   <p>Remission: ≤3.3 | Low: 3.3-11</p>
                   <p>Moderate: 11-26 | High: &gt;26</p>
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
                   SDAI adds CRP to CDAI for an objective measure
                 </p>
               </div>
             )}
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }