import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Heart,
  Calendar,
  TrendingUp,
  Bell,
  BookOpen,
  Pill,
  Activity,
  CheckCircle2,
  Clock,
  ChevronRight,
  Video,
  Phone,
  Mail,
} from 'lucide-react';
import { format, addDays, isBefore, parseISO, isToday, isTomorrow } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { SessionList } from '@/components/consultations/SessionList';
import { useConsultationSessions } from '@/hooks/useConsultationSessions';
 
 // Educational resources
 const EDUCATION_RESOURCES = [
   { title: 'Understanding Rheumatoid Arthritis', category: 'RA', time: '5 min read' },
   { title: 'Managing Flares: What to Do', category: 'General', time: '3 min read' },
   { title: 'Biologics: What You Need to Know', category: 'Treatment', time: '7 min read' },
   { title: 'Exercise Tips for Joint Health', category: 'Lifestyle', time: '4 min read' },
   { title: 'Nutrition and Inflammation', category: 'Lifestyle', time: '6 min read' },
 ];
 
 export default function PatientPortal() {
   // Mock patient data - in production this would come from a patient-specific API
   const [scoreHistory] = useState([
     { date: 'Jan', score: 4.2 },
     { date: 'Feb', score: 3.8 },
     { date: 'Mar', score: 3.5 },
     { date: 'Apr', score: 3.2 },
     { date: 'May', score: 2.9 },
   ]);
 
   const [medications] = useState([
     { name: 'Methotrexate', dose: '15mg weekly', nextDue: addDays(new Date(), 2) },
     { name: 'Folic Acid', dose: '1mg daily', nextDue: addDays(new Date(), 0) },
     { name: 'Adalimumab', dose: '40mg bi-weekly', nextDue: addDays(new Date(), 5) },
   ]);
 
   const [appointments] = useState([
     { type: 'Rheumatology Follow-up', date: addDays(new Date(), 14), provider: 'Dr. Smith' },
     { type: 'Lab Work', date: addDays(new Date(), 7), provider: 'LabCorp' },
   ]);
 
   const currentScore = scoreHistory[scoreHistory.length - 1]?.score || 0;
   const previousScore = scoreHistory[scoreHistory.length - 2]?.score || currentScore;
   const scoreChange = currentScore - previousScore;
 
   return (
     <AppLayout>
       <div className="p-4 md:p-6 lg:p-8">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
           <div>
             <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
               <Heart className="h-6 w-6 text-destructive" />
               My Health Dashboard
             </h1>
             <p className="text-muted-foreground text-sm">Track your progress and stay on top of your care</p>
           </div>
         </div>
 
         {/* Quick Stats */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
           <Card className="border-l-4 border-l-success">
             <CardContent className="p-4">
               <div className="flex items-center gap-2 text-muted-foreground mb-1">
                 <Activity className="h-4 w-4" />
                 <span className="text-xs font-medium">Atividade da Doença</span>
               </div>
               <p className="text-2xl font-bold">{currentScore.toFixed(1)}</p>
               <p className={`text-xs ${scoreChange < 0 ? 'text-success' : 'text-destructive'}`}>
                 {scoreChange < 0 ? '↓' : '↑'} {Math.abs(scoreChange).toFixed(1)} from last visit
               </p>
             </CardContent>
           </Card>
 
           <Card className="border-l-4 border-l-primary">
             <CardContent className="p-4">
               <div className="flex items-center gap-2 text-muted-foreground mb-1">
                 <Calendar className="h-4 w-4" />
                 <span className="text-xs font-medium">Próxima Consulta</span>
               </div>
               <p className="text-2xl font-bold">{format(appointments[0].date, 'MMM d')}</p>
               <p className="text-xs text-muted-foreground">{appointments[0].type}</p>
             </CardContent>
           </Card>
 
           <Card className="border-l-4 border-l-warning">
             <CardContent className="p-4">
               <div className="flex items-center gap-2 text-muted-foreground mb-1">
                 <Pill className="h-4 w-4" />
                 <span className="text-xs font-medium">Medicamentos</span>
               </div>
               <p className="text-2xl font-bold">{medications.length}</p>
               <p className="text-xs text-muted-foreground">Prescrições ativas</p>
             </CardContent>
           </Card>
 
           <Card className="border-l-4 border-l-info">
             <CardContent className="p-4">
               <div className="flex items-center gap-2 text-muted-foreground mb-1">
                 <TrendingUp className="h-4 w-4" />
                 <span className="text-xs font-medium">Tendência</span>
               </div>
               <p className="text-2xl font-bold text-success">Melhorando</p>
               <p className="text-xs text-muted-foreground">Over 5 months</p>
             </CardContent>
           </Card>
         </div>
 
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="sessions">Sessões</TabsTrigger>
              <TabsTrigger value="appointments">Consultas</TabsTrigger>
              <TabsTrigger value="medications">Medicamentos</TabsTrigger>
              <TabsTrigger value="learn">Aprender</TabsTrigger>
            </TabsList>
 
           {/* Overview Tab */}
           <TabsContent value="overview" className="space-y-4">
             <div className="grid lg:grid-cols-2 gap-4">
               <Card>
                 <CardHeader>
                   <CardTitle className="text-base flex items-center gap-2">
                     <TrendingUp className="h-4 w-4 text-primary" />
                     Disease Activity Trend
                   </CardTitle>
                   <CardDescription>Your DAS28 scores over time</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="h-[200px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={scoreHistory}>
                         <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                         <YAxis domain={[0, 6]} tick={{ fontSize: 12 }} />
                         <Tooltip />
                         <Line 
                           type="monotone" 
                           dataKey="score" 
                           stroke="hsl(var(--primary))" 
                           strokeWidth={2}
                           dot={{ fill: 'hsl(var(--primary))' }}
                         />
                       </LineChart>
                     </ResponsiveContainer>
                   </div>
                   <div className="flex justify-between mt-4 text-xs">
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-destructive" />
                       <span>High (&gt;5.1)</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-warning" />
                       <span>Moderate (3.2-5.1)</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-success" />
                       <span>Low (&lt;3.2)</span>
                     </div>
                   </div>
                 </CardContent>
               </Card>
 
               <Card>
                 <CardHeader>
                   <CardTitle className="text-base flex items-center gap-2">
                     <Bell className="h-4 w-4 text-warning" />
                     Upcoming Reminders
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-3">
                   {medications
                     .filter(m => isBefore(m.nextDue, addDays(new Date(), 7)))
                     .map((med, idx) => (
                       <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                         <div className="flex items-center gap-3">
                           <Pill className="h-4 w-4 text-primary" />
                           <div>
                             <p className="font-medium text-sm">{med.name}</p>
                             <p className="text-xs text-muted-foreground">{med.dose}</p>
                           </div>
                         </div>
                         <Badge variant={isBefore(med.nextDue, new Date()) ? 'destructive' : 'outline'}>
                           {isBefore(med.nextDue, new Date()) ? 'Due Today' : format(med.nextDue, 'MMM d')}
                         </Badge>
                       </div>
                     ))}
                   <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                     <div className="flex items-center gap-3">
                       <Calendar className="h-4 w-4 text-info" />
                       <div>
                         <p className="font-medium text-sm">{appointments[0].type}</p>
                         <p className="text-xs text-muted-foreground">{appointments[0].provider}</p>
                       </div>
                     </div>
                     <Badge variant="outline">{format(appointments[0].date, 'MMM d')}</Badge>
                   </div>
                 </CardContent>
               </Card>
             </div>
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="space-y-4">
              <SessionList />
            </TabsContent>
 
           {/* Appointments Tab */}
           <TabsContent value="appointments" className="space-y-4">
             <Card>
               <CardHeader>
                 <CardTitle className="text-base">Próximas Consultas</CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 {appointments.map((apt, idx) => (
                   <div key={idx} className="flex items-center justify-between p-4 rounded-lg border">
                     <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                         <Calendar className="h-5 w-5 text-primary" />
                       </div>
                       <div>
                         <p className="font-medium">{apt.type}</p>
                         <p className="text-sm text-muted-foreground">{apt.provider}</p>
                         <p className="text-sm text-muted-foreground">
                           {format(apt.date, 'EEEE, MMMM d, yyyy')}
                         </p>
                       </div>
                     </div>
                     <ChevronRight className="h-5 w-5 text-muted-foreground" />
                   </div>
                 ))}
               </CardContent>
             </Card>
           </TabsContent>
 
           {/* Medications Tab */}
           <TabsContent value="medications" className="space-y-4">
             <Card>
               <CardHeader>
                 <CardTitle className="text-base">Medicamentos Atuais</CardTitle>
                 <CardDescription>Your active prescriptions and schedules</CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 {medications.map((med, idx) => (
                   <div key={idx} className="p-4 rounded-lg border">
                     <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-3">
                         <Pill className="h-5 w-5 text-primary" />
                         <div>
                           <p className="font-medium">{med.name}</p>
                           <p className="text-sm text-muted-foreground">{med.dose}</p>
                         </div>
                       </div>
                       <Badge variant={isBefore(med.nextDue, new Date()) ? 'destructive' : 'secondary'}>
                         {isBefore(med.nextDue, new Date()) ? (
                           <><Clock className="h-3 w-3 mr-1" /> Due Today</>
                         ) : (
                           <><CheckCircle2 className="h-3 w-3 mr-1" /> On Track</>
                         )}
                       </Badge>
                     </div>
                     <div className="mt-3">
                       <div className="flex justify-between text-xs text-muted-foreground mb-1">
                         <span>Adherence this month</span>
                         <span>85%</span>
                       </div>
                       <Progress value={85} className="h-2" />
                     </div>
                   </div>
                 ))}
               </CardContent>
             </Card>
           </TabsContent>
 
           {/* Learn Tab */}
           <TabsContent value="learn" className="space-y-4">
             <Card>
               <CardHeader>
                 <CardTitle className="text-base flex items-center gap-2">
                   <BookOpen className="h-4 w-4" />
                   Educational Resources
                 </CardTitle>
                 <CardDescription>Learn more about your condition and treatment</CardDescription>
               </CardHeader>
               <CardContent className="space-y-3">
                 {EDUCATION_RESOURCES.map((resource, idx) => (
                   <div 
                     key={idx} 
                     className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                   >
                     <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                         <BookOpen className="h-5 w-5 text-primary" />
                       </div>
                       <div>
                         <p className="font-medium text-sm">{resource.title}</p>
                         <div className="flex items-center gap-2 mt-1">
                           <Badge variant="outline" className="text-xs">{resource.category}</Badge>
                           <span className="text-xs text-muted-foreground">{resource.time}</span>
                         </div>
                       </div>
                     </div>
                     <ChevronRight className="h-5 w-5 text-muted-foreground" />
                   </div>
                 ))}
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
       </div>
     </AppLayout>
   );
 }