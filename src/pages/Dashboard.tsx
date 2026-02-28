import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/StatCard';
import { DiagnosisTag } from '@/components/ui/DiagnosisTag';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import { usePersona } from '@/contexts/PersonaContext';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { VerificationPrompt } from '@/components/dashboard/VerificationPrompt';
import { QuickPatientSearch } from '@/components/clinical/QuickPatientSearch';
import { VoiceNoteButton } from '@/components/clinical/VoiceNoteButton';
import { ContributeKnowledge } from '@/components/dashboard/ContributeKnowledge';
import { PatientStatistics } from '@/components/dashboard/PatientStatistics';
import { SessionList } from '@/components/consultations/SessionList';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import { useDailyCompliment } from '@/hooks/useDailyCompliment';
import { AISiteAgentWidget } from '@/components/ai/AISiteAgentWidget';
 import {
   DIAGNOSIS_OPTIONS,
 } from '@/config/clinical';
 import type { PatientCard, MonitoringEvent } from '@/types/clinical';
 import {
   Users,
   AlertTriangle,
   Calendar,
   Syringe,
   Plus,
   ChevronRight,
   CheckSquare,
   Clock,
   Zap,
 } from 'lucide-react';
 import { format, addDays, isAfter, isBefore } from 'date-fns';
 import { useIsMobile } from '@/hooks/use-mobile';
 
export default function Dashboard() {
  const { user } = useAuth();
  const { status, tier, contributorType, fullName } = useVerificationStatus();
  const { persona } = usePersona();
  const [patients, setPatients] = useState<PatientCard[]>([]);
  const [monitoringAlerts, setMonitoringAlerts] = useState<MonitoringEvent[]>([]);
  const [upcomingFollowups, setUpcomingFollowups] = useState<PatientCard[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  
  // Show daily compliment 💜
  useDailyCompliment();
 
   const fetchData = useCallback(async () => {
     if (!user) return;
     
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
   }, [user]);
 
   useEffect(() => {
     if (!user) return;
     fetchData();
   }, [user, fetchData]);
 
   // Pull to refresh
   const { ref: pullRef, pullDistance, isRefreshing, progress, shouldTrigger } = usePullToRefresh<HTMLDivElement>({
     onRefresh: async () => {
       await fetchData();
     },
     enabled: isMobile,
   });
 
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
       <div
         ref={pullRef}
         className="p-4 md:p-6 lg:p-8 relative overflow-auto"
         style={{ minHeight: '100%' }}
       >
         {/* Pull to Refresh Indicator */}
         {isMobile && (
           <PullToRefreshIndicator
             pullDistance={pullDistance}
             isRefreshing={isRefreshing}
             progress={progress}
             shouldTrigger={shouldTrigger}
           />
         )}
 
         {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
           <div>
            <div className="flex items-center gap-2 md:gap-3 mb-1 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">{getGreeting()}</h1>
              {tier && <VerifiedBadge tier={tier} size="sm" />}
            </div>
            <p className="text-sm md:text-base text-muted-foreground">
              {isMobile ? format(new Date(), 'MMM d, yyyy') : `Today's Clinic • ${format(new Date(), 'EEEE, MMMM d, yyyy')}`}
            </p>
           </div>
           <div className="flex items-center gap-2">
             <Link to="/patients">
               <Button className="gap-2">
                 <Plus className="h-4 w-4" />
                 {isMobile ? 'New' : 'New Patient'}
               </Button>
             </Link>
           </div>
         </div>
 
         {/* Quick Patient Search - Clinical Mode */}
         {persona === 'clinical' && (
           <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
             <CardContent className="p-4">
               <div className="flex items-center gap-3 mb-3">
                 <Zap className="h-5 w-5 text-primary" />
                 <h3 className="font-semibold">Quick Actions</h3>
               </div>
               <div className="flex flex-col sm:flex-row gap-3">
                 <QuickPatientSearch />
                 <div className="flex items-center gap-2">
                   <VoiceNoteButton onTranscript={() => { /* Voice note captured */ }} />
                   <span className="text-xs text-muted-foreground hidden sm:inline">Voice note</span>
                 </div>
               </div>
             </CardContent>
           </Card>
         )}
 
         {/* Verification Prompt for unverified users */}
         {tier === null && (
           <div className="mb-4 md:mb-6">
             <VerificationPrompt status={status} />
           </div>
         )}
 
         {/* Welcome Card with Tier-based Actions */}
         <div className="mb-6 md:mb-8">
           <WelcomeCard tier={tier} fullName={fullName} />
         </div>
 
         {/* Stats Grid */}
         <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
           <StatCard
             title={isMobile ? 'Patients' : 'Active Patients'}
             value={patients.length}
             icon={<Users className="h-5 w-5" />}
           />
           <StatCard
             title={isMobile ? 'Alerts' : 'Monitoring Alerts'}
             value={overdueCount}
             icon={<AlertTriangle className="h-5 w-5" />}
             description={isMobile ? undefined : (overdueCount > 0 ? 'Action required' : 'All clear')}
             trend={overdueCount > 0 ? 'down' : 'up'}
           />
           <StatCard
             title={isMobile ? 'Follow-ups' : 'This Week Followups'}
             value={upcomingFollowups.length}
             icon={<Calendar className="h-5 w-5" />}
           />
           <StatCard
             title={isMobile ? 'Infusions' : 'Infusions Scheduled'}
             value={0}
             icon={<Syringe className="h-5 w-5" />}
           />
         </div>
 
         {/* Main Content Grid */}
         <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
            {/* Patient Statistics - Full Width */}
            <PatientStatistics />
 
           {/* Monitoring Alerts */}
           <Card>
             <CardHeader className="flex flex-row items-center justify-between">
               <CardTitle className="text-base md:text-lg flex items-center gap-2">
                 <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-warning" />
                 Monitoring Alerts
               </CardTitle>
               <Link to="/monitoring">
                 <Button variant="ghost" size="sm" className="gap-1">
                   {isMobile ? '' : 'View all'} <ChevronRight className="h-4 w-4" />
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
               <CardTitle className="text-base md:text-lg flex items-center gap-2">
                 <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                 {isMobile ? 'Follow-ups' : 'Upcoming Follow-ups'}
               </CardTitle>
               <Link to="/patients">
                 <Button variant="ghost" size="sm" className="gap-1">
                   {isMobile ? '' : 'View all'} <ChevronRight className="h-4 w-4" />
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
               <CardTitle className="text-base md:text-lg flex items-center gap-2">
                 <CheckSquare className="h-4 w-4 md:h-5 md:w-5 text-success" />
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
               <CardTitle className="text-base md:text-lg">Patient Distribution</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="flex flex-wrap gap-2">
                  {[...DIAGNOSIS_OPTIONS].map((dx) => {
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

            {/* Contribute Knowledge */}
            <ContributeKnowledge />

            {/* AI Site Agent */}
            <AISiteAgentWidget />

            {/* Patient Consultation Sessions */}
            <SessionList compact />
          </div>
       </div>
     </AppLayout>
   );
 }