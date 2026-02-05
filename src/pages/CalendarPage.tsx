 import { useEffect, useState, useMemo } from 'react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, Syringe, Briefcase, AlertTriangle, X } from 'lucide-react';
 import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay } from 'date-fns';
 import { cn } from '@/lib/utils';
 import { useIsMobile } from '@/hooks/use-mobile';
 import { CalendarGrid } from '@/components/calendar/CalendarGrid';
 import { CalendarDayDetail } from '@/components/calendar/CalendarDayDetail';
 import { Sheet, SheetContent } from '@/components/ui/sheet';
 import type { CalendarEvent } from '@/components/calendar/types';
 
 export default function CalendarPage() {
   const { user } = useAuth();
   const [currentMonth, setCurrentMonth] = useState(new Date());
   const [events, setEvents] = useState<CalendarEvent[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedDate, setSelectedDate] = useState<Date | null>(null);
   const isMobile = useIsMobile();
 
   useEffect(() => {
     if (!user) return;
 
     const fetchEvents = async () => {
       const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
       const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
 
       const calendarEvents: CalendarEvent[] = [];
 
       // Fetch patient followups
       const { data: patients } = await supabase
         .from('patient_cards_secure')
         .select('id, patient_code, next_followup_date, diagnosis_tags')
         .eq('user_id', user.id)
         .gte('next_followup_date', monthStart)
         .lte('next_followup_date', monthEnd);
 
       if (patients) {
         patients.forEach(p => {
           if (p.next_followup_date) {
             calendarEvents.push({
               id: `followup-${p.id}`,
               date: p.next_followup_date,
               type: 'followup',
               title: p.patient_code || 'Unknown',
               subtitle: p.diagnosis_tags?.slice(0, 2).join(', '),
               patientId: p.id || undefined,
             });
           }
         });
       }
 
       // Fetch infusions
       const { data: infusions } = await supabase
         .from('infusion_events_secure')
         .select('id, drug, next_date, patient_card_id')
         .eq('user_id', user.id)
         .gte('next_date', monthStart)
         .lte('next_date', monthEnd);
 
       if (infusions) {
         infusions.forEach(inf => {
           if (!inf.next_date) return;
           calendarEvents.push({
             id: `infusion-${inf.id}`,
             date: inf.next_date,
             type: 'infusion',
             title: inf.drug || 'Infusion',
             patientId: inf.patient_card_id || undefined,
           });
         });
       }
 
       // Fetch monitoring events
       const { data: monitoring } = await supabase
         .from('monitoring_events_secure')
         .select('id, event_type, due_date, patient_card_id, status')
         .eq('user_id', user.id)
         .eq('status', 'pending')
         .gte('due_date', monthStart)
         .lte('due_date', monthEnd);
 
       if (monitoring) {
         monitoring.forEach(m => {
           if (!m.due_date) return;
           calendarEvents.push({
             id: `monitoring-${m.id}`,
             date: m.due_date,
             type: 'monitoring',
             title: m.event_type || 'Monitoring',
             patientId: m.patient_card_id || undefined,
             status: m.status || undefined,
           });
         });
       }
 
       // Fetch shifts
       const { data: shifts } = await supabase
         .from('shifts')
         .select('id, shift_type, shift_date, location')
         .eq('user_id', user.id)
         .gte('shift_date', monthStart)
         .lte('shift_date', monthEnd);
 
       if (shifts) {
         shifts.forEach(s => {
           calendarEvents.push({
             id: `shift-${s.id}`,
             date: s.shift_date,
             type: 'shift',
             title: `${s.shift_type}${s.location ? ` @ ${s.location}` : ''}`,
           });
         });
       }
 
       setEvents(calendarEvents);
       setLoading(false);
     };
 
     fetchEvents();
   }, [user, currentMonth]);
 
   const days = useMemo(() => eachDayOfInterval({
     start: startOfMonth(currentMonth),
     end: endOfMonth(currentMonth),
   }), [currentMonth]);
 
   const startPadding = startOfMonth(currentMonth).getDay();
 
   const selectedDayEvents = useMemo(() => {
     if (!selectedDate) return [];
     return events.filter(e => isSameDay(new Date(e.date), selectedDate));
   }, [selectedDate, events]);
 
   const handleSelectDate = (date: Date) => {
     setSelectedDate(date);
   };
 
   const handleCloseDetail = () => {
     setSelectedDate(null);
   };
 
   return (
     <AppLayout>
       <div className="p-4 md:p-6 lg:p-8 h-[calc(100vh-56px)] md:h-screen flex flex-col">
         {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
           <div>
             <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
               <CalendarIcon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
               Calendar
             </h1>
             <p className="text-sm md:text-base text-muted-foreground">
               {isMobile ? 'Appointments & monitoring' : 'Follow-ups, infusions, monitoring, and shifts'}
             </p>
           </div>
           <div className="flex items-center gap-2">
             <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
               <ChevronLeft className="h-4 w-4" />
             </Button>
             <span className="font-medium min-w-[120px] md:min-w-[140px] text-center text-sm md:text-base">
               {format(currentMonth, isMobile ? 'MMM yyyy' : 'MMMM yyyy')}
             </span>
             <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
               <ChevronRight className="h-4 w-4" />
             </Button>
           </div>
           </div>
 
         {/* Legend */}
         <div className="flex flex-wrap gap-3 md:gap-4 mb-4 md:mb-6">
           <div className="flex items-center gap-1.5 text-xs md:text-sm">
             <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-info"></span>
             Follow-ups
           </div>
           <div className="flex items-center gap-1.5 text-xs md:text-sm">
             <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-success"></span>
             Infusions
           </div>
           <div className="flex items-center gap-1.5 text-xs md:text-sm">
             <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-destructive"></span>
             Monitoring
           </div>
           <div className="flex items-center gap-1.5 text-xs md:text-sm">
             <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-warning"></span>
             Shifts
           </div>
         </div>
 
         {/* Main content */}
         <div className="flex-1 flex gap-4 md:gap-6 min-h-0">
           {/* Calendar */}
           <Card className={cn(
             "flex-1 flex flex-col",
             !isMobile && selectedDate && "lg:flex-[2]"
           )}>
             <CardContent className="p-2 md:p-4 flex-1 flex flex-col">
               {/* Day headers */}
               <div className="grid grid-cols-7 mb-1 md:mb-2">
                 {(isMobile ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map((day, i) => (
                   <div key={i} className="text-center text-xs md:text-sm font-medium text-muted-foreground py-1 md:py-2">
                     {day}
                   </div>
                 ))}
               </div>
 
               {/* Calendar grid */}
               <div className="flex-1">
                 <CalendarGrid
                   days={days}
                   currentMonth={currentMonth}
                   events={events}
                   selectedDate={selectedDate}
                   onSelectDate={handleSelectDate}
                   startPadding={startPadding}
                   isMobile={isMobile}
                 />
               </div>
             </CardContent>
           </Card>
 
           {/* Desktop day detail panel */}
           {!isMobile && selectedDate && (
             <div className="hidden lg:block w-80 xl:w-96">
               <CalendarDayDetail
                 date={selectedDate}
                 events={selectedDayEvents}
                 onClose={handleCloseDetail}
               />
             </div>
           )}
         </div>
 
         {/* Mobile day detail sheet */}
         {isMobile && (
           <Sheet open={!!selectedDate} onOpenChange={(open) => !open && handleCloseDetail()}>
             <SheetContent side="bottom" className="h-[70vh] p-0 rounded-t-xl">
               <CalendarDayDetail
                 date={selectedDate}
                 events={selectedDayEvents}
                 onClose={handleCloseDetail}
                 isMobile
               />
             </SheetContent>
           </Sheet>
         )}
       </div>
     </AppLayout>
   );
 }