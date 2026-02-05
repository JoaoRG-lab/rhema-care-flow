 import { format, isBefore, isToday } from 'date-fns';
 import { Link } from 'react-router-dom';
 import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { 
   Users, 
   Syringe, 
   Briefcase, 
   AlertTriangle, 
   X, 
   Clock,
   ChevronRight 
 } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import type { CalendarEvent } from './types';
 
 interface CalendarDayDetailProps {
   date: Date | null;
   events: CalendarEvent[];
   onClose: () => void;
   isMobile?: boolean;
 }
 
 export function CalendarDayDetail({ date, events, onClose, isMobile }: CalendarDayDetailProps) {
   if (!date) return null;
 
   const getEventIcon = (type: string) => {
     switch (type) {
       case 'followup': return <Users className="h-4 w-4" />;
       case 'infusion': return <Syringe className="h-4 w-4" />;
       case 'shift': return <Briefcase className="h-4 w-4" />;
       case 'monitoring': return <AlertTriangle className="h-4 w-4" />;
       default: return <Clock className="h-4 w-4" />;
     }
   };
 
   const getEventColor = (type: string) => {
     switch (type) {
       case 'followup': return 'bg-info/10 text-info border-info/30';
       case 'infusion': return 'bg-success/10 text-success border-success/30';
       case 'shift': return 'bg-warning/10 text-warning border-warning/30';
       case 'monitoring': return 'bg-destructive/10 text-destructive border-destructive/30';
       default: return 'bg-muted';
     }
   };
 
   const getEventLabel = (type: string) => {
     switch (type) {
       case 'followup': return 'Follow-up';
       case 'infusion': return 'Infusion';
       case 'shift': return 'Shift';
       case 'monitoring': return 'Monitoring';
       default: return 'Event';
     }
   };
 
   const isOverdue = (event: CalendarEvent) => {
     return event.type === 'monitoring' && isBefore(new Date(event.date), new Date()) && !isToday(new Date(event.date));
   };
 
   const groupedEvents = events.reduce((acc, event) => {
     if (!acc[event.type]) acc[event.type] = [];
     acc[event.type].push(event);
     return acc;
   }, {} as Record<string, CalendarEvent[]>);
 
   return (
     <Card className={cn(
       "h-full flex flex-col",
       isMobile && "rounded-none border-0"
     )}>
       <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
         <div>
           <CardTitle className="text-base md:text-lg">
             {format(date, 'EEEE, MMMM d')}
           </CardTitle>
           {isToday(date) && (
             <Badge variant="outline" className="mt-1 text-xs bg-primary/10 text-primary border-primary/30">
               Today
             </Badge>
           )}
         </div>
         <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
           <X className="h-4 w-4" />
         </Button>
       </CardHeader>
       <CardContent className="flex-1 p-0 overflow-hidden">
         <ScrollArea className="h-full">
           <div className="p-4 space-y-4">
             {events.length === 0 ? (
               <p className="text-muted-foreground text-sm text-center py-8">
                 No events scheduled for this day
               </p>
             ) : (
               Object.entries(groupedEvents).map(([type, typeEvents]) => (
                 <div key={type}>
                   <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                     {getEventIcon(type)}
                     {getEventLabel(type)}s ({typeEvents.length})
                   </h4>
                   <div className="space-y-2">
                     {typeEvents.map((event) => (
                       <div
                         key={event.id}
                         className={cn(
                           "p-3 rounded-lg border flex items-center justify-between gap-2",
                           getEventColor(event.type),
                           isOverdue(event) && "ring-2 ring-destructive/50"
                         )}
                       >
                         <div className="flex-1 min-w-0">
                           <p className="font-medium text-sm truncate">{event.title}</p>
                           {event.subtitle && (
                             <p className="text-xs opacity-80 truncate">{event.subtitle}</p>
                           )}
                           {isOverdue(event) && (
                             <Badge variant="destructive" className="mt-1 text-[10px] px-1.5 py-0">
                               Overdue
                             </Badge>
                           )}
                         </div>
                         {event.patientId && (
                           <Link to={`/patients/${event.patientId}`}>
                             <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                               <ChevronRight className="h-4 w-4" />
                             </Button>
                           </Link>
                         )}
                       </div>
                     ))}
                   </div>
                 </div>
               ))
             )}
           </div>
         </ScrollArea>
       </CardContent>
     </Card>
   );
 }