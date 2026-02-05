 import { useState } from 'react';
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Calculator, Save } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 
 export function CDAICalculator() {
   const { user } = useAuth();
   const [tjc, setTjc] = useState<number>(0);
   const [sjc, setSjc] = useState<number>(0);
   const [patient, setPatient] = useState<number>(0);
   const [physician, setPhysician] = useState<number>(0);
   const [result, setResult] = useState<number | null>(null);
 
   const calculate = () => {
     setResult(tjc + sjc + patient + physician);
   };
 
   const saveScore = async () => {
     if (!user || result === null) return;
     const { error } = await supabase.from('score_entries').insert({
       user_id: user.id,
       score_type: 'CDAI',
       data_json: { tjc, sjc, patient, physician } as any,
       calculated_score: result,
     });
     if (error) toast.error('Failed to save score');
     else toast.success('CDAI score saved');
   };
 
   const getInterpretation = (score: number) => {
     if (score <= 2.8) return { text: 'Remission', color: 'text-success' };
     if (score <= 10) return { text: 'Low Activity', color: 'text-info' };
     if (score <= 22) return { text: 'Moderate Activity', color: 'text-warning' };
     return { text: 'High Activity', color: 'text-destructive' };
   };
 
   return (
     <Card>
       <CardHeader>
         <CardTitle>CDAI Calculator</CardTitle>
         <CardDescription>Clinical Disease Activity Index</CardDescription>
       </CardHeader>
       <CardContent>
         <div className="grid md:grid-cols-2 gap-6">
           <div className="space-y-4">
             <div>
               <Label>Tender Joint Count (TJC28)</Label>
               <Input type="number" min={0} max={28} value={tjc} onChange={(e) => setTjc(Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Swollen Joint Count (SJC28)</Label>
               <Input type="number" min={0} max={28} value={sjc} onChange={(e) => setSjc(Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Patient Global Assessment (0-10)</Label>
               <Input type="number" min={0} max={10} step={0.1} value={patient} onChange={(e) => setPatient(Number(e.target.value))} className="mt-1" />
             </div>
             <div>
               <Label>Physician Global Assessment (0-10)</Label>
               <Input type="number" min={0} max={10} step={0.1} value={physician} onChange={(e) => setPhysician(Number(e.target.value))} className="mt-1" />
             </div>
             <Button onClick={calculate} className="w-full gap-2">
               <Calculator className="h-4 w-4" />
               Calculate CDAI
             </Button>
           </div>
           
           <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6">
             {result !== null ? (
               <>
                 <p className="text-sm text-muted-foreground mb-2">CDAI Score</p>
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