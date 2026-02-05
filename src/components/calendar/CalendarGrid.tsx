 import { format, isSameDay, isSameMonth, isToday } from 'date-fns';
 import { Users, Syringe, Briefcase, AlertTriangle } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import type { CalendarEvent } from './types';
 
 interface CalendarGridProps {
   days: Date[];
   currentMonth: Date;
   events: CalendarEvent[];
   selectedDate: Date | null;
   onSelectDate: (date: Date) => void;
   startPadding: number;
   isMobile?: boolean;
 }
 
 export function CalendarGrid({
   days,
   currentMonth,
   events,
   selectedDate,
   onSelectDate,
   startPadding,
   isMobile,
 }: CalendarGridProps) {
   const getEventsForDay = (date: Date) => {
     return events.filter(e => isSameDay(new Date(e.date), date));
   };
 
   const getEventIcon = (type: string) => {
     switch (type) {
       case 'followup': return <Users className="h-3 w-3" />;
       case 'infusion': return <Syringe className="h-3 w-3" />;
       case 'shift': return <Briefcase className="h-3 w-3" />;
       case 'monitoring': return <AlertTriangle className="h-3 w-3" />;
       default: return null;
     }
   };
 
   const getEventColor = (type: string) => {
     switch (type) {
       case 'followup': return 'bg-info/20 text-info';
       case 'infusion': return 'bg-success/20 text-success';
       case 'shift': return 'bg-warning/20 text-warning';
       case 'monitoring': return 'bg-destructive/20 text-destructive';
       default: return 'bg-muted';
     }
   };
 
   const getEventDot = (type: string) => {
     switch (type) {
       case 'followup': return 'bg-info';
       case 'infusion': return 'bg-success';
       case 'shift': return 'bg-warning';
       case 'monitoring': return 'bg-destructive';
       default: return 'bg-muted-foreground';
     }
   };
 
   if (isMobile) {
     return (
       <div className="grid grid-cols-7 gap-0.5">
         {/* Padding for start of month */}
         {Array.from({ length: startPadding }).map((_, i) => (
           <div key={`pad-${i}`} className="aspect-square p-0.5"></div>
         ))}
 
         {/* Days - Mobile compact view */}
         {days.map((day) => {
           const dayEvents = getEventsForDay(day);
           const isSelected = selectedDate && isSameDay(day, selectedDate);
           const eventTypes = [...new Set(dayEvents.map(e => e.type))];
           
           return (
             <button
               key={day.toISOString()}
               onClick={() => onSelectDate(day)}
               className={cn(
                 'aspect-square p-0.5 rounded-lg flex flex-col items-center justify-center transition-colors',
                 isToday(day) && 'bg-primary text-primary-foreground',
                 isSelected && !isToday(day) && 'bg-accent ring-2 ring-primary',
                 !isToday(day) && !isSelected && 'hover:bg-accent',
                 !isSameMonth(day, currentMonth) && 'opacity-40'
               )}
             >
               <span className={cn(
                 'text-sm font-medium',
                 isToday(day) && 'text-primary-foreground'
               )}>
                 {format(day, 'd')}
               </span>
               {eventTypes.length > 0 && (
                 <div className="flex gap-0.5 mt-0.5">
                   {eventTypes.slice(0, 3).map((type, i) => (
                     <span 
                       key={i} 
                       className={cn('w-1.5 h-1.5 rounded-full', getEventDot(type))}
                     />
                   ))}
                 </div>
               )}
             </button>
           );
         })}
       </div>
     );
   }
 
   // Desktop view
   return (
     <div className="grid grid-cols-7 gap-1">
       {/* Padding for start of month */}
       {Array.from({ length: startPadding }).map((_, i) => (
         <div key={`pad-${i}`} className="min-h-[100px] p-1"></div>
       ))}
 
       {/* Days */}
       {days.map((day) => {
         const dayEvents = getEventsForDay(day);
         const isSelected = selectedDate && isSameDay(day, selectedDate);
         
         return (
           <button
             key={day.toISOString()}
             onClick={() => onSelectDate(day)}
             className={cn(
               'min-h-[100px] p-1 border rounded-lg text-left transition-colors',
               isToday(day) && 'bg-accent border-primary',
               isSelected && !isToday(day) && 'ring-2 ring-primary border-primary',
               !isToday(day) && !isSelected && 'border-border hover:border-primary/50',
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
                     'text-xs px-1 py-0.5 rounded flex items-center gap-1 truncate',
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
           </button>
         );
       })}
     </div>
   );
 }