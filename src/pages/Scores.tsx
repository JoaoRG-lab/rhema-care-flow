 import { useState } from 'react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Activity, Calculator, Save } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 
 export default function Scores() {
   const { user } = useAuth();
   
   // DAS28 state
   const [tjc, setTjc] = useState<number>(0);
   const [sjc, setSjc] = useState<number>(0);
   const [esr, setEsr] = useState<number>(0);
   const [globalHealth, setGlobalHealth] = useState<number>(0);
   const [das28Result, setDas28Result] = useState<number | null>(null);
 
   // BASDAI state
   const [basdaiQ1, setBasdaiQ1] = useState<number>(0);
   const [basdaiQ2, setBasdaiQ2] = useState<number>(0);
   const [basdaiQ3, setBasdaiQ3] = useState<number>(0);
   const [basdaiQ4, setBasdaiQ4] = useState<number>(0);
   const [basdaiQ5, setBasdaiQ5] = useState<number>(0);
   const [basdaiQ6, setBasdaiQ6] = useState<number>(0);
   const [basdaiResult, setBasdaiResult] = useState<number | null>(null);
 
   // CDAI state
   const [cdaiTjc, setCdaiTjc] = useState<number>(0);
   const [cdaiSjc, setCdaiSjc] = useState<number>(0);
   const [cdaiPatient, setCdaiPatient] = useState<number>(0);
   const [cdaiPhysician, setCdaiPhysician] = useState<number>(0);
   const [cdaiResult, setCdaiResult] = useState<number | null>(null);
 
   const calculateDAS28 = () => {
     // DAS28-ESR formula
     const result = 0.56 * Math.sqrt(tjc) + 0.28 * Math.sqrt(sjc) + 
                    0.70 * Math.log(esr) + 0.014 * globalHealth;
     setDas28Result(Math.round(result * 100) / 100);
   };
 
   const calculateBASDAI = () => {
     // BASDAI formula: average of Q1-4 + average of Q5-6, divided by 2
     const avgQ1to4 = (basdaiQ1 + basdaiQ2 + basdaiQ3 + basdaiQ4) / 4;
     const avgQ5Q6 = (basdaiQ5 + basdaiQ6) / 2;
     const result = (avgQ1to4 + avgQ5Q6) / 2;
     setBasdaiResult(Math.round(result * 10) / 10);
   };
 
   const calculateCDAI = () => {
     const result = cdaiTjc + cdaiSjc + cdaiPatient + cdaiPhysician;
     setCdaiResult(result);
   };
 
   const saveScore = async (scoreType: string, dataJson: object, calculatedScore: number) => {
     if (!user) return;
 
     const { error } = await supabase.from('score_entries').insert({
       user_id: user.id,
       score_type: scoreType,
       data_json: dataJson as any,
       calculated_score: calculatedScore,
     });
 
     if (error) {
       toast.error('Failed to save score');
     } else {
       toast.success(`${scoreType} score saved`);
     }
   };
 
   const getDAS28Interpretation = (score: number) => {
     if (score < 2.6) return { text: 'Remission', color: 'text-success' };
     if (score < 3.2) return { text: 'Low Disease Activity', color: 'text-info' };
     if (score <= 5.1) return { text: 'Moderate Disease Activity', color: 'text-warning' };
     return { text: 'High Disease Activity', color: 'text-destructive' };
   };
 
   const getBASDAIInterpretation = (score: number) => {
     if (score < 4) return { text: 'Low Activity', color: 'text-success' };
     return { text: 'High Activity', color: 'text-destructive' };
   };
 
   const getCDAIInterpretation = (score: number) => {
     if (score <= 2.8) return { text: 'Remission', color: 'text-success' };
     if (score <= 10) return { text: 'Low Activity', color: 'text-info' };
     if (score <= 22) return { text: 'Moderate Activity', color: 'text-warning' };
     return { text: 'High Activity', color: 'text-destructive' };
   };
 
   return (
     <AppLayout>
       <div className="p-6 lg:p-8">
         <div className="mb-6">
           <h1 className="text-2xl font-bold flex items-center gap-2">
             <Activity className="h-6 w-6 text-primary" />
             Disease Activity Scores
           </h1>
           <p className="text-muted-foreground">Calculate and track disease activity indices</p>
         </div>
 
         <Tabs defaultValue="das28" className="space-y-6">
           <TabsList className="grid w-full max-w-md grid-cols-3">
             <TabsTrigger value="das28">DAS28-ESR</TabsTrigger>
             <TabsTrigger value="cdai">CDAI</TabsTrigger>
             <TabsTrigger value="basdai">BASDAI</TabsTrigger>
           </TabsList>
 
           {/* DAS28-ESR Tab */}
           <TabsContent value="das28">
             <Card>
               <CardHeader>
                 <CardTitle>DAS28-ESR Calculator</CardTitle>
                 <CardDescription>Disease Activity Score for Rheumatoid Arthritis</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <div>
                       <Label>Tender Joint Count (TJC28)</Label>
                       <Input
                         type="number"
                         min={0}
                         max={28}
                         value={tjc}
                         onChange={(e) => setTjc(Number(e.target.value))}
                         className="mt-1"
                       />
                     </div>
                     <div>
                       <Label>Swollen Joint Count (SJC28)</Label>
                       <Input
                         type="number"
                         min={0}
                         max={28}
                         value={sjc}
                         onChange={(e) => setSjc(Number(e.target.value))}
                         className="mt-1"
                       />
                     </div>
                     <div>
                       <Label>ESR (mm/h)</Label>
                       <Input
                         type="number"
                         min={1}
                         value={esr}
                         onChange={(e) => setEsr(Number(e.target.value))}
                         className="mt-1"
                       />
                     </div>
                     <div>
                       <Label>Patient Global Health (0-100 VAS)</Label>
                       <Input
                         type="number"
                         min={0}
                         max={100}
                         value={globalHealth}
                         onChange={(e) => setGlobalHealth(Number(e.target.value))}
                         className="mt-1"
                       />
                     </div>
                     <Button onClick={calculateDAS28} className="w-full gap-2">
                       <Calculator className="h-4 w-4" />
                       Calculate DAS28
                     </Button>
                   </div>
                   
                   <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6">
                     {das28Result !== null ? (
                       <>
                         <p className="text-sm text-muted-foreground mb-2">DAS28-ESR Score</p>
                         <p className="text-5xl font-bold text-foreground">{das28Result}</p>
                         <p className={`text-lg font-medium mt-2 ${getDAS28Interpretation(das28Result).color}`}>
                           {getDAS28Interpretation(das28Result).text}
                         </p>
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="mt-4 gap-2"
                           onClick={() => saveScore('DAS28-ESR', { tjc, sjc, esr, globalHealth }, das28Result)}
                         >
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
           </TabsContent>
 
           {/* CDAI Tab */}
           <TabsContent value="cdai">
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
                       <Input
                         type="number"
                         min={0}
                         max={28}
                         value={cdaiTjc}
                         onChange={(e) => setCdaiTjc(Number(e.target.value))}
                         className="mt-1"
                       />
                     </div>
                     <div>
                       <Label>Swollen Joint Count (SJC28)</Label>
                       <Input
                         type="number"
                         min={0}
                         max={28}
                         value={cdaiSjc}
                         onChange={(e) => setCdaiSjc(Number(e.target.value))}
                         className="mt-1"
                       />
                     </div>
                     <div>
                       <Label>Patient Global Assessment (0-10)</Label>
                       <Input
                         type="number"
                         min={0}
                         max={10}
                         step={0.1}
                         value={cdaiPatient}
                         onChange={(e) => setCdaiPatient(Number(e.target.value))}
                         className="mt-1"
                       />
                     </div>
                     <div>
                       <Label>Physician Global Assessment (0-10)</Label>
                       <Input
                         type="number"
                         min={0}
                         max={10}
                         step={0.1}
                         value={cdaiPhysician}
                         onChange={(e) => setCdaiPhysician(Number(e.target.value))}
                         className="mt-1"
                       />
                     </div>
                     <Button onClick={calculateCDAI} className="w-full gap-2">
                       <Calculator className="h-4 w-4" />
                       Calculate CDAI
                     </Button>
                   </div>
                   
                   <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6">
                     {cdaiResult !== null ? (
                       <>
                         <p className="text-sm text-muted-foreground mb-2">CDAI Score</p>
                         <p className="text-5xl font-bold text-foreground">{cdaiResult}</p>
                         <p className={`text-lg font-medium mt-2 ${getCDAIInterpretation(cdaiResult).color}`}>
                           {getCDAIInterpretation(cdaiResult).text}
                         </p>
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="mt-4 gap-2"
                           onClick={() => saveScore('CDAI', { cdaiTjc, cdaiSjc, cdaiPatient, cdaiPhysician }, cdaiResult)}
                         >
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
           </TabsContent>
 
           {/* BASDAI Tab */}
           <TabsContent value="basdai">
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
                       <Input
                         type="number"
                         min={0}
                         max={10}
                         step={0.1}
                         value={basdaiQ1}
                         onChange={(e) => setBasdaiQ1(Number(e.target.value))}
                         className="mt-1"
                       />
                     </div>
                     <div>
                       <Label>Q2: Spinal Pain (0-10)</Label>
                       <Input
                         type="number"
                         min={0}
                         max={10}
                         step={0.1}
                         value={basdaiQ2}
                         onChange={(e) => setBasdaiQ2(Number(e.target.value))}
                         className="mt-1"
                       />
                     </div>
                     <div>
                       <Label>Q3: Joint Pain/Swelling (0-10)</Label>
                       <Input
                         type="number"
                         min={0}
                         max={10}
                         step={0.1}
                         value={basdaiQ3}
                         onChange={(e) => setBasdaiQ3(Number(e.target.value))}
                         className="mt-1"
                       />
                     </div>
                     <div>
                       <Label>Q4: Enthesitis (0-10)</Label>
                       <Input
                         type="number"
                         min={0}
                         max={10}
                         step={0.1}
                         value={basdaiQ4}
                         onChange={(e) => setBasdaiQ4(Number(e.target.value))}
                         className="mt-1"
                       />
                     </div>
                     <div>
                       <Label>Q5: Morning Stiffness Severity (0-10)</Label>
                       <Input
                         type="number"
                         min={0}
                         max={10}
                         step={0.1}
                         value={basdaiQ5}
                         onChange={(e) => setBasdaiQ5(Number(e.target.value))}
                         className="mt-1"
                       />
                     </div>
                     <div>
                       <Label>Q6: Morning Stiffness Duration (0-10)</Label>
                       <Input
                         type="number"
                         min={0}
                         max={10}
                         step={0.1}
                         value={basdaiQ6}
                         onChange={(e) => setBasdaiQ6(Number(e.target.value))}
                         className="mt-1"
                       />
                     </div>
                     <Button onClick={calculateBASDAI} className="w-full gap-2">
                       <Calculator className="h-4 w-4" />
                       Calculate BASDAI
                     </Button>
                   </div>
                   
                   <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6">
                     {basdaiResult !== null ? (
                       <>
                         <p className="text-sm text-muted-foreground mb-2">BASDAI Score</p>
                         <p className="text-5xl font-bold text-foreground">{basdaiResult}</p>
                         <p className={`text-lg font-medium mt-2 ${getBASDAIInterpretation(basdaiResult).color}`}>
                           {getBASDAIInterpretation(basdaiResult).text}
                         </p>
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="mt-4 gap-2"
                           onClick={() => saveScore('BASDAI', { basdaiQ1, basdaiQ2, basdaiQ3, basdaiQ4, basdaiQ5, basdaiQ6 }, basdaiResult)}
                         >
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
           </TabsContent>
         </Tabs>
       </div>
     </AppLayout>
   );
 }