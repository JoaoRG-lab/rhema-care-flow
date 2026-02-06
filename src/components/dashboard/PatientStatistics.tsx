import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  ClipboardList,
  Stethoscope,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// Chart color palette using HSL values that work in both light/dark modes
const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--info))',
  'hsl(var(--destructive))',
  'hsl(210, 70%, 60%)',
  'hsl(280, 60%, 55%)',
  'hsl(30, 80%, 55%)',
];

interface StatsData {
   totalPatients: number;
   newPatientsThisMonth: number;
   totalVisitsThisMonth: number;
   totalScoresRecorded: number;
   averageVisitsPerPatient: number;
   diagnosisBreakdown: { diagnosis: string; count: number }[];
   recentScores: { scoreType: string; avgScore: number; count: number }[];
   therapyBreakdown: { therapy: string; count: number }[];
 }
 
 export function PatientStatistics() {
   const { user } = useAuth();
   const [stats, setStats] = useState<StatsData | null>(null);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     const fetchStatistics = async () => {
       if (!user) return;
 
       const monthStart = startOfMonth(new Date());
       const monthEnd = endOfMonth(new Date());
       const thirtyDaysAgo = subDays(new Date(), 30);
 
       try {
         // Fetch all patient data
         const { data: patients } = await supabase
           .from('patient_cards_secure')
           .select('id, created_at, diagnosis_tags, therapy_tags')
           .eq('user_id', user.id);
 
         // Fetch visits this month
         const { data: visits } = await supabase
           .from('visits_secure')
           .select('id, visit_date, patient_card_id')
           .eq('user_id', user.id)
           .gte('visit_date', format(monthStart, 'yyyy-MM-dd'))
           .lte('visit_date', format(monthEnd, 'yyyy-MM-dd'));
 
         // Fetch score entries
         const { data: scores } = await supabase
           .from('score_entries_secure')
           .select('score_type, calculated_score, created_at')
           .eq('user_id', user.id)
           .gte('created_at', thirtyDaysAgo.toISOString());
 
         if (!patients) {
           setStats(null);
           setLoading(false);
           return;
         }
 
         // Calculate statistics
         const totalPatients = patients.length;
         const newPatientsThisMonth = patients.filter(p => 
           new Date(p.created_at) >= monthStart
         ).length;
         const totalVisitsThisMonth = visits?.length || 0;
         const totalScoresRecorded = scores?.length || 0;
         const averageVisitsPerPatient = totalPatients > 0 
           ? Math.round((totalVisitsThisMonth / totalPatients) * 10) / 10 
           : 0;
 
         // Diagnosis breakdown
         const diagnosisCounts: Record<string, number> = {};
         patients.forEach(p => {
           (p.diagnosis_tags || []).forEach((tag: string) => {
             diagnosisCounts[tag] = (diagnosisCounts[tag] || 0) + 1;
           });
         });
         const diagnosisBreakdown = Object.entries(diagnosisCounts)
           .map(([diagnosis, count]) => ({ diagnosis, count }))
           .sort((a, b) => b.count - a.count)
           .slice(0, 5);
 
         // Therapy breakdown
         const therapyCounts: Record<string, number> = {};
         patients.forEach(p => {
           (p.therapy_tags || []).forEach((tag: string) => {
             therapyCounts[tag] = (therapyCounts[tag] || 0) + 1;
           });
         });
         const therapyBreakdown = Object.entries(therapyCounts)
           .map(([therapy, count]) => ({ therapy, count }))
           .sort((a, b) => b.count - a.count)
           .slice(0, 5);
 
         // Recent scores summary
         const scoreSummary: Record<string, { total: number; count: number }> = {};
         (scores || []).forEach(s => {
           if (!scoreSummary[s.score_type]) {
             scoreSummary[s.score_type] = { total: 0, count: 0 };
           }
           scoreSummary[s.score_type].total += s.calculated_score || 0;
           scoreSummary[s.score_type].count += 1;
         });
         const recentScores = Object.entries(scoreSummary)
           .map(([scoreType, { total, count }]) => ({
             scoreType,
             avgScore: Math.round((total / count) * 10) / 10,
             count,
           }))
           .sort((a, b) => b.count - a.count);
 
         setStats({
           totalPatients,
           newPatientsThisMonth,
           totalVisitsThisMonth,
           totalScoresRecorded,
           averageVisitsPerPatient,
           diagnosisBreakdown,
           recentScores,
           therapyBreakdown,
         });
       } catch (error) {
         console.error('Error fetching statistics:', error);
       } finally {
         setLoading(false);
       }
     };
 
     fetchStatistics();
   }, [user]);
 
   if (loading) {
     return (
       <Card className="col-span-full">
         <CardContent className="py-8 text-center text-muted-foreground">
           Loading statistics...
         </CardContent>
       </Card>
     );
   }
 
   if (!stats || stats.totalPatients === 0) {
     return (
       <Card className="col-span-full">
         <CardContent className="py-8 text-center">
           <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
           <p className="text-muted-foreground">No patient data yet</p>
           <p className="text-sm text-muted-foreground mt-1">Add patients to see statistics</p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card className="col-span-full">
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           <BarChart3 className="h-5 w-5 text-primary" />
           Patient Statistics
         </CardTitle>
         <CardDescription>
           Overview of your practice data for {format(new Date(), 'MMMM yyyy')}
         </CardDescription>
       </CardHeader>
       <CardContent>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
           {/* Key Metrics */}
           <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
             <div className="flex items-center gap-2 mb-2">
               <Users className="h-4 w-4 text-primary" />
               <span className="text-sm text-muted-foreground">Total Patients</span>
             </div>
             <p className="text-2xl font-bold">{stats.totalPatients}</p>
             {stats.newPatientsThisMonth > 0 && (
               <p className="text-xs text-success flex items-center gap-1 mt-1">
                 <TrendingUp className="h-3 w-3" />
                 +{stats.newPatientsThisMonth} this month
               </p>
             )}
           </div>
 
           <div className="p-4 rounded-lg bg-info/5 border border-info/10">
             <div className="flex items-center gap-2 mb-2">
               <Calendar className="h-4 w-4 text-info" />
               <span className="text-sm text-muted-foreground">Visits This Month</span>
             </div>
             <p className="text-2xl font-bold">{stats.totalVisitsThisMonth}</p>
             <p className="text-xs text-muted-foreground mt-1">
               Avg: {stats.averageVisitsPerPatient}/patient
             </p>
           </div>
 
           <div className="p-4 rounded-lg bg-success/5 border border-success/10">
             <div className="flex items-center gap-2 mb-2">
               <Activity className="h-4 w-4 text-success" />
               <span className="text-sm text-muted-foreground">Scores Recorded</span>
             </div>
             <p className="text-2xl font-bold">{stats.totalScoresRecorded}</p>
             <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
           </div>
 
           <div className="p-4 rounded-lg bg-warning/5 border border-warning/10">
             <div className="flex items-center gap-2 mb-2">
               <Stethoscope className="h-4 w-4 text-warning" />
               <span className="text-sm text-muted-foreground">Diagnoses</span>
             </div>
             <p className="text-2xl font-bold">{stats.diagnosisBreakdown.length}</p>
             <p className="text-xs text-muted-foreground mt-1">Unique conditions</p>
           </div>
         </div>
 
          {/* Charts Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Diagnosis Pie Chart */}
            {stats.diagnosisBreakdown.length > 0 && (
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  Diagnosis Distribution
                </h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.diagnosisBreakdown.map(d => ({ name: d.diagnosis, value: d.count }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {stats.diagnosisBreakdown.map((_, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CHART_COLORS[index % CHART_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Therapy Bar Chart */}
            {stats.therapyBreakdown.length > 0 && (
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                  Therapy Distribution
                </h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={stats.therapyBreakdown.map(t => ({ name: t.therapy, count: t.count }))}
                      layout="vertical"
                      margin={{ left: 0, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        tick={{ fontSize: 11 }} 
                        width={80}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Score Averages Bar Chart */}
          {stats.recentScores.length > 0 && (
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Recent Score Averages (Last 30 Days)
              </h4>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={stats.recentScores.map(s => ({ 
                      name: s.scoreType, 
                      avg: s.avgScore,
                      count: s.count 
                    }))}
                    margin={{ top: 10, right: 20, bottom: 20, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11 }} 
                      angle={-20}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'avg' ? value.toFixed(1) : value,
                        name === 'avg' ? 'Average Score' : 'Count'
                      ]}
                    />
                    <Bar dataKey="avg" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Average" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Empty states */}
          {stats.diagnosisBreakdown.length === 0 && stats.therapyBreakdown.length === 0 && stats.recentScores.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Add patient data to see detailed charts</p>
            </div>
          )}
       </CardContent>
     </Card>
   );
 }