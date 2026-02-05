 import { useState } from 'react';
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Checkbox } from '@/components/ui/checkbox';
 import { Label } from '@/components/ui/label';
 import { Calculator, Save } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 
 interface SLEDAIItem {
   id: string;
   label: string;
   description: string;
   weight: number;
   category: 'cns' | 'vascular' | 'renal' | 'musculoskeletal' | 'mucocutaneous' | 'serositis' | 'immunologic' | 'constitutional';
 }
 
 const SLEDAI_ITEMS: SLEDAIItem[] = [
   // CNS (8 points each)
   { id: 'seizure', label: 'Seizure', description: 'Recent onset, exclude metabolic, infectious or drug causes', weight: 8, category: 'cns' },
   { id: 'psychosis', label: 'Psychosis', description: 'Altered ability to function, exclude uremia and drugs', weight: 8, category: 'cns' },
   { id: 'organic_brain', label: 'Organic Brain Syndrome', description: 'Altered mental function with impaired orientation, memory or other function', weight: 8, category: 'cns' },
   { id: 'visual', label: 'Visual Disturbance', description: 'Retinal changes of SLE, exclude hypertension', weight: 8, category: 'cns' },
   { id: 'cranial_nerve', label: 'Cranial Nerve Disorder', description: 'New onset sensory or motor neuropathy involving cranial nerves', weight: 8, category: 'cns' },
   { id: 'lupus_headache', label: 'Lupus Headache', description: 'Severe persistent headache, may be migrainous, not responsive to narcotics', weight: 8, category: 'cns' },
   { id: 'cva', label: 'CVA', description: 'New onset cerebrovascular accident, exclude arteriosclerosis', weight: 8, category: 'cns' },
   // Vascular (8 points)
   { id: 'vasculitis', label: 'Vasculitis', description: 'Ulceration, gangrene, tender finger nodules, periungual infarction, splinter hemorrhages', weight: 8, category: 'vascular' },
   // Renal (4 points each)
   { id: 'urinary_casts', label: 'Urinary Casts', description: 'Heme-granular or RBC casts', weight: 4, category: 'renal' },
   { id: 'hematuria', label: 'Hematuria', description: '>5 RBC/HPF, exclude stone, infection, or other cause', weight: 4, category: 'renal' },
   { id: 'proteinuria', label: 'Proteinuria', description: '>0.5 g/24 hours, new onset or recent increase', weight: 4, category: 'renal' },
   { id: 'pyuria', label: 'Pyuria', description: '>5 WBC/HPF, exclude infection', weight: 4, category: 'renal' },
   // Musculoskeletal (4 points)
   { id: 'arthritis', label: 'Arthritis', description: '≥2 joints with pain and signs of inflammation', weight: 4, category: 'musculoskeletal' },
   // Mucocutaneous (2 points each)
   { id: 'rash', label: 'Rash', description: 'New or ongoing inflammatory rash', weight: 2, category: 'mucocutaneous' },
   { id: 'alopecia', label: 'Alopecia', description: 'New or ongoing abnormal, patchy or diffuse hair loss', weight: 2, category: 'mucocutaneous' },
   { id: 'mucosal_ulcers', label: 'Mucosal Ulcers', description: 'New or ongoing oral or nasal ulcers', weight: 2, category: 'mucocutaneous' },
   // Serositis (2 points each)
   { id: 'pleurisy', label: 'Pleurisy', description: 'Pleuritic chest pain with rub or effusion, or pleural thickening', weight: 2, category: 'serositis' },
   { id: 'pericarditis', label: 'Pericarditis', description: 'Pericardial pain with rub, effusion, or ECG/echo confirmation', weight: 2, category: 'serositis' },
   // Immunologic (2 points each)
   { id: 'low_complement', label: 'Low Complement', description: 'Decrease in CH50, C3, or C4 below lab normal', weight: 2, category: 'immunologic' },
   { id: 'increased_dna', label: 'Increased DNA Binding', description: '>25% binding by Farr assay or above normal range', weight: 2, category: 'immunologic' },
   // Constitutional (1 point each)
   { id: 'fever', label: 'Fever', description: '>38°C, exclude infection', weight: 1, category: 'constitutional' },
   { id: 'thrombocytopenia', label: 'Thrombocytopenia', description: '<100,000 platelets/mm³', weight: 1, category: 'constitutional' },
   { id: 'leukopenia', label: 'Leukopenia', description: '<3,000 WBC/mm³, exclude drug causes', weight: 1, category: 'constitutional' },
 ];
 
 const CATEGORY_LABELS: Record<string, string> = {
   cns: 'Central Nervous System',
   vascular: 'Vascular',
   renal: 'Renal',
   musculoskeletal: 'Musculoskeletal',
   mucocutaneous: 'Mucocutaneous',
   serositis: 'Serositis',
   immunologic: 'Immunologic',
   constitutional: 'Constitutional',
 };
 
 export function SLEDAICalculator() {
   const { user } = useAuth();
   const [checked, setChecked] = useState<Record<string, boolean>>({});
   const [result, setResult] = useState<number | null>(null);
 
   const handleCheck = (id: string, isChecked: boolean) => {
     setChecked(prev => ({ ...prev, [id]: isChecked }));
   };
 
   const calculate = () => {
     const total = SLEDAI_ITEMS.reduce((sum, item) => {
       return sum + (checked[item.id] ? item.weight : 0);
     }, 0);
     setResult(total);
   };
 
   const saveScore = async () => {
     if (!user || result === null) return;
     const { error } = await supabase.from('score_entries').insert({
       user_id: user.id,
       score_type: 'SLEDAI',
       data_json: checked as any,
       calculated_score: result,
     });
     if (error) toast.error('Failed to save score');
     else toast.success('SLEDAI score saved');
   };
 
   const getInterpretation = (score: number) => {
     if (score === 0) return { text: 'No Activity', color: 'text-success' };
     if (score <= 5) return { text: 'Mild Activity', color: 'text-info' };
     if (score <= 10) return { text: 'Moderate Activity', color: 'text-warning' };
     if (score <= 20) return { text: 'High Activity', color: 'text-orange-500' };
     return { text: 'Very High Activity', color: 'text-destructive' };
   };
 
   const reset = () => {
     setChecked({});
     setResult(null);
   };
 
   // Group items by category
   const groupedItems = SLEDAI_ITEMS.reduce((acc, item) => {
     if (!acc[item.category]) acc[item.category] = [];
     acc[item.category].push(item);
     return acc;
   }, {} as Record<string, SLEDAIItem[]>);
 
   return (
     <Card>
       <CardHeader>
         <CardTitle>SLEDAI-2K Calculator</CardTitle>
         <CardDescription>Systemic Lupus Erythematosus Disease Activity Index</CardDescription>
       </CardHeader>
       <CardContent>
         <div className="grid lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6 max-h-[600px] overflow-y-auto pr-2">
             {Object.entries(groupedItems).map(([category, items]) => (
               <div key={category} className="space-y-3">
                 <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-1">
                   {CATEGORY_LABELS[category]}
                 </h3>
                 <div className="space-y-2">
                   {items.map((item) => (
                     <div key={item.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                       <Checkbox
                         id={item.id}
                         checked={checked[item.id] || false}
                         onCheckedChange={(isChecked) => handleCheck(item.id, isChecked === true)}
                         className="mt-0.5"
                       />
                       <div className="flex-1 min-w-0">
                         <Label htmlFor={item.id} className="font-medium cursor-pointer flex items-center gap-2">
                           {item.label}
                           <span className="text-xs font-normal px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                             {item.weight}pt
                           </span>
                         </Label>
                         <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             ))}
           </div>
           
           <div className="flex flex-col">
             <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6 sticky top-0">
               {result !== null ? (
                 <>
                   <p className="text-sm text-muted-foreground mb-2">SLEDAI-2K Score</p>
                   <p className="text-5xl font-bold text-foreground">{result}</p>
                   <p className={`text-lg font-medium mt-2 ${getInterpretation(result).color}`}>
                     {getInterpretation(result).text}
                   </p>
                   <div className="flex gap-2 mt-4">
                     <Button variant="outline" size="sm" onClick={reset}>
                       Reset
                     </Button>
                     <Button variant="outline" size="sm" className="gap-2" onClick={saveScore}>
                       <Save className="h-4 w-4" />
                       Save
                     </Button>
                   </div>
                 </>
               ) : (
                 <p className="text-muted-foreground text-center">Select findings and calculate</p>
               )}
             </div>
             <div className="mt-4 space-y-2">
               <Button onClick={calculate} className="w-full gap-2">
                 <Calculator className="h-4 w-4" />
                 Calculate SLEDAI
               </Button>
             </div>
             <div className="mt-4 text-xs text-muted-foreground space-y-1">
               <p><strong>Score interpretation:</strong></p>
               <p>0 = No activity</p>
               <p>1-5 = Mild activity</p>
               <p>6-10 = Moderate activity</p>
               <p>11-20 = High activity</p>
               <p>&gt;20 = Very high activity</p>
             </div>
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }