 import { useEffect, useState } from 'react';
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { format } from 'date-fns';
 import { TrendingUp } from 'lucide-react';
 import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
 import { TrendAnalysisAssistant } from './TrendAnalysisAssistant';
 
 interface ScoreEntry {
   id: string;
   score_type: string;
   calculated_score: number | null;
   created_at: string;
 }
 
 interface ScoreTrendsProps {
   patientId: string;
   refreshKey?: number;
   patientCode?: string;
   diagnosisTags?: string[] | null;
 }
 
 const SCORE_COLORS: Record<string, string> = {
   'DAS28-ESR': 'hsl(var(--chart-1))',
   'CDAI': 'hsl(var(--chart-2))',
   'BASDAI': 'hsl(var(--chart-3))',
   'SLEDAI': 'hsl(var(--chart-4))',
 };
 
 export function ScoreTrends({ patientId, refreshKey, patientCode, diagnosisTags }: ScoreTrendsProps) {
   const { user } = useAuth();
   const [scores, setScores] = useState<ScoreEntry[]>([]);
   const [loading, setLoading] = useState(true);
 
   const fetchScores = async () => {
     if (!user) return;
     const { data, error } = await supabase
        .from('score_entries_secure')
       .select('id, score_type, calculated_score, created_at')
       .eq('patient_card_id', patientId)
       .eq('user_id', user.id)
       .order('created_at', { ascending: true });
 
      if (data) setScores(data as ScoreEntry[]);
     setLoading(false);
   };
 
   useEffect(() => {
     fetchScores();
   }, [user, patientId, refreshKey]);
 
   if (loading) {
     return (
       <Card>
         <CardContent className="py-8 text-center text-muted-foreground">
           Loading scores...
         </CardContent>
       </Card>
     );
   }
 
   if (scores.length === 0) {
     return (
       <Card>
         <CardContent className="py-12 text-center">
           <TrendingUp className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
           <p className="text-muted-foreground">No scores recorded yet</p>
           <p className="text-sm text-muted-foreground mt-1">Calculate and save scores from the Scores page, linked to this patient</p>
         </CardContent>
       </Card>
     );
   }
 
   // Group scores by type
   const scoreTypes = [...new Set(scores.map(s => s.score_type))];
 
   // Prepare chart data - group by date
   const chartData = scores.reduce((acc, score) => {
     const dateKey = format(new Date(score.created_at), 'MMM d');
     const existing = acc.find(d => d.date === dateKey);
     if (existing) {
       existing[score.score_type] = score.calculated_score;
     } else {
       acc.push({
         date: dateKey,
         [score.score_type]: score.calculated_score,
       });
     }
     return acc;
   }, [] as Array<{ date: string; [key: string]: any }>);
 
   return (
     <div className="space-y-6">
       {/* AI Assistant */}
       <TrendAnalysisAssistant 
         scores={scores} 
         patientCode={patientCode || 'Unknown'} 
         diagnosisTags={diagnosisTags || null}
       />
 
       {/* Chart */}
       <Card>
         <CardHeader>
           <CardTitle className="text-base flex items-center gap-2">
             <TrendingUp className="h-4 w-4 text-primary" />
             Score Trends Over Time
           </CardTitle>
           <CardDescription>Disease activity indices tracked for this patient</CardDescription>
         </CardHeader>
         <CardContent>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartData}>
                 <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                 <XAxis 
                   dataKey="date" 
                   tick={{ fontSize: 12 }} 
                   tickLine={false}
                   axisLine={false}
                 />
                 <YAxis 
                   tick={{ fontSize: 12 }} 
                   tickLine={false}
                   axisLine={false}
                 />
                 <Tooltip 
                   contentStyle={{ 
                     backgroundColor: 'hsl(var(--card))',
                     border: '1px solid hsl(var(--border))',
                     borderRadius: '8px',
                   }}
                 />
                 <Legend />
                 {scoreTypes.map((type) => (
                   <Line
                     key={type}
                     type="monotone"
                     dataKey={type}
                     stroke={SCORE_COLORS[type] || 'hsl(var(--primary))'}
                     strokeWidth={2}
                     dot={{ fill: SCORE_COLORS[type] || 'hsl(var(--primary))', strokeWidth: 2 }}
                     connectNulls
                   />
                 ))}
               </LineChart>
             </ResponsiveContainer>
           </div>
         </CardContent>
       </Card>
 
       {/* Score History Table */}
       <Card>
         <CardHeader>
           <CardTitle className="text-base">Score History</CardTitle>
         </CardHeader>
         <CardContent>
           <div className="relative overflow-x-auto">
             <table className="w-full text-sm">
               <thead>
                 <tr className="border-b">
                   <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                   <th className="text-left py-2 px-3 font-medium text-muted-foreground">Score Type</th>
                   <th className="text-right py-2 px-3 font-medium text-muted-foreground">Value</th>
                 </tr>
               </thead>
               <tbody>
                 {scores.slice().reverse().map((score) => (
                   <tr key={score.id} className="border-b last:border-0">
                     <td className="py-2 px-3">{format(new Date(score.created_at), 'MMM d, yyyy')}</td>
                     <td className="py-2 px-3">
                       <span 
                         className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                         style={{ 
                           backgroundColor: `${SCORE_COLORS[score.score_type] || 'hsl(var(--primary))'}20`,
                           color: SCORE_COLORS[score.score_type] || 'hsl(var(--primary))'
                         }}
                       >
                         {score.score_type}
                       </span>
                     </td>
                     <td className="py-2 px-3 text-right font-medium">{score.calculated_score}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </CardContent>
       </Card>
     </div>
   );
 }