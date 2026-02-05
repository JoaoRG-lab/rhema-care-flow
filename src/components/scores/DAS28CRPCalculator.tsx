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
 
 export function DAS28CRPCalculator() {
   const { user } = useAuth();
   const [tjc, setTjc] = useState<number>(0);
   const [sjc, setSjc] = useState<number>(0);
   const [crp, setCrp] = useState<number>(0);
   const [globalHealth, setGlobalHealth] = useState<number>(0);
   const [result, setResult] = useState<number | null>(null);
   const [isSaving, setIsSaving] = useState(false);
 
   const calculate = () => {
     // DAS28-CRP formula: 0.56×√TJC + 0.28×√SJC + 0.36×ln(CRP+1) + 0.014×GH + 0.96
     const score = 0.56 * Math.sqrt(tjc) + 
                   0.28 * Math.sqrt(sjc) + 
                   0.36 * Math.log(crp + 1) + 
                   0.014 * globalHealth + 
                   0.96;
     const roundedScore = Math.round(score * 100) / 100;
     setResult(roundedScore);
     
     // Add to local history
     addToHistory({
       calculatorId: 'das28-crp',
       score: roundedScore,
       inputs: { tjc, sjc, crp, globalHealth },
     });
   };
 
   const saveScore = async () => {
     if (!user || result === null) return;
     setIsSaving(true);
     
     try {
       const { error } = await supabase.from('score_entries').insert({
         user_id: user.id,
         score_type: 'DAS28-CRP',
         data_json: { tjc, sjc, crp, globalHealth } as any,
         calculated_score: result,
       });
       
       if (error) throw error;
       toast.success('DAS28-CRP score saved');
     } catch (error) {
       console.error('Error saving score:', error);
       toast.error('Failed to save score');
     } finally {
       setIsSaving(false);
     }
   };
 
   const getInterpretation = (score: number) => {
     // DAS28-CRP thresholds (slightly different from ESR)
     if (score < 2.6) return { text: 'Remission', color: 'text-success', bg: 'bg-success/10' };
     if (score < 3.2) return { text: 'Low Disease Activity', color: 'text-info', bg: 'bg-info/10' };
     if (score <= 5.1) return { text: 'Moderate Disease Activity', color: 'text-warning', bg: 'bg-warning/10' };
     return { text: 'High Disease Activity', color: 'text-destructive', bg: 'bg-destructive/10' };
   };
 
   const resetForm = () => {
     setTjc(0);
     setSjc(0);
     setCrp(0);
     setGlobalHealth(0);
     setResult(null);
   };
 
   return (
     <Card>
       <CardHeader>
         <div className="flex items-start justify-between">
           <div>
             <CardTitle className="flex items-center gap-2">
               DAS28-CRP Calculator
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger>
                     <Info className="h-4 w-4 text-muted-foreground" />
                   </TooltipTrigger>
                   <TooltipContent className="max-w-xs">
                     <p className="font-medium mb-1">Formula:</p>
                     <p className="text-xs font-mono">0.56×√TJC + 0.28×√SJC + 0.36×ln(CRP+1) + 0.014×GH + 0.96</p>
                   </TooltipContent>
                 </Tooltip>
               </TooltipProvider>
             </CardTitle>
             <CardDescription>Disease Activity Score using CRP for Rheumatoid Arthritis</CardDescription>
           </div>
         </div>
       </CardHeader>
       <CardContent>
         <div className="grid md:grid-cols-2 gap-6">
           <div className="space-y-4">
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
             <div>
               <Label htmlFor="crp">CRP (mg/L)</Label>
               <Input 
                 id="crp"
                 type="number" 
                 min={0}
                 step={0.1}
                 value={crp} 
                 onChange={(e) => setCrp(Math.max(0, Number(e.target.value)))} 
                 className="mt-1" 
               />
               <p className="text-xs text-muted-foreground mt-1">C-reactive protein in mg/L</p>
             </div>
             <div>
               <Label htmlFor="gh">Patient Global Health (0-100 VAS)</Label>
               <Input 
                 id="gh"
                 type="number" 
                 min={0} 
                 max={100} 
                 value={globalHealth} 
                 onChange={(e) => setGlobalHealth(Math.min(100, Math.max(0, Number(e.target.value))))} 
                 className="mt-1" 
               />
               <p className="text-xs text-muted-foreground mt-1">Visual Analog Scale 0-100mm</p>
             </div>
             <div className="flex gap-2">
               <Button onClick={calculate} className="flex-1 gap-2">
                 <Calculator className="h-4 w-4" />
                 Calculate
               </Button>
               <Button variant="outline" onClick={resetForm}>
                 Reset
               </Button>
             </div>
           </div>
           
           <div className={`flex flex-col items-center justify-center rounded-lg p-6 ${result !== null ? getInterpretation(result).bg : 'bg-muted/50'}`}>
             {result !== null ? (
               <>
                 <p className="text-sm text-muted-foreground mb-2">DAS28-CRP Score</p>
                 <p className="text-5xl font-bold text-foreground">{result}</p>
                 <p className={`text-lg font-medium mt-2 ${getInterpretation(result).color}`}>
                   {getInterpretation(result).text}
                 </p>
                 
                 {/* Interpretation guide */}
                 <div className="mt-4 text-xs text-muted-foreground space-y-1 text-center">
                   <p>Remission: &lt;2.6 | Low: 2.6-3.2</p>
                   <p>Moderate: 3.2-5.1 | High: &gt;5.1</p>
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
                   Used for RA disease activity assessment when ESR is unavailable
                 </p>
               </div>
             )}
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }