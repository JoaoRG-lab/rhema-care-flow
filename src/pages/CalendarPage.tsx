 import { useEffect, useState } from 'react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, Syringe, Briefcase } from 'lucide-react';
 import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
 import { cn } from '@/lib/utils';
 
 interface CalendarEvent {
   id: string;
   date: string;
   type: 'followup' | 'infusion' | 'shift';
   title: string;
 }
 
 export default function CalendarPage() {
   const { user } = useAuth();
   const [currentMonth, setCurrentMonth] = useState(new Date());
   const [events, setEvents] = useState<CalendarEvent[]>([]);
   const [loading, setLoading] = useState(true);
 
   useEffect(() => {
     if (!user) return;
 
     const fetchEvents = async () => {
       const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
       const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
 
       const calendarEvents: CalendarEvent[] = [];
 
       // Fetch patient followups
       const { data: patients } = await supabase
          .from('patient_cards_secure')
         .select('id, patient_code, next_followup_date')
         .eq('user_id', user.id)
         .gte('next_followup_date', monthStart)
         .lte('next_followup_date', monthEnd);
 
       if (patients) {
         patients.forEach(p => {
           if (p.next_followup_date) {
             calendarEvents.push({
               id: p.id,
               date: p.next_followup_date,
               type: 'followup',
               title: p.patient_code,
             });
           }
         });
       }
 
       // Fetch infusions
       const { data: infusions } = await supabase
          .from('infusion_events_secure')
         .select('id, drug, next_date')
         .eq('user_id', user.id)
         .gte('next_date', monthStart)
         .lte('next_date', monthEnd);
 
       if (infusions) {
         infusions.forEach(inf => {
           calendarEvents.push({
             id: inf.id,
             date: inf.next_date,
             type: 'infusion',
             title: inf.drug,
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
             id: s.id,
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
 
   const days = eachDayOfInterval({
     start: startOfMonth(currentMonth),
     end: endOfMonth(currentMonth),
   });
 
   const startPadding = startOfMonth(currentMonth).getDay();
 
   const getEventsForDay = (date: Date) => {
     return events.filter(e => isSameDay(new Date(e.date), date));
   };
 
   const getEventIcon = (type: string) => {
     switch (type) {
       case 'followup': return <Users className="h-3 w-3" />;
       case 'infusion': return <Syringe className="h-3 w-3" />;
       case 'shift': return <Briefcase className="h-3 w-3" />;
       default: return null;
     }
   };
 
   const getEventColor = (type: string) => {
     switch (type) {
       case 'followup': return 'bg-info/10 text-info border-info/30';
       case 'infusion': return 'bg-success/10 text-success border-success/30';
       case 'shift': return 'bg-warning/10 text-warning border-warning/30';
       default: return 'bg-muted';
     }
   };
 
   return (
     <AppLayout>
       <div className="p-6 lg:p-8">
         <div className="flex items-center justify-between mb-6">
           <div>
             <h1 className="text-2xl font-bold flex items-center gap-2">
               <CalendarIcon className="h-6 w-6 text-primary" />
               Calendar
             </h1>
             <p className="text-muted-foreground">Follow-ups, infusions, and shifts</p>
           </div>
           <div className="flex items-center gap-2">
             <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
               <ChevronLeft className="h-4 w-4" />
             </Button>
             <span className="font-medium min-w-[140px] text-center">
               {format(currentMonth, 'MMMM yyyy')}
             </span>
             <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
               <ChevronRight className="h-4 w-4" />
             </Button>
           </div>
         </div>
 
         {/* Legend */}
         <div className="flex gap-4 mb-6">
           <div className="flex items-center gap-2 text-sm">
             <span className="w-3 h-3 rounded-full bg-info/30"></span>
             Follow-ups
           </div>
           <div className="flex items-center gap-2 text-sm">
             <span className="w-3 h-3 rounded-full bg-success/30"></span>
             Infusions
           </div>
           <div className="flex items-center gap-2 text-sm">
             <span className="w-3 h-3 rounded-full bg-warning/30"></span>
             Shifts
           </div>
         </div>
 
         <Card>
           <CardContent className="p-4">
             {/* Day headers */}
             <div className="grid grid-cols-7 mb-2">
               {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                 <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                   {day}
                 </div>
               ))}
             </div>
 
             {/* Calendar grid */}
             <div className="grid grid-cols-7 gap-1">
               {/* Padding for start of month */}
               {Array.from({ length: startPadding }).map((_, i) => (
                 <div key={`pad-${i}`} className="min-h-[100px] p-1"></div>
               ))}
 
               {/* Days */}
               {days.map((day) => {
                 const dayEvents = getEventsForDay(day);
                 return (
                   <div
                     key={day.toISOString()}
                     className={cn(
                       'min-h-[100px] p-1 border rounded-lg',
                       isToday(day) ? 'bg-accent border-primary' : 'border-border',
                       !isSameMonth(day, currentMonth) && 'opacity-50'
                     )}
                   >
                     <div className={cn(
                       'text-sm font-medium mb-1 text-center',
                       isToday(day) && 'text-primary'
                     )}>
                       {format(day, 'd')}
                     </div>
                     <div className="space-y-1">
                       {dayEvents.slice(0, 3).map((event) => (
                         <div
                           key={event.id}
                           className={cn(
                             'text-xs px-1 py-0.5 rounded border flex items-center gap-1 truncate',
                             getEventColor(event.type)
                           )}
                         >
                           {getEventIcon(event.type)}
                           <span className="truncate">{event.title}</span>
                         </div>
                       ))}
                       {dayEvents.length > 3 && (
                         <div className="text-xs text-muted-foreground text-center">
                           +{dayEvents.length - 3} more
                         </div>
                       )}
                     </div>
                   </div>
                 );
               })}
             </div>
           </CardContent>
         </Card>
       </div>
     </AppLayout>
   );
 }