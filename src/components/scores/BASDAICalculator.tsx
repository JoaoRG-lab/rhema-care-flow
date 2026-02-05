 import { useState } from 'react';
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Calculator, Save } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 
 export function BASDAICalculator() {
   const { user } = useAuth();
   const [q1, setQ1] = useState<number>(0);
   const [q2, setQ2] = useState<number>(0);
   const [q3, setQ3] = useState<number>(0);
   const [q4, setQ4] = useState<number>(0);
   const [q5, setQ5] = useState<number>(0);
   const [q6, setQ6] = useState<number>(0);
   const [result, setResult] = useState<number | null>(null);
 
   const calculate = () => {
     const avgQ1to4 = (q1 + q2 + q3 + q4) / 4;
     const avgQ5Q6 = (q5 + q6) / 2;
     setResult(Math.round(((avgQ1to4 + avgQ5Q6) / 2) * 10) / 10);
   };
 
   const saveScore = async () => {
     if (!user || result === null) return;
     const { error } = await supabase.from('score_entries').insert({
       user_id: user.id,
       score_type: 'BASDAI',
       data_json: { q1, q2, q3, q4, q5, q6 } as any,
       calculated_score: result,
     });
     if (error) toast.error('Failed to save score');
     else toast.success('BASDAI score saved');
   };
 
   const getInterpretation = (score: number) => {
     if (score < 4) return { text: 'Low Activity', color: 'text-success' };
     return { text: 'High Activity', color: 'text-destructive' };
   };
 
   return (
     <Card>
       <CardHeader>
         <CardTitle>BASDAI Calculator</CardTitle>
         <CardDescription>Bath Ankylosing Spondylitis Disease Activity Index</CardDescription>
       </CardHeader>
       <CardContent>
         <div className="grid md:grid-cols-2 gap-6">
           <div className="space-y-4">
             <div>
               <Label>Q1: Fatigue (0-10)</Label>
               <Input type="number" min={0} max={10} step={0.1} value={q1} onChange={(e) => setQ1(Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Q2: Spinal Pain (0-10)</Label>
               <Input type="number" min={0} max={10} step={0.1} value={q2} onChange={(e) => setQ2(Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Q3: Joint Pain/Swelling (0-10)</Label>
               <Input type="number" min={0} max={10} step={0.1} value={q3} onChange={(e) => setQ3(Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Q4: Enthesitis (0-10)</Label>
               <Input type="number" min={0} max={10} step={0.1} value={q4} onChange={(e) => setQ4(Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Q5: Morning Stiffness Severity (0-10)</Label>
               <Input type="number" min={0} max={10} step={0.1} value={q5} onChange={(e) => setQ5(Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Q6: Morning Stiffness Duration (0-10)</Label>
               <Input type="number" min={0} max={10} step={0.1} value={q6} onChange={(e) => setQ6(Number(e.target.value))} className="mt-1" />
             </div>
             <Button onClick={calculate} className="w-full gap-2">
               <Calculator className="h-4 w-4" />
               Calculate BASDAI
             </Button>
           </div>
           
           <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6">
             {result !== null ? (
               <>
                 <p className="text-sm text-muted-foreground mb-2">BASDAI Score</p>
                 <p className="text-5xl font-bold text-foreground">{result}</p>
                 <p className={`text-lg font-medium mt-2 ${getInterpretation(result).color}`}>
                   {getInterpretation(result).text}
                 </p>
                 <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={saveScore}>
                   <Save className="h-4 w-4" />
                   Save Score
                 </Button>
               </>
             ) : (
               <p className="text-muted-foreground">Enter values and calculate</p>
             )}
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }