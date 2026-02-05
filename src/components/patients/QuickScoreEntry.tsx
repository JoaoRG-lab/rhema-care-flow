 import { useState, useEffect } from 'react';
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { useLastScores, LastScoreData } from '@/hooks/useLastScores';
 import { Zap, RotateCcw, Save, Clock, ChevronRight } from 'lucide-react';
 import { toast } from 'sonner';
 import { format } from 'date-fns';
 
 interface QuickScoreEntryProps {
   patientId: string;
   patientCode: string;
   diagnosisTags?: string[] | null;
   onScoreSaved?: () => void;
 }
 
 type ScoreType = 'DAS28-ESR' | 'DAS28-CRP' | 'CDAI' | 'SDAI' | 'BASDAI' | 'DAPSA' | 'SLEDAI';
 
 interface ScoreConfig {
   name: string;
   fields: { key: string; label: string; min: number; max: number; step?: number }[];
   calculate: (data: Record<string, number>) => number;
   interpret: (score: number) => { text: string; color: string };
   relevantDiagnoses: string[];
 }
 
 const SCORE_CONFIGS: Record<ScoreType, ScoreConfig> = {
   'DAS28-ESR': {
     name: 'DAS28-ESR',
     fields: [
       { key: 'tjc', label: 'TJC28', min: 0, max: 28 },
       { key: 'sjc', label: 'SJC28', min: 0, max: 28 },
       { key: 'esr', label: 'ESR (mm/h)', min: 1, max: 150 },
       { key: 'globalHealth', label: 'Patient Global (0-100)', min: 0, max: 100 },
     ],
     calculate: (d) => 0.56 * Math.sqrt(d.tjc) + 0.28 * Math.sqrt(d.sjc) + 0.70 * Math.log(d.esr || 1) + 0.014 * d.globalHealth,
     interpret: (s) => {
       if (s < 2.6) return { text: 'Remission', color: 'bg-success/10 text-success' };
       if (s < 3.2) return { text: 'Low', color: 'bg-info/10 text-info' };
       if (s <= 5.1) return { text: 'Moderate', color: 'bg-warning/10 text-warning' };
       return { text: 'High', color: 'bg-destructive/10 text-destructive' };
     },
     relevantDiagnoses: ['RA', 'Rheumatoid Arthritis'],
   },
   'DAS28-CRP': {
     name: 'DAS28-CRP',
     fields: [
       { key: 'tjc', label: 'TJC28', min: 0, max: 28 },
       { key: 'sjc', label: 'SJC28', min: 0, max: 28 },
       { key: 'crp', label: 'CRP (mg/L)', min: 0, max: 200, step: 0.1 },
       { key: 'globalHealth', label: 'Patient Global (0-100)', min: 0, max: 100 },
     ],
     calculate: (d) => 0.56 * Math.sqrt(d.tjc) + 0.28 * Math.sqrt(d.sjc) + 0.36 * Math.log((d.crp || 0.1) + 1) + 0.014 * d.globalHealth + 0.96,
     interpret: (s) => {
       if (s < 2.6) return { text: 'Remission', color: 'bg-success/10 text-success' };
       if (s < 3.2) return { text: 'Low', color: 'bg-info/10 text-info' };
       if (s <= 5.1) return { text: 'Moderate', color: 'bg-warning/10 text-warning' };
       return { text: 'High', color: 'bg-destructive/10 text-destructive' };
     },
     relevantDiagnoses: ['RA', 'Rheumatoid Arthritis'],
   },
   'CDAI': {
     name: 'CDAI',
     fields: [
       { key: 'tjc', label: 'TJC28', min: 0, max: 28 },
       { key: 'sjc', label: 'SJC28', min: 0, max: 28 },
       { key: 'patientGlobal', label: 'Patient Global (0-10)', min: 0, max: 10, step: 0.5 },
       { key: 'physicianGlobal', label: 'Physician Global (0-10)', min: 0, max: 10, step: 0.5 },
     ],
     calculate: (d) => d.tjc + d.sjc + d.patientGlobal + d.physicianGlobal,
     interpret: (s) => {
       if (s <= 2.8) return { text: 'Remission', color: 'bg-success/10 text-success' };
       if (s <= 10) return { text: 'Low', color: 'bg-info/10 text-info' };
       if (s <= 22) return { text: 'Moderate', color: 'bg-warning/10 text-warning' };
       return { text: 'High', color: 'bg-destructive/10 text-destructive' };
     },
     relevantDiagnoses: ['RA', 'Rheumatoid Arthritis'],
   },
   'SDAI': {
     name: 'SDAI',
     fields: [
       { key: 'tjc', label: 'TJC28', min: 0, max: 28 },
       { key: 'sjc', label: 'SJC28', min: 0, max: 28 },
       { key: 'patientGlobal', label: 'Patient Global (0-10)', min: 0, max: 10, step: 0.5 },
       { key: 'physicianGlobal', label: 'Physician Global (0-10)', min: 0, max: 10, step: 0.5 },
       { key: 'crp', label: 'CRP (mg/dL)', min: 0, max: 10, step: 0.1 },
     ],
     calculate: (d) => d.tjc + d.sjc + d.patientGlobal + d.physicianGlobal + d.crp,
     interpret: (s) => {
       if (s <= 3.3) return { text: 'Remission', color: 'bg-success/10 text-success' };
       if (s <= 11) return { text: 'Low', color: 'bg-info/10 text-info' };
       if (s <= 26) return { text: 'Moderate', color: 'bg-warning/10 text-warning' };
       return { text: 'High', color: 'bg-destructive/10 text-destructive' };
     },
     relevantDiagnoses: ['RA', 'Rheumatoid Arthritis'],
   },
   'BASDAI': {
     name: 'BASDAI',
     fields: [
       { key: 'q1', label: 'Fatigue (0-10)', min: 0, max: 10, step: 0.5 },
       { key: 'q2', label: 'Spinal Pain (0-10)', min: 0, max: 10, step: 0.5 },
       { key: 'q3', label: 'Peripheral Joint Pain (0-10)', min: 0, max: 10, step: 0.5 },
       { key: 'q4', label: 'Enthesitis (0-10)', min: 0, max: 10, step: 0.5 },
       { key: 'q5', label: 'Morning Stiffness Severity (0-10)', min: 0, max: 10, step: 0.5 },
       { key: 'q6', label: 'Morning Stiffness Duration (0-10)', min: 0, max: 10, step: 0.5 },
     ],
     calculate: (d) => (d.q1 + d.q2 + d.q3 + d.q4 + (d.q5 + d.q6) / 2) / 5,
     interpret: (s) => {
       if (s < 4) return { text: 'Low/Inactive', color: 'bg-success/10 text-success' };
       return { text: 'High/Active', color: 'bg-destructive/10 text-destructive' };
     },
     relevantDiagnoses: ['AS', 'SpA', 'Ankylosing Spondylitis', 'Axial SpA', 'nr-axSpA'],
   },
   'DAPSA': {
     name: 'DAPSA',
     fields: [
       { key: 'tjc', label: 'Tender Joint Count (66)', min: 0, max: 66 },
       { key: 'sjc', label: 'Swollen Joint Count (68)', min: 0, max: 68 },
       { key: 'patientPain', label: 'Patient Pain VAS (0-10)', min: 0, max: 10, step: 0.5 },
       { key: 'patientGlobal', label: 'Patient Global (0-10)', min: 0, max: 10, step: 0.5 },
       { key: 'crp', label: 'CRP (mg/dL)', min: 0, max: 20, step: 0.1 },
     ],
     calculate: (d) => d.tjc + d.sjc + d.patientPain + d.patientGlobal + d.crp,
     interpret: (s) => {
       if (s <= 4) return { text: 'Remission', color: 'bg-success/10 text-success' };
       if (s <= 14) return { text: 'Low', color: 'bg-info/10 text-info' };
       if (s <= 28) return { text: 'Moderate', color: 'bg-warning/10 text-warning' };
       return { text: 'High', color: 'bg-destructive/10 text-destructive' };
     },
     relevantDiagnoses: ['PsA', 'Psoriatic Arthritis'],
   },
   'SLEDAI': {
     name: 'SLEDAI-2K',
     fields: [
       { key: 'seizure', label: 'Seizure (8 pts)', min: 0, max: 1 },
       { key: 'psychosis', label: 'Psychosis (8 pts)', min: 0, max: 1 },
       { key: 'organicBrain', label: 'Organic Brain (8 pts)', min: 0, max: 1 },
       { key: 'visualDisturbance', label: 'Visual Disturbance (8 pts)', min: 0, max: 1 },
       { key: 'cranialNerve', label: 'Cranial Nerve (8 pts)', min: 0, max: 1 },
       { key: 'lupusHeadache', label: 'Lupus Headache (8 pts)', min: 0, max: 1 },
       { key: 'cva', label: 'CVA (8 pts)', min: 0, max: 1 },
       { key: 'vasculitis', label: 'Vasculitis (8 pts)', min: 0, max: 1 },
       { key: 'arthritis', label: 'Arthritis (4 pts)', min: 0, max: 1 },
       { key: 'myositis', label: 'Myositis (4 pts)', min: 0, max: 1 },
       { key: 'urinaryCasts', label: 'Urinary Casts (4 pts)', min: 0, max: 1 },
       { key: 'hematuria', label: 'Hematuria (4 pts)', min: 0, max: 1 },
       { key: 'proteinuria', label: 'Proteinuria (4 pts)', min: 0, max: 1 },
       { key: 'pyuria', label: 'Pyuria (4 pts)', min: 0, max: 1 },
       { key: 'rash', label: 'Rash (2 pts)', min: 0, max: 1 },
       { key: 'alopecia', label: 'Alopecia (2 pts)', min: 0, max: 1 },
       { key: 'mucosalUlcers', label: 'Mucosal Ulcers (2 pts)', min: 0, max: 1 },
       { key: 'pleurisy', label: 'Pleurisy (2 pts)', min: 0, max: 1 },
       { key: 'pericarditis', label: 'Pericarditis (2 pts)', min: 0, max: 1 },
       { key: 'lowComplement', label: 'Low Complement (2 pts)', min: 0, max: 1 },
       { key: 'increasedDNA', label: 'Increased DNA Binding (2 pts)', min: 0, max: 1 },
       { key: 'fever', label: 'Fever (1 pt)', min: 0, max: 1 },
       { key: 'thrombocytopenia', label: 'Thrombocytopenia (1 pt)', min: 0, max: 1 },
       { key: 'leukopenia', label: 'Leukopenia (1 pt)', min: 0, max: 1 },
     ],
     calculate: (d) => {
       return (d.seizure || 0) * 8 + (d.psychosis || 0) * 8 + (d.organicBrain || 0) * 8 +
         (d.visualDisturbance || 0) * 8 + (d.cranialNerve || 0) * 8 + (d.lupusHeadache || 0) * 8 +
         (d.cva || 0) * 8 + (d.vasculitis || 0) * 8 + (d.arthritis || 0) * 4 + (d.myositis || 0) * 4 +
         (d.urinaryCasts || 0) * 4 + (d.hematuria || 0) * 4 + (d.proteinuria || 0) * 4 +
         (d.pyuria || 0) * 4 + (d.rash || 0) * 2 + (d.alopecia || 0) * 2 + (d.mucosalUlcers || 0) * 2 +
         (d.pleurisy || 0) * 2 + (d.pericarditis || 0) * 2 + (d.lowComplement || 0) * 2 +
         (d.increasedDNA || 0) * 2 + (d.fever || 0) * 1 + (d.thrombocytopenia || 0) * 1 +
         (d.leukopenia || 0) * 1;
     },
     interpret: (s) => {
       if (s === 0) return { text: 'Inactive', color: 'bg-success/10 text-success' };
       if (s <= 5) return { text: 'Mild', color: 'bg-info/10 text-info' };
       if (s <= 10) return { text: 'Moderate', color: 'bg-warning/10 text-warning' };
       return { text: 'High', color: 'bg-destructive/10 text-destructive' };
     },
     relevantDiagnoses: ['SLE', 'Lupus', 'Systemic Lupus'],
   },
 };
 
 export function QuickScoreEntry({ patientId, patientCode, diagnosisTags, onScoreSaved }: QuickScoreEntryProps) {
   const { user } = useAuth();
   const { lastScores, loading: loadingScores, getLastScore } = useLastScores(patientId);
   const [open, setOpen] = useState(false);
   const [selectedType, setSelectedType] = useState<ScoreType | ''>('');
   const [values, setValues] = useState<Record<string, number>>({});
   const [saving, setSaving] = useState(false);
   const [calculatedScore, setCalculatedScore] = useState<number | null>(null);
 
   // Determine recommended scores based on diagnosis
   const recommendedScores = Object.entries(SCORE_CONFIGS)
     .filter(([_, config]) => 
       config.relevantDiagnoses.some(d => 
         diagnosisTags?.some(tag => tag.toLowerCase().includes(d.toLowerCase()))
       )
     )
     .map(([key]) => key as ScoreType);
 
   // Reset values when score type changes
   useEffect(() => {
     if (!selectedType) {
       setValues({});
       setCalculatedScore(null);
       return;
     }
 
     const config = SCORE_CONFIGS[selectedType];
     const lastScore = getLastScore(selectedType);
     
     if (lastScore?.dataJson) {
       // Pre-fill with last score values
       const prefilled: Record<string, number> = {};
       config.fields.forEach(field => {
         prefilled[field.key] = lastScore.dataJson[field.key] ?? 0;
       });
       setValues(prefilled);
     } else {
       // Initialize with zeros
       const initial: Record<string, number> = {};
       config.fields.forEach(field => {
         initial[field.key] = 0;
       });
       setValues(initial);
     }
     setCalculatedScore(null);
   }, [selectedType, lastScores]);
 
   // Calculate score whenever values change
   useEffect(() => {
     if (!selectedType) return;
     const config = SCORE_CONFIGS[selectedType];
     const score = config.calculate(values);
     setCalculatedScore(Math.round(score * 100) / 100);
   }, [values, selectedType]);
 
   const handleValueChange = (key: string, value: number) => {
     setValues(prev => ({ ...prev, [key]: value }));
   };
 
   const handleQuickSave = async () => {
     if (!user || !selectedType || calculatedScore === null) return;
 
     setSaving(true);
     try {
       const { error } = await supabase.from('score_entries').insert({
         user_id: user.id,
         patient_card_id: patientId,
         score_type: selectedType,
         data_json: values as any,
         calculated_score: calculatedScore,
       });
 
       if (error) throw error;
 
       toast.success(`${selectedType} score saved`);
       setOpen(false);
       setSelectedType('');
       onScoreSaved?.();
     } catch (error) {
       console.error('Error saving score:', error);
       toast.error('Failed to save score');
     } finally {
       setSaving(false);
     }
   };
 
   const resetToLastValues = () => {
     if (!selectedType) return;
     const lastScore = getLastScore(selectedType);
     if (lastScore?.dataJson) {
       const config = SCORE_CONFIGS[selectedType];
       const prefilled: Record<string, number> = {};
       config.fields.forEach(field => {
         prefilled[field.key] = lastScore.dataJson[field.key] ?? 0;
       });
       setValues(prefilled);
     }
   };
 
   const lastScore = selectedType ? getLastScore(selectedType) : null;
   const config = selectedType ? SCORE_CONFIGS[selectedType] : null;
   const interpretation = config && calculatedScore !== null ? config.interpret(calculatedScore) : null;
 
   return (
     <Dialog open={open} onOpenChange={setOpen}>
       <DialogTrigger asChild>
         <Button variant="outline" className="gap-2">
           <Zap className="h-4 w-4" />
           Quick Score
         </Button>
       </DialogTrigger>
       <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Zap className="h-5 w-5 text-primary" />
             Quick Score Entry
           </DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4 mt-2">
           {/* Score Type Selection */}
           <div>
             <Label>Score Type</Label>
             <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ScoreType)}>
               <SelectTrigger className="mt-1">
                 <SelectValue placeholder="Select score type" />
               </SelectTrigger>
               <SelectContent>
                 {recommendedScores.length > 0 && (
                   <>
                     <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Recommended</div>
                     {recommendedScores.map(type => (
                       <SelectItem key={type} value={type}>
                         <div className="flex items-center gap-2">
                           {type}
                           {lastScores[type] && (
                             <Badge variant="secondary" className="text-xs">
                               Last: {lastScores[type].calculatedScore}
                             </Badge>
                           )}
                         </div>
                       </SelectItem>
                     ))}
                     <div className="border-t my-1" />
                   </>
                 )}
                 <div className="px-2 py-1 text-xs font-medium text-muted-foreground">All Scores</div>
                 {Object.keys(SCORE_CONFIGS).filter(k => !recommendedScores.includes(k as ScoreType)).map(type => (
                   <SelectItem key={type} value={type}>
                     <div className="flex items-center gap-2">
                       {type}
                       {lastScores[type] && (
                         <Badge variant="secondary" className="text-xs">
                           Last: {lastScores[type].calculatedScore}
                         </Badge>
                       )}
                     </div>
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
 
           {/* Pre-filled notice */}
           {selectedType && lastScore && (
             <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
               <div className="flex items-center gap-2 text-sm">
                 <Clock className="h-4 w-4 text-muted-foreground" />
                 <span className="text-muted-foreground">
                   Pre-filled from {format(new Date(lastScore.createdAt), 'MMM d, yyyy')}
                 </span>
               </div>
               <Button variant="ghost" size="sm" onClick={resetToLastValues} className="h-7 text-xs">
                 <RotateCcw className="h-3 w-3 mr-1" />
                 Reset
               </Button>
             </div>
           )}
 
           {/* Score Fields */}
           {config && (
             <div className="space-y-3">
               {config.fields.map(field => (
                 <div key={field.key} className="flex items-center gap-3">
                   <Label className="w-40 text-sm">{field.label}</Label>
                   <Input
                     type="number"
                     min={field.min}
                     max={field.max}
                     step={field.step || 1}
                     value={values[field.key] ?? 0}
                     onChange={(e) => handleValueChange(field.key, Number(e.target.value))}
                     className="flex-1"
                   />
                 </div>
               ))}
             </div>
           )}
 
           {/* Calculated Result */}
           {calculatedScore !== null && interpretation && (
             <div className="p-4 rounded-lg bg-card border text-center">
               <p className="text-sm text-muted-foreground mb-1">{selectedType} Score</p>
               <p className="text-4xl font-bold">{calculatedScore}</p>
               <Badge className={`mt-2 ${interpretation.color}`}>
                 {interpretation.text}
               </Badge>
               {lastScore && (
                 <div className="mt-3 text-sm text-muted-foreground flex items-center justify-center gap-1">
                   Previous: {lastScore.calculatedScore}
                   <ChevronRight className="h-3 w-3" />
                   {calculatedScore !== lastScore.calculatedScore && (
                     <span className={calculatedScore < lastScore.calculatedScore ? 'text-success' : 'text-destructive'}>
                       {calculatedScore < lastScore.calculatedScore ? '↓ Improved' : '↑ Worsened'}
                     </span>
                   )}
                   {calculatedScore === lastScore.calculatedScore && (
                     <span>Unchanged</span>
                   )}
                 </div>
               )}
             </div>
           )}
 
           {/* Save Button */}
           <Button 
             onClick={handleQuickSave} 
             disabled={!selectedType || calculatedScore === null || saving}
             className="w-full gap-2"
           >
             <Save className="h-4 w-4" />
             {saving ? 'Saving...' : 'Save Score'}
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   );
 }