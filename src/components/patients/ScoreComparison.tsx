 import { useState, useMemo } from 'react';
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { 
   ArrowDown, 
   ArrowUp, 
   Minus, 
   TrendingDown, 
   TrendingUp, 
   Activity,
   ArrowRightLeft,
   Info
 } from 'lucide-react';
 import { format } from 'date-fns';
 import { cn } from '@/lib/utils';
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
 import type { ScoreEntry } from '@/types/clinical';
 
 interface ScoreComparisonProps {
   scores: ScoreEntry[];
   scoreType?: string;
 }
 
 // Clinical thresholds for disease activity states
 const SCORE_THRESHOLDS: Record<string, { 
   remission: number; 
   low: number; 
   moderate: number;
   mcid: number;
   unit: string;
 }> = {
   'DAS28-ESR': { remission: 2.6, low: 3.2, moderate: 5.1, mcid: 1.2, unit: '' },
   'DAS28-CRP': { remission: 2.6, low: 3.2, moderate: 5.1, mcid: 1.2, unit: '' },
   'CDAI': { remission: 2.8, low: 10, moderate: 22, mcid: 6, unit: '' },
   'SDAI': { remission: 3.3, low: 11, moderate: 26, mcid: 7, unit: '' },
   'BASDAI': { remission: 2, low: 4, moderate: 6, mcid: 1, unit: '' },
   'SLEDAI': { remission: 0, low: 4, moderate: 10, mcid: 4, unit: '' },
   'DAPSA': { remission: 4, low: 14, moderate: 28, mcid: 6.6, unit: '' },
   'MDA': { remission: 5, low: 5, moderate: 5, mcid: 1, unit: '/7 criteria' },
 };
 
 // EULAR response criteria for DAS28
 const getEULARResponse = (baseline: number, current: number): {
   response: 'good' | 'moderate' | 'none';
   label: string;
   color: string;
   description: string;
 } => {
   const improvement = baseline - current;
   
   if (current <= 3.2 && improvement > 1.2) {
     return { 
       response: 'good', 
       label: 'Good Response',
       color: 'text-success',
       description: 'Low disease activity achieved with >1.2 improvement'
     };
   }
   if (current <= 3.2 && improvement > 0.6) {
     return { 
       response: 'moderate', 
       label: 'Moderate Response',
       color: 'text-info',
       description: 'Low disease activity with 0.6-1.2 improvement'
     };
   }
   if (improvement > 1.2 && current > 3.2 && current <= 5.1) {
     return { 
       response: 'moderate', 
       label: 'Moderate Response',
       color: 'text-info',
       description: '>1.2 improvement but still moderate activity'
     };
   }
   if (improvement > 0.6 && improvement <= 1.2 && current <= 5.1) {
     return { 
       response: 'moderate', 
       label: 'Moderate Response',
       color: 'text-info',
       description: '0.6-1.2 improvement with moderate activity'
     };
   }
   return { 
     response: 'none', 
     label: 'No Response',
     color: 'text-destructive',
     description: '<0.6 improvement or high disease activity persists'
   };
 };
 
 const getActivityState = (score: number, scoreType: string): {
   state: 'remission' | 'low' | 'moderate' | 'high';
   label: string;
   color: string;
   bg: string;
 } => {
   const thresholds = SCORE_THRESHOLDS[scoreType];
   if (!thresholds) {
     return { state: 'moderate', label: 'Unknown', color: 'text-muted-foreground', bg: 'bg-muted' };
   }
   
   if (score < thresholds.remission) {
     return { state: 'remission', label: 'Remission', color: 'text-success', bg: 'bg-success/10' };
   }
   if (score < thresholds.low) {
     return { state: 'low', label: 'Low Activity', color: 'text-info', bg: 'bg-info/10' };
   }
   if (score <= thresholds.moderate) {
     return { state: 'moderate', label: 'Moderate Activity', color: 'text-warning', bg: 'bg-warning/10' };
   }
   return { state: 'high', label: 'High Activity', color: 'text-destructive', bg: 'bg-destructive/10' };
 };
 
 export function ScoreComparison({ scores, scoreType }: ScoreComparisonProps) {
   const scoreTypes = useMemo(() => [...new Set(scores.map(s => s.score_type))], [scores]);
   const [selectedType, setSelectedType] = useState(scoreType || scoreTypes[0] || '');
   const [baselineId, setBaselineId] = useState<string>('');
   const [comparisonId, setComparisonId] = useState<string>('');
 
   const filteredScores = useMemo(() => 
     scores
       .filter(s => s.score_type === selectedType)
       .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
     [scores, selectedType]
   );
 
   // Auto-select latest two scores when type changes
   useMemo(() => {
     if (filteredScores.length >= 2) {
       setComparisonId(filteredScores[0].id);
       setBaselineId(filteredScores[1].id);
     } else if (filteredScores.length === 1) {
       setBaselineId(filteredScores[0].id);
       setComparisonId('');
     } else {
       setBaselineId('');
       setComparisonId('');
     }
   }, [filteredScores]);
 
   const baselineScore = filteredScores.find(s => s.id === baselineId);
   const comparisonScore = filteredScores.find(s => s.id === comparisonId);
 
   const comparison = useMemo(() => {
     if (!baselineScore || !comparisonScore) return null;
     
     const delta = comparisonScore.calculated_score - baselineScore.calculated_score;
     const percentChange = baselineScore.calculated_score !== 0 
       ? ((delta / baselineScore.calculated_score) * 100)
       : 0;
     
     const thresholds = SCORE_THRESHOLDS[selectedType];
     const mcidAchieved = thresholds ? Math.abs(delta) >= thresholds.mcid : false;
     
     const baselineState = getActivityState(baselineScore.calculated_score, selectedType);
     const comparisonState = getActivityState(comparisonScore.calculated_score, selectedType);
     
     const stateChanged = baselineState.state !== comparisonState.state;
     const improved = delta < 0;
     const worsened = delta > 0;
     
     // EULAR response for DAS28
     const eularResponse = selectedType.startsWith('DAS28') 
       ? getEULARResponse(baselineScore.calculated_score, comparisonScore.calculated_score)
       : null;
     
     return {
       delta,
       percentChange,
       mcidAchieved,
       baselineState,
       comparisonState,
       stateChanged,
       improved,
       worsened,
       eularResponse,
       daysBetween: Math.round(
         (new Date(comparisonScore.created_at).getTime() - new Date(baselineScore.created_at).getTime()) 
         / (1000 * 60 * 60 * 24)
       ),
     };
   }, [baselineScore, comparisonScore, selectedType]);
 
   if (scores.length === 0) {
     return (
       <Card>
         <CardContent className="py-8 text-center text-muted-foreground">
           <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
           <p>No scores available for comparison</p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader>
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
           <div>
             <CardTitle className="text-base flex items-center gap-2">
               <ArrowRightLeft className="h-4 w-4 text-primary" />
               Score Comparison
             </CardTitle>
             <CardDescription>Compare disease activity between visits</CardDescription>
           </div>
           <Select value={selectedType} onValueChange={setSelectedType}>
             <SelectTrigger className="w-[160px]">
               <SelectValue placeholder="Select score" />
             </SelectTrigger>
             <SelectContent>
               {scoreTypes.map(type => (
                 <SelectItem key={type} value={type}>{type}</SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
       </CardHeader>
       <CardContent className="space-y-4">
         {/* Date Selectors */}
         <div className="grid grid-cols-2 gap-3">
           <div>
             <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
               Baseline (earlier)
             </label>
             <Select value={baselineId} onValueChange={setBaselineId}>
               <SelectTrigger className="w-full">
                 <SelectValue placeholder="Select date" />
               </SelectTrigger>
               <SelectContent>
                 {filteredScores.map(s => (
                   <SelectItem key={s.id} value={s.id} disabled={s.id === comparisonId}>
                     {format(new Date(s.created_at), 'MMM d, yyyy')} — {s.calculated_score}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
           <div>
             <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
               Follow-up (later)
             </label>
             <Select value={comparisonId} onValueChange={setComparisonId}>
               <SelectTrigger className="w-full">
                 <SelectValue placeholder="Select date" />
               </SelectTrigger>
               <SelectContent>
                 {filteredScores.map(s => (
                   <SelectItem key={s.id} value={s.id} disabled={s.id === baselineId}>
                     {format(new Date(s.created_at), 'MMM d, yyyy')} — {s.calculated_score}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
         </div>
 
         {/* Comparison Results */}
         {comparison && baselineScore && comparisonScore && (
           <div className="space-y-4">
             {/* Score Cards */}
             <div className="grid grid-cols-3 gap-2">
               {/* Baseline */}
               <div className={cn("rounded-lg p-3 text-center", comparison.baselineState.bg)}>
                 <p className="text-xs text-muted-foreground mb-1">Baseline</p>
                 <p className="text-2xl font-bold">{baselineScore.calculated_score}</p>
                 <p className={cn("text-xs font-medium", comparison.baselineState.color)}>
                   {comparison.baselineState.label}
                 </p>
                 <p className="text-[10px] text-muted-foreground mt-1">
                   {format(new Date(baselineScore.created_at), 'MMM d')}
                 </p>
               </div>
 
               {/* Delta */}
               <div className="rounded-lg p-3 text-center bg-muted/50 flex flex-col items-center justify-center">
                 <div className={cn(
                   "flex items-center gap-1 text-xl font-bold",
                   comparison.improved ? "text-success" : comparison.worsened ? "text-destructive" : "text-muted-foreground"
                 )}>
                   {comparison.improved ? (
                     <TrendingDown className="h-5 w-5" />
                   ) : comparison.worsened ? (
                     <TrendingUp className="h-5 w-5" />
                   ) : (
                     <Minus className="h-5 w-5" />
                   )}
                   {comparison.delta > 0 ? '+' : ''}{comparison.delta.toFixed(1)}
                 </div>
                 <p className="text-xs text-muted-foreground">
                   {comparison.percentChange > 0 ? '+' : ''}{comparison.percentChange.toFixed(0)}%
                 </p>
                 <p className="text-[10px] text-muted-foreground mt-1">
                   {comparison.daysBetween} days
                 </p>
               </div>
 
               {/* Follow-up */}
               <div className={cn("rounded-lg p-3 text-center", comparison.comparisonState.bg)}>
                 <p className="text-xs text-muted-foreground mb-1">Follow-up</p>
                 <p className="text-2xl font-bold">{comparisonScore.calculated_score}</p>
                 <p className={cn("text-xs font-medium", comparison.comparisonState.color)}>
                   {comparison.comparisonState.label}
                 </p>
                 <p className="text-[10px] text-muted-foreground mt-1">
                   {format(new Date(comparisonScore.created_at), 'MMM d')}
                 </p>
               </div>
             </div>
 
             {/* Clinical Interpretation */}
             <div className="space-y-2">
               {/* MCID Badge */}
               <div className="flex flex-wrap gap-2">
                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Badge 
                         variant={comparison.mcidAchieved ? "default" : "outline"}
                         className={cn(
                           "cursor-help",
                           comparison.mcidAchieved && comparison.improved && "bg-success hover:bg-success/80",
                           comparison.mcidAchieved && comparison.worsened && "bg-destructive hover:bg-destructive/80"
                         )}
                       >
                         {comparison.mcidAchieved ? '✓ ' : ''}MCID {comparison.mcidAchieved ? 'Achieved' : 'Not Met'}
                       </Badge>
                     </TooltipTrigger>
                     <TooltipContent>
                       <p className="font-medium">Minimal Clinically Important Difference</p>
                       <p className="text-xs text-muted-foreground">
                         {selectedType}: ≥{SCORE_THRESHOLDS[selectedType]?.mcid || '?'} change needed
                       </p>
                     </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>
 
                 {comparison.stateChanged && (
                   <Badge 
                     variant="outline"
                     className={cn(
                       comparison.improved 
                         ? "border-success text-success bg-success/10" 
                         : "border-destructive text-destructive bg-destructive/10"
                     )}
                   >
                     {comparison.improved ? '↑' : '↓'} State Changed
                   </Badge>
                 )}
               </div>
 
               {/* EULAR Response (for DAS28) */}
               {comparison.eularResponse && (
                 <div className={cn(
                   "rounded-lg p-3 border",
                   comparison.eularResponse.response === 'good' && "bg-success/10 border-success/30",
                   comparison.eularResponse.response === 'moderate' && "bg-info/10 border-info/30",
                   comparison.eularResponse.response === 'none' && "bg-destructive/10 border-destructive/30"
                 )}>
                   <div className="flex items-center gap-2 mb-1">
                     <span className={cn("font-medium text-sm", comparison.eularResponse.color)}>
                       EULAR: {comparison.eularResponse.label}
                     </span>
                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger>
                           <Info className="h-3.5 w-3.5 text-muted-foreground" />
                         </TooltipTrigger>
                         <TooltipContent className="max-w-xs">
                           <p className="text-xs">{comparison.eularResponse.description}</p>
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                   </div>
                   <p className="text-xs text-muted-foreground">
                     {comparison.eularResponse.description}
                   </p>
                 </div>
               )}
 
               {/* Clinical Summary */}
               <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                 <p>
                   {comparison.improved ? (
                     <>
                       <span className="text-success font-medium">Improvement</span> of{' '}
                       {Math.abs(comparison.delta).toFixed(1)} points ({Math.abs(comparison.percentChange).toFixed(0)}%)
                       over {comparison.daysBetween} days.
                       {comparison.mcidAchieved && ' This exceeds the minimal clinically important difference.'}
                     </>
                   ) : comparison.worsened ? (
                     <>
                       <span className="text-destructive font-medium">Worsening</span> of{' '}
                       {Math.abs(comparison.delta).toFixed(1)} points ({Math.abs(comparison.percentChange).toFixed(0)}%)
                       over {comparison.daysBetween} days.
                       {comparison.mcidAchieved && ' This represents a clinically meaningful change.'}
                     </>
                   ) : (
                     <>
                       <span className="font-medium">Stable</span> disease activity over {comparison.daysBetween} days.
                     </>
                   )}
                 </p>
               </div>
             </div>
           </div>
         )}
 
         {(!baselineScore || !comparisonScore) && filteredScores.length < 2 && (
           <div className="text-center py-6 text-muted-foreground text-sm">
             <p>Need at least 2 {selectedType} scores to compare</p>
             <p className="text-xs mt-1">Currently have {filteredScores.length} score(s)</p>
           </div>
         )}
       </CardContent>
     </Card>
   );
 }