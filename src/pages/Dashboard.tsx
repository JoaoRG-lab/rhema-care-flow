 import { useEffect, useState } from 'react';
 import { Link } from 'react-router-dom';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { StatCard } from '@/components/ui/StatCard';
 import { DiagnosisTag } from '@/components/ui/DiagnosisTag';
 import { Button } from '@/components/ui/button';
 import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
 import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
 import { VerificationPrompt } from '@/components/dashboard/VerificationPrompt';
 import {
   Users,
   AlertTriangle,
   Calendar,
   Syringe,
   Plus,
   ChevronRight,
   CheckSquare,
   Clock,
 } from 'lucide-react';
 import { format, addDays, isAfter, isBefore } from 'date-fns';
 
 interface PatientCard {
   id: string;
   patient_code: string;
   diagnosis_tags: string[];
   therapy_tags: string[];
   next_followup_date: string | null;
 }
 
 interface MonitoringEvent {
   id: string;
   event_type: string;
   due_date: string;
   status: string;
   patient_card_id: string | null;
 }
 
 export default function Dashboard() {
   const { user } = useAuth();
   const { status, tier, contributorType, fullName } = useVerificationStatus();
   const [patients, setPatients] = useState<PatientCard[]>([]);
   const [monitoringAlerts, setMonitoringAlerts] = useState<MonitoringEvent[]>([]);
   const [upcomingFollowups, setUpcomingFollowups] = useState<PatientCard[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     if (!user) return;
 
     const fetchData = async () => {
       const today = new Date();
       const nextWeek = addDays(today, 7);
 
       // Fetch patient cards
        // Use secure view for reading patient data with automatic decryption
        const { data: patientData } = await supabase
          .from('patient_cards_secure')
         .select('*')
         .eq('user_id', user.id);
 
       // Fetch overdue/upcoming monitoring
        // Use secure view for reading monitoring data with automatic decryption
        const { data: monitoringData } = await supabase
          .from('monitoring_events_secure')
         .select('*')
         .eq('user_id', user.id)
         .eq('status', 'pending')
         .lte('due_date', format(nextWeek, 'yyyy-MM-dd'))
         .order('due_date', { ascending: true })
         .limit(5);
 
       if (patientData) {
         setPatients(patientData);
         // Filter upcoming followups
         const upcoming = patientData.filter(p => {
           if (!p.next_followup_date) return false;
           const followupDate = new Date(p.next_followup_date);
           return isAfter(followupDate, today) && isBefore(followupDate, nextWeek);
         });
         setUpcomingFollowups(upcoming.slice(0, 5));
       }
 
       if (monitoringData) {
         setMonitoringAlerts(monitoringData);
       }
 
       setLoading(false);
     };
 
     fetchData();
   }, [user]);
 
   const overdueCount = monitoringAlerts.filter(m => 
     isBefore(new Date(m.due_date), new Date())
   ).length;
 
  // Generate personalized greeting based on verification status
  const getGreeting = () => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    
    if (!tier) {
      return `${timeGreeting}!`;
    }
    
    // Format name with appropriate title based on contributor type
    const formatName = () => {
      if (!fullName) return '';
      
      // For clinical contributors, add "Dr." prefix if not already present
      if (contributorType === 'clinical') {
        const name = fullName.trim();
        if (name.toLowerCase().startsWith('dr.') || name.toLowerCase().startsWith('dr ')) {
          return name;
        }
        return `Dr. ${name}`;
      }
      
      return fullName;
    };
    
    const displayName = formatName();
    
    switch (tier) {
      case 'expert':
        return `${timeGreeting}, ${displayName}! Your expertise guides our community.`;
      case 'gold':
        return `${timeGreeting}, ${displayName}! Thank you for your verified contributions.`;
      case 'silver':
        return `${timeGreeting}, ${displayName}!`;
      case 'bronze':
        return `${timeGreeting}, ${displayName}!`;
      case 'developer':
        return `${timeGreeting}, ${displayName}! Building great things.`;
      case 'partner':
        return `${timeGreeting}, ${displayName}! Great to have you with us.`;
      default:
        return `${timeGreeting}!`;
    }
  };

   return (
     <AppLayout>
       <div className="p-6 lg:p-8">
         {/* Header */}
         <div className="flex items-center justify-between mb-8">
           <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{getGreeting()}</h1>
              {tier && <VerifiedBadge tier={tier} size="sm" />}
            </div>
            <p className="text-muted-foreground">
              Today's Clinic • {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
           </div>
           <Link to="/patients">
             <Button className="gap-2">
               <Plus className="h-4 w-4" />
               New Patient Card
             </Button>
           </Link>
         </div>
 
         {/* Verification Prompt for unverified users */}
         {tier === null && (
           <div className="mb-6">
             <VerificationPrompt status={status} />
           </div>
         )}
 
         {/* Welcome Card with Tier-based Actions */}
         <div className="mb-8">
           <WelcomeCard tier={tier} fullName={fullName} />
         </div>
 
         {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
           <StatCard
             title="Active Patients"
             value={patients.length}
             icon={<Users className="h-5 w-5" />}
           />
           <StatCard
             title="Monitoring Alerts"
             value={overdueCount}
             icon={<AlertTriangle className="h-5 w-5" />}
             description={overdueCount > 0 ? 'Action required' : 'All clear'}
             trend={overdueCount > 0 ? 'down' : 'up'}
           />
           <StatCard
             title="This Week Followups"
             value={upcomingFollowups.length}
             icon={<Calendar className="h-5 w-5" />}
           />
           <StatCard
             title="Infusions Scheduled"
             value={0}
             icon={<Syringe className="h-5 w-5" />}
           />
         </div>
 
         {/* Main Content Grid */}
         <div className="grid lg:grid-cols-2 gap-6">
           {/* Monitoring Alerts */}
           <Card>
             <CardHeader className="flex flex-row items-center justify-between">
               <CardTitle className="text-lg flex items-center gap-2">
                 <AlertTriangle className="h-5 w-5 text-warning" />
                 Monitoring Alerts
               </CardTitle>
               <Link to="/monitoring">
                 <Button variant="ghost" size="sm" className="gap-1">
                   View all <ChevronRight className="h-4 w-4" />
                 </Button>
               </Link>
             </CardHeader>
             <CardContent>
               {monitoringAlerts.length === 0 ? (
                 <p className="text-muted-foreground text-sm py-4 text-center">
                   No pending monitoring alerts
                 </p>
               ) : (
                 <div className="space-y-3">
                   {monitoringAlerts.map((alert) => (
                     <div
                       key={alert.id}
                       className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                     >
                       <div className="flex items-center gap-3">
                         <Clock className="h-4 w-4 text-muted-foreground" />
                         <div>
                           <p className="text-sm font-medium">{alert.event_type}</p>
                           <p className="text-xs text-muted-foreground">
                             Due: {format(new Date(alert.due_date), 'MMM d')}
                           </p>
                         </div>
                       </div>
                       <span className={`text-xs px-2 py-1 rounded-full ${
                         isBefore(new Date(alert.due_date), new Date()) 
                           ? 'status-overdue' 
                           : 'status-pending'
                       }`}>
                         {isBefore(new Date(alert.due_date), new Date()) ? 'Overdue' : 'Due'}
                       </span>
                     </div>
                   ))}
                 </div>
               )}
             </CardContent>
           </Card>
 
           {/* Upcoming Followups */}
           <Card>
             <CardHeader className="flex flex-row items-center justify-between">
               <CardTitle className="text-lg flex items-center gap-2">
                 <Calendar className="h-5 w-5 text-primary" />
                 Upcoming Follow-ups
               </CardTitle>
               <Link to="/patients">
                 <Button variant="ghost" size="sm" className="gap-1">
                   View all <ChevronRight className="h-4 w-4" />
                 </Button>
               </Link>
             </CardHeader>
             <CardContent>
               {upcomingFollowups.length === 0 ? (
                 <p className="text-muted-foreground text-sm py-4 text-center">
                   No follow-ups scheduled this week
                 </p>
               ) : (
                 <div className="space-y-3">
                   {upcomingFollowups.map((patient) => (
                     <div
                       key={patient.id}
                       className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                     >
                       <div>
                         <p className="text-sm font-medium">{patient.patient_code}</p>
                         <div className="flex gap-1 mt-1">
                           {patient.diagnosis_tags.slice(0, 2).map((tag) => (
                             <DiagnosisTag key={tag} tag={tag} size="sm" />
                           ))}
                         </div>
                       </div>
                       <p className="text-sm text-muted-foreground">
                         {format(new Date(patient.next_followup_date!), 'MMM d')}
                       </p>
                     </div>
                   ))}
                 </div>
               )}
             </CardContent>
           </Card>
 
           {/* Quick Clinic Checklist */}
           <Card>
             <CardHeader>
               <CardTitle className="text-lg flex items-center gap-2">
                 <CheckSquare className="h-5 w-5 text-success" />
                 Clinic Day Checklist
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-2">
                 {[
                   'Room setup complete',
                   'Ultrasound ready',
                   'Lab forms prepared',
                   'Prescription pads available',
                   'Infusion schedule reviewed',
                 ].map((item, idx) => (
                   <label
                     key={idx}
                     className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                   >
                     <input type="checkbox" className="h-4 w-4 rounded border-border" />
                     <span className="text-sm">{item}</span>
                   </label>
                 ))}
               </div>
             </CardContent>
           </Card>
 
           {/* Disease Distribution */}
           <Card>
             <CardHeader>
               <CardTitle className="text-lg">Patient Distribution</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="flex flex-wrap gap-2">
                 {['RA', 'SLE', 'SpA', 'PsA', 'Vasculitis', 'FM'].map((dx) => {
                   const count = patients.filter(p => 
                     p.diagnosis_tags.includes(dx)
                   ).length;
                   return (
                     <div key={dx} className="flex items-center gap-2">
                       <DiagnosisTag tag={dx} size="md" />
                       <span className="text-sm text-muted-foreground">{count}</span>
                     </div>
                   );
                 })}
               </div>
             </CardContent>
           </Card>
         </div>
       </div>
     </AppLayout>
   );
 }