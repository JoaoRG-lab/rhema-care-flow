 import { useEffect, useState, useMemo } from 'react';
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { format, parseISO, differenceInDays } from 'date-fns';
 import { 
   Activity, 
   Pill, 
   TrendingDown, 
   TrendingUp, 
   Minus,
   Calendar,
   ArrowRight,
   Syringe,
   AlertTriangle
 } from 'lucide-react';
 import { 
   ComposedChart, 
   Line, 
   XAxis, 
   YAxis, 
   CartesianGrid, 
   Tooltip, 
   Legend, 
   ResponsiveContainer,
   ReferenceLine,
   Scatter,
   ReferenceArea
 } from 'recharts';
 import { cn } from '@/lib/utils';
 import type { ScoreEntry, Visit } from '@/types/clinical';
 
 interface TreatmentResponseTimelineProps {
   patientId: string;
   refreshKey?: number;
   patientCode?: string;
 }
 
 interface TherapyEvent {
   id: string;
   date: string;
   type: 'started' | 'adjusted' | 'stopped';
   description: string;
   visitId?: string;
 }
 
 interface TimelineDataPoint {
   date: string;
   dateFormatted: string;
   timestamp: number;
   [key: string]: any; // score types as keys
 }
 
 const SCORE_COLORS: Record<string, string> = {
   'DAS28-ESR': 'hsl(var(--chart-1))',
   'DAS28-CRP': 'hsl(var(--chart-2))',
   'CDAI': 'hsl(var(--chart-3))',
   'SDAI': 'hsl(var(--chart-4))',
   'BASDAI': 'hsl(var(--chart-5))',
   'SLEDAI': 'hsl(var(--primary))',
   'DAPSA': 'hsl(var(--info))',
   'ACR-Response': 'hsl(var(--success))',
 };
 
 const THERAPY_EVENT_COLORS = {
   started: 'bg-success text-success-foreground',
   adjusted: 'bg-warning text-warning-foreground',
   stopped: 'bg-destructive text-destructive-foreground',
 };
 
 const THERAPY_EVENT_ICONS = {
   started: Pill,
   adjusted: Syringe,
   stopped: AlertTriangle,
 };
 
 export function TreatmentResponseTimeline({ patientId, refreshKey, patientCode }: TreatmentResponseTimelineProps) {
   const { user } = useAuth();
   const [scores, setScores] = useState<ScoreEntry[]>([]);
   const [visits, setVisits] = useState<Visit[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     if (!user) return;
 
     const fetchData = async () => {
       setLoading(true);
 
       // Fetch scores and visits in parallel
       const [scoresResult, visitsResult] = await Promise.all([
         supabase
           .from('score_entries_secure')
           .select('id, score_type, calculated_score, created_at')
           .eq('patient_card_id', patientId)
           .eq('user_id', user.id)
           .order('created_at', { ascending: true }),
         supabase
           .from('visits_secure')
           .select('id, visit_date, actions, disease_activity')
           .eq('patient_card_id', patientId)
           .eq('user_id', user.id)
           .order('visit_date', { ascending: true }),
       ]);
 
       if (scoresResult.data) setScores(scoresResult.data as ScoreEntry[]);
       if (visitsResult.data) setVisits(visitsResult.data as Visit[]);
       setLoading(false);
     };
 
     fetchData();
   }, [user, patientId, refreshKey]);
 
   // Extract therapy events from visits
   const therapyEvents = useMemo((): TherapyEvent[] => {
     const events: TherapyEvent[] = [];
     
     visits.forEach((visit) => {
       if (!visit.actions) return;
       
       visit.actions.forEach((action, idx) => {
         let type: TherapyEvent['type'] | null = null;
         
         if (action.toLowerCase().includes('started')) {
           type = 'started';
         } else if (action.toLowerCase().includes('adjusted') || action.toLowerCase().includes('changed')) {
           type = 'adjusted';
         } else if (action.toLowerCase().includes('stopped') || action.toLowerCase().includes('discontinued')) {
           type = 'stopped';
         }
         
         if (type) {
           events.push({
             id: `${visit.id}-${idx}`,
             date: visit.visit_date,
             type,
             description: action,
             visitId: visit.id,
           });
         }
       });
     });
     
     return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
   }, [visits]);
 
   // Get unique score types
   const scoreTypes = useMemo(() => [...new Set(scores.map(s => s.score_type))], [scores]);
 
   // Prepare timeline data for chart
   const chartData = useMemo(() => {
     const dataMap = new Map<string, TimelineDataPoint>();
     
     // Add scores to data
     scores.forEach((score) => {
       const dateKey = format(new Date(score.created_at), 'yyyy-MM-dd');
       const existing = dataMap.get(dateKey);
       
       if (existing) {
         existing[score.score_type] = score.calculated_score;
       } else {
         dataMap.set(dateKey, {
           date: dateKey,
           dateFormatted: format(new Date(score.created_at), 'MMM d'),
           timestamp: new Date(score.created_at).getTime(),
           [score.score_type]: score.calculated_score,
         });
       }
     });
     
     // Add therapy event markers
     therapyEvents.forEach((event) => {
       const dateKey = event.date;
       const existing = dataMap.get(dateKey);
       
       if (existing) {
         existing.therapyEvent = event;
       } else {
         dataMap.set(dateKey, {
           date: dateKey,
           dateFormatted: format(new Date(dateKey), 'MMM d'),
           timestamp: new Date(dateKey).getTime(),
           therapyEvent: event,
         });
       }
     });
     
     return Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
   }, [scores, therapyEvents]);
 
   // Calculate response summary between therapy events
   const responseSummary = useMemo(() => {
     if (therapyEvents.length === 0 || scores.length < 2) return null;
     
     const summaries: Array<{
       event: TherapyEvent;
       scoreBefore: number | null;
       scoreAfter: number | null;
       scoreType: string;
       change: number | null;
       daysToResponse: number | null;
     }> = [];
     
     therapyEvents.forEach((event) => {
       const eventDate = new Date(event.date);
       
       // Find the primary score type (most common)
       const primaryScoreType = scoreTypes[0];
       if (!primaryScoreType) return;
       
       const typeScores = scores.filter(s => s.score_type === primaryScoreType);
       
       // Find score closest before and after the therapy event
       const scoresBefore = typeScores.filter(s => new Date(s.created_at) <= eventDate);
       const scoresAfter = typeScores.filter(s => new Date(s.created_at) > eventDate);
       
       const scoreBefore = scoresBefore.length > 0 
         ? scoresBefore[scoresBefore.length - 1].calculated_score 
         : null;
       const scoreAfterEntry = scoresAfter.length > 0 ? scoresAfter[0] : null;
       const scoreAfter = scoreAfterEntry?.calculated_score ?? null;
       
       summaries.push({
         event,
         scoreBefore,
         scoreAfter,
         scoreType: primaryScoreType,
         change: scoreBefore !== null && scoreAfter !== null 
           ? scoreAfter - scoreBefore 
           : null,
         daysToResponse: scoreAfterEntry 
           ? differenceInDays(new Date(scoreAfterEntry.created_at), eventDate)
           : null,
       });
     });
     
     return summaries;
   }, [therapyEvents, scores, scoreTypes]);
 
   // Custom tooltip
   const CustomTooltip = ({ active, payload, label }: any) => {
     if (!active || !payload) return null;
     
     const therapyEvent = payload.find((p: any) => p.payload.therapyEvent)?.payload?.therapyEvent;
     
     return (
       <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
         <p className="text-sm font-medium mb-2">{label}</p>
         {payload
           .filter((p: any) => p.value !== undefined && p.dataKey !== 'therapyEvent')
           .map((entry: any, idx: number) => (
             <div key={idx} className="flex items-center gap-2 text-sm">
               <div 
                 className="w-2 h-2 rounded-full" 
                 style={{ backgroundColor: entry.stroke }}
               />
               <span className="text-muted-foreground">{entry.dataKey}:</span>
               <span className="font-medium">{entry.value?.toFixed(1)}</span>
             </div>
           ))}
         {therapyEvent && (
           <div className="mt-2 pt-2 border-t border-border">
             <div className="flex items-center gap-1.5">
               <Pill className="h-3 w-3 text-primary" />
               <span className="text-xs font-medium">{therapyEvent.description}</span>
             </div>
           </div>
         )}
       </div>
     );
   };
 
   if (loading) {
     return (
       <Card>
         <CardContent className="py-8 text-center text-muted-foreground">
           Loading timeline...
         </CardContent>
       </Card>
     );
   }
 
   if (scores.length === 0 && therapyEvents.length === 0) {
     return (
       <Card>
         <CardContent className="py-12 text-center">
           <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
           <p className="text-muted-foreground">No treatment response data yet</p>
           <p className="text-sm text-muted-foreground mt-1">
             Record scores and medication changes to see the timeline
           </p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <div className="space-y-6">
       {/* Timeline Chart */}
       <Card>
         <CardHeader>
           <CardTitle className="text-base flex items-center gap-2">
             <Activity className="h-4 w-4 text-primary" />
             Treatment Response Timeline
           </CardTitle>
           <CardDescription>
             Disease activity scores with therapy change markers
           </CardDescription>
         </CardHeader>
         <CardContent>
           <div className="h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                 <XAxis 
                   dataKey="dateFormatted" 
                   tick={{ fontSize: 12 }} 
                   tickLine={false}
                   axisLine={false}
                 />
                 <YAxis 
                   tick={{ fontSize: 12 }} 
                   tickLine={false}
                   axisLine={false}
                   domain={['auto', 'auto']}
                 />
                 <Tooltip content={<CustomTooltip />} />
                 <Legend />
                 
                 {/* Reference lines for therapy events */}
                 {therapyEvents.map((event) => (
                   <ReferenceLine
                     key={event.id}
                     x={format(new Date(event.date), 'MMM d')}
                     stroke={
                       event.type === 'started' ? 'hsl(var(--success))' :
                       event.type === 'adjusted' ? 'hsl(var(--warning))' :
                       'hsl(var(--destructive))'
                     }
                     strokeDasharray="4 4"
                     strokeWidth={2}
                     label={{
                       value: event.type === 'started' ? '▼' : event.type === 'stopped' ? '■' : '◆',
                       position: 'top',
                       fill: event.type === 'started' ? 'hsl(var(--success))' :
                             event.type === 'adjusted' ? 'hsl(var(--warning))' :
                             'hsl(var(--destructive))',
                       fontSize: 14,
                     }}
                   />
                 ))}
                 
                 {/* Score lines */}
                 {scoreTypes.map((type) => (
                   <Line
                     key={type}
                     type="monotone"
                     dataKey={type}
                     stroke={SCORE_COLORS[type] || 'hsl(var(--primary))'}
                     strokeWidth={2}
                     dot={{ fill: SCORE_COLORS[type] || 'hsl(var(--primary))', strokeWidth: 2 }}
                     connectNulls
                     name={type}
                   />
                 ))}
               </ComposedChart>
             </ResponsiveContainer>
           </div>
           
           {/* Legend for therapy events */}
           <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs">
             <div className="flex items-center gap-1.5">
               <div className="w-3 h-0.5 bg-success border-dashed" style={{ borderTop: '2px dashed' }} />
               <span className="text-muted-foreground">Med Started</span>
             </div>
             <div className="flex items-center gap-1.5">
               <div className="w-3 h-0.5 bg-warning" style={{ borderTop: '2px dashed' }} />
               <span className="text-muted-foreground">Dose Adjusted</span>
             </div>
             <div className="flex items-center gap-1.5">
               <div className="w-3 h-0.5 bg-destructive" style={{ borderTop: '2px dashed' }} />
               <span className="text-muted-foreground">Med Stopped</span>
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Therapy Events List */}
       {therapyEvents.length > 0 && (
         <Card>
           <CardHeader>
             <CardTitle className="text-base flex items-center gap-2">
               <Pill className="h-4 w-4 text-primary" />
               Therapy Changes
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-3">
               {therapyEvents.map((event, idx) => {
                 const Icon = THERAPY_EVENT_ICONS[event.type];
                 const summary = responseSummary?.find(s => s.event.id === event.id);
                 
                 return (
                   <div 
                     key={event.id}
                     className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                   >
                     <div className={cn(
                       'p-2 rounded-lg shrink-0',
                       THERAPY_EVENT_COLORS[event.type]
                     )}>
                       <Icon className="h-4 w-4" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 flex-wrap">
                         <span className="font-medium text-sm">{event.description}</span>
                         <Badge variant="outline" className="text-xs">
                           {event.type}
                         </Badge>
                       </div>
                       <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                         <Calendar className="h-3 w-3" />
                         {format(new Date(event.date), 'MMMM d, yyyy')}
                       </div>
                       
                       {/* Response summary */}
                       {summary && summary.change !== null && (
                         <div className="flex items-center gap-2 mt-2 text-sm">
                           <span className="text-muted-foreground">{summary.scoreType}:</span>
                           <span>{summary.scoreBefore?.toFixed(1)}</span>
                           <ArrowRight className="h-3 w-3 text-muted-foreground" />
                           <span>{summary.scoreAfter?.toFixed(1)}</span>
                           <span className={cn(
                             'flex items-center gap-0.5 font-medium',
                             summary.change < 0 ? 'text-success' : 
                             summary.change > 0 ? 'text-destructive' : 
                             'text-muted-foreground'
                           )}>
                             {summary.change < 0 ? (
                               <TrendingDown className="h-3 w-3" />
                             ) : summary.change > 0 ? (
                               <TrendingUp className="h-3 w-3" />
                             ) : (
                               <Minus className="h-3 w-3" />
                             )}
                             {Math.abs(summary.change).toFixed(1)}
                           </span>
                           {summary.daysToResponse && (
                             <span className="text-muted-foreground">
                               ({summary.daysToResponse}d)
                             </span>
                           )}
                         </div>
                       )}
                     </div>
                   </div>
                 );
               })}
             </div>
           </CardContent>
         </Card>
       )}
 
       {/* Response Summary Stats */}
       {responseSummary && responseSummary.some(s => s.change !== null) && (
         <Card>
           <CardHeader>
             <CardTitle className="text-base flex items-center gap-2">
               <TrendingDown className="h-4 w-4 text-success" />
               Response Summary
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {(() => {
                 const validResponses = responseSummary.filter(s => s.change !== null);
                 const improvements = validResponses.filter(s => (s.change ?? 0) < 0);
                 const avgChange = validResponses.length > 0
                   ? validResponses.reduce((sum, s) => sum + (s.change ?? 0), 0) / validResponses.length
                   : 0;
                 const avgDays = validResponses.filter(s => s.daysToResponse).length > 0
                   ? validResponses
                       .filter(s => s.daysToResponse)
                       .reduce((sum, s) => sum + (s.daysToResponse ?? 0), 0) / 
                     validResponses.filter(s => s.daysToResponse).length
                   : null;
                 
                 return (
                   <>
                     <div className="text-center p-3 rounded-lg bg-muted/50">
                       <p className="text-2xl font-bold text-primary">
                         {therapyEvents.length}
                       </p>
                       <p className="text-xs text-muted-foreground">Therapy Changes</p>
                     </div>
                     <div className="text-center p-3 rounded-lg bg-muted/50">
                       <p className="text-2xl font-bold text-success">
                         {improvements.length}/{validResponses.length}
                       </p>
                       <p className="text-xs text-muted-foreground">Showed Improvement</p>
                     </div>
                     <div className="text-center p-3 rounded-lg bg-muted/50">
                       <p className={cn(
                         'text-2xl font-bold',
                         avgChange < 0 ? 'text-success' : avgChange > 0 ? 'text-destructive' : ''
                       )}>
                         {avgChange < 0 ? '' : '+'}{avgChange.toFixed(1)}
                       </p>
                       <p className="text-xs text-muted-foreground">Avg Score Change</p>
                     </div>
                     <div className="text-center p-3 rounded-lg bg-muted/50">
                       <p className="text-2xl font-bold">
                         {avgDays ? `${Math.round(avgDays)}d` : '—'}
                       </p>
                       <p className="text-xs text-muted-foreground">Avg Time to Response</p>
                     </div>
                   </>
                 );
               })()}
             </div>
           </CardContent>
         </Card>
       )}
     </div>
   );
 }