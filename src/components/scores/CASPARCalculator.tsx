 import { useState } from 'react';
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Checkbox } from '@/components/ui/checkbox';
 import { Label } from '@/components/ui/label';
 import { Calculator, Save, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 import { addToHistory } from '@/lib/calculators';
 import { Alert, AlertDescription } from '@/components/ui/alert';
 
 interface CriteriaItem {
   id: string;
   label: string;
   description: string;
   points: number;
   category: 'psoriasis' | 'other';
   exclusive?: string[]; // IDs of mutually exclusive items
 }
 
 const CASPAR_CRITERIA: CriteriaItem[] = [
   {
     id: 'current-psoriasis',
     label: 'Current psoriasis',
     description: 'Psoriatic skin or scalp disease present today as judged by a rheumatologist or dermatologist',
     points: 2,
     category: 'psoriasis',
     exclusive: ['history-psoriasis', 'family-psoriasis'],
   },
   {
     id: 'history-psoriasis',
     label: 'Personal history of psoriasis',
     description: 'History of psoriasis obtained from patient, family physician, dermatologist, or rheumatologist',
     points: 1,
     category: 'psoriasis',
     exclusive: ['current-psoriasis', 'family-psoriasis'],
   },
   {
     id: 'family-psoriasis',
     label: 'Family history of psoriasis',
     description: 'History of psoriasis in a first- or second-degree relative',
     points: 1,
     category: 'psoriasis',
     exclusive: ['current-psoriasis', 'history-psoriasis'],
   },
   {
     id: 'dactylitis',
     label: 'Dactylitis',
     description: 'Current swelling of an entire digit, or history of dactylitis recorded by a rheumatologist',
     points: 1,
     category: 'other',
   },
   {
     id: 'juxta-articular',
     label: 'Juxta-articular new bone formation',
     description: 'Ill-defined ossification near joint margins (excluding osteophytes) on hand or foot X-ray',
     points: 1,
     category: 'other',
   },
   {
     id: 'rf-negative',
     label: 'Rheumatoid factor negative',
     description: 'Negative RF by any method except latex (preferably ELISA or nephelometry)',
     points: 1,
     category: 'other',
   },
   {
     id: 'nail-dystrophy',
     label: 'Nail dystrophy',
     description: 'Typical psoriatic nail dystrophy: onycholysis, pitting, hyperkeratosis on current exam',
     points: 1,
     category: 'other',
   },
 ];
 
 export function CASPARCalculator() {
   const { user } = useAuth();
   const [hasInflammatoryDisease, setHasInflammatoryDisease] = useState(false);
   const [selectedCriteria, setSelectedCriteria] = useState<Set<string>>(new Set());
   const [result, setResult] = useState<{ score: number; classification: boolean } | null>(null);
   const [isSaving, setIsSaving] = useState(false);
 
   const handleCriteriaChange = (criteriaId: string, checked: boolean) => {
     const newSelected = new Set(selectedCriteria);
     const criteria = CASPAR_CRITERIA.find(c => c.id === criteriaId);
     
     if (checked) {
       // Remove mutually exclusive items (for psoriasis category)
       if (criteria?.exclusive) {
         criteria.exclusive.forEach(id => newSelected.delete(id));
       }
       newSelected.add(criteriaId);
     } else {
       newSelected.delete(criteriaId);
     }
     
     setSelectedCriteria(newSelected);
   };
 
   const calculate = () => {
     let score = 0;
     
     selectedCriteria.forEach(id => {
       const criteria = CASPAR_CRITERIA.find(c => c.id === id);
       if (criteria) {
         score += criteria.points;
       }
     });
     
     // CASPAR classification: inflammatory articular disease + ≥3 points
     const classification = hasInflammatoryDisease && score >= 3;
     
     setResult({ score, classification });
     
     addToHistory({
       calculatorId: 'caspar',
       score: score,
       inputs: {
         hasInflammatoryDisease: hasInflammatoryDisease ? 'true' : 'false',
         criteria: Array.from(selectedCriteria).join(','),
       },
     });
   };
 
   const saveScore = async () => {
     if (!user || result === null) return;
     setIsSaving(true);
     
     try {
       const { error } = await supabase.from('score_entries').insert({
         user_id: user.id,
         score_type: 'CASPAR',
         data_json: {
           hasInflammatoryDisease,
           selectedCriteria: Array.from(selectedCriteria),
         } as any,
         calculated_score: result.score,
       });
       
       if (error) throw error;
       toast.success('CASPAR result saved');
     } catch (error) {
       console.error('Error saving score:', error);
       toast.error('Failed to save result');
     } finally {
       setIsSaving(false);
     }
   };
 
   const resetForm = () => {
     setHasInflammatoryDisease(false);
     setSelectedCriteria(new Set());
     setResult(null);
   };
 
   const psoriasisCriteria = CASPAR_CRITERIA.filter(c => c.category === 'psoriasis');
   const otherCriteria = CASPAR_CRITERIA.filter(c => c.category === 'other');
 
   return (
     <Card>
       <CardHeader>
         <div className="flex items-start justify-between">
           <div>
             <CardTitle className="flex items-center gap-2">
               CASPAR Criteria for Psoriatic Arthritis
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger>
                     <Info className="h-4 w-4 text-muted-foreground" />
                   </TooltipTrigger>
                   <TooltipContent className="max-w-xs">
                     <p className="font-medium mb-1">Classification Criteria:</p>
                     <p className="text-xs">Inflammatory articular disease (joint, spine, or entheseal) with ≥3 points from the criteria below.</p>
                     <p className="text-xs mt-2">Sensitivity: 91.4%, Specificity: 98.7%</p>
                   </TooltipContent>
                 </Tooltip>
               </TooltipProvider>
             </CardTitle>
             <CardDescription>
               Classification of Psoriatic Arthritis (Taylor et al., 2006)
             </CardDescription>
           </div>
         </div>
       </CardHeader>
       <CardContent>
         <div className="grid lg:grid-cols-3 gap-6">
           {/* Entry Criterion */}
           <div className="lg:col-span-2 space-y-6">
             <div className="p-4 border rounded-lg bg-muted/30">
               <div className="flex items-start gap-3">
                 <Checkbox
                   id="inflammatory-disease"
                   checked={hasInflammatoryDisease}
                   onCheckedChange={(checked) => setHasInflammatoryDisease(checked === true)}
                 />
                 <div className="space-y-1">
                   <Label htmlFor="inflammatory-disease" className="text-base font-semibold cursor-pointer">
                     Inflammatory Articular Disease (Required)
                   </Label>
                   <p className="text-sm text-muted-foreground">
                     Evidence of current synovitis, enthesitis, or inflammatory spinal disease
                   </p>
                 </div>
               </div>
             </div>
 
             {/* Psoriasis Evidence (mutually exclusive) */}
             <div className="space-y-3">
               <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                 Psoriasis Evidence (select highest applicable)
               </h3>
               <div className="space-y-2">
                 {psoriasisCriteria.map((criteria) => (
                   <div
                     key={criteria.id}
                     className={`p-3 border rounded-lg transition-colors ${
                       selectedCriteria.has(criteria.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                     }`}
                   >
                     <div className="flex items-start gap-3">
                       <Checkbox
                         id={criteria.id}
                         checked={selectedCriteria.has(criteria.id)}
                         onCheckedChange={(checked) => handleCriteriaChange(criteria.id, checked === true)}
                       />
                       <div className="flex-1 space-y-1">
                         <div className="flex items-center justify-between">
                           <Label htmlFor={criteria.id} className="cursor-pointer font-medium">
                             {criteria.label}
                           </Label>
                           <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                             +{criteria.points} pt{criteria.points > 1 ? 's' : ''}
                           </span>
                         </div>
                         <p className="text-xs text-muted-foreground">{criteria.description}</p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
 
             {/* Other Criteria */}
             <div className="space-y-3">
               <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                 Additional Criteria
               </h3>
               <div className="space-y-2">
                 {otherCriteria.map((criteria) => (
                   <div
                     key={criteria.id}
                     className={`p-3 border rounded-lg transition-colors ${
                       selectedCriteria.has(criteria.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                     }`}
                   >
                     <div className="flex items-start gap-3">
                       <Checkbox
                         id={criteria.id}
                         checked={selectedCriteria.has(criteria.id)}
                         onCheckedChange={(checked) => handleCriteriaChange(criteria.id, checked === true)}
                       />
                       <div className="flex-1 space-y-1">
                         <div className="flex items-center justify-between">
                           <Label htmlFor={criteria.id} className="cursor-pointer font-medium">
                             {criteria.label}
                           </Label>
                           <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                             +{criteria.points} pt
                           </span>
                         </div>
                         <p className="text-xs text-muted-foreground">{criteria.description}</p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
 
             <div className="flex gap-2">
               <Button onClick={calculate} className="flex-1 gap-2">
                 <Calculator className="h-4 w-4" />
                 Evaluate CASPAR
               </Button>
               <Button variant="outline" onClick={resetForm}>
                 Reset
               </Button>
             </div>
           </div>
 
           {/* Results Panel */}
           <div className={`flex flex-col rounded-lg p-6 ${
             result !== null 
               ? result.classification 
                 ? 'bg-success/10' 
                 : 'bg-muted/50'
               : 'bg-muted/50'
           }`}>
             {result !== null ? (
               <>
                 <p className="text-sm text-muted-foreground mb-2">Total Score</p>
                 <p className="text-5xl font-bold text-foreground">{result.score}</p>
                 <p className="text-sm text-muted-foreground mt-1">of 6 possible points</p>
                 
                 <div className="mt-4">
                   {result.classification ? (
                     <Alert className="border-success bg-success/10">
                       <CheckCircle2 className="h-4 w-4 text-success" />
                       <AlertDescription className="text-success font-medium">
                         Meets CASPAR Criteria for PsA
                       </AlertDescription>
                     </Alert>
                   ) : (
                     <Alert>
                       <AlertCircle className="h-4 w-4" />
                       <AlertDescription>
                         {!hasInflammatoryDisease 
                           ? 'Requires inflammatory articular disease'
                           : `Needs ≥3 points (currently ${result.score})`
                         }
                       </AlertDescription>
                     </Alert>
                   )}
                 </div>
 
                 <div className="mt-4 text-xs text-muted-foreground space-y-1">
                   <p className="font-medium">Classification requires:</p>
                   <p>• Inflammatory articular disease</p>
                   <p>• Score ≥ 3 points</p>
                 </div>
                 
                 <Button 
                   variant="outline" 
                   size="sm" 
                   className="mt-4 gap-2" 
                   onClick={saveScore}
                   disabled={isSaving}
                 >
                   <Save className="h-4 w-4" />
                   {isSaving ? 'Saving...' : 'Save Result'}
                 </Button>
               </>
             ) : (
               <div className="text-center flex-1 flex flex-col justify-center">
                 <p className="text-muted-foreground">Select criteria and evaluate</p>
                 <p className="text-xs text-muted-foreground mt-2">
                   CASPAR has 91.4% sensitivity and 98.7% specificity
                 </p>
               </div>
             )}
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }