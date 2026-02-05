 import { useEffect, useState } from 'react';
 import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { Badge } from '@/components/ui/badge';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { Shield, Plus, Check, Clock, AlertTriangle } from 'lucide-react';
 import { format, isBefore } from 'date-fns';
 import { toast } from 'sonner';
 import { EVENT_TYPES } from '@/config/clinical';
 
 interface MonitoringEvent {
   id: string;
   event_type: string;
   due_date: string;
   status: string;
   completed_at: string | null;
   notes: string | null;
 }
 
 interface PatientMonitoringProps {
   patientId: string;
   refreshKey?: number;
 }
 
 export function PatientMonitoring({ patientId, refreshKey }: PatientMonitoringProps) {
   const { user } = useAuth();
   const [events, setEvents] = useState<MonitoringEvent[]>([]);
   const [loading, setLoading] = useState(true);
   const [isOpen, setIsOpen] = useState(false);
   const [eventType, setEventType] = useState('');
   const [dueDate, setDueDate] = useState('');
   const [notes, setNotes] = useState('');
 
   const fetchEvents = async () => {
     if (!user) return;
     const { data, error } = await supabase
        .from('monitoring_events_secure')
       .select('*')
       .eq('patient_card_id', patientId)
       .eq('user_id', user.id)
       .order('due_date', { ascending: true });
 
      if (data) setEvents(data as MonitoringEvent[]);
     setLoading(false);
   };
 
   useEffect(() => {
     fetchEvents();
   }, [user, patientId, refreshKey]);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user) return;
 
     const { error } = await supabase.from('monitoring_events').insert({
       user_id: user.id,
       patient_card_id: patientId,
       event_type: eventType,
       due_date: dueDate,
       notes: notes || null,
       status: 'pending',
     });
 
     if (error) {
       toast.error('Failed to create event');
     } else {
       toast.success('Monitoring event added');
       setIsOpen(false);
       setEventType('');
       setDueDate('');
       setNotes('');
       fetchEvents();
     }
   };
 
   const markComplete = async (id: string) => {
     const { error } = await supabase
       .from('monitoring_events')
       .update({ status: 'completed', completed_at: new Date().toISOString() })
       .eq('id', id);
 
     if (!error) {
       toast.success('Marked complete');
       fetchEvents();
     }
   };
 
   const pendingEvents = events.filter(e => e.status === 'pending');
   const completedEvents = events.filter(e => e.status === 'completed');
   const overdueEvents = pendingEvents.filter(e => isBefore(new Date(e.due_date), new Date()));
   const upcomingEvents = pendingEvents.filter(e => !isBefore(new Date(e.due_date), new Date()));
 
   if (loading) {
     return (
       <Card>
         <CardContent className="py-8 text-center text-muted-foreground">
           Loading monitoring events...
         </CardContent>
       </Card>
     );
   }
 
   return (
     <div className="space-y-4">
       <div className="flex items-center justify-between">
         <h3 className="font-semibold flex items-center gap-2">
           <Shield className="h-4 w-4 text-primary" />
           Safety Monitoring
         </h3>
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
           <DialogTrigger asChild>
             <Button size="sm" variant="outline" className="gap-1">
               <Plus className="h-3 w-3" />
               Add
             </Button>
           </DialogTrigger>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Add Monitoring Event</DialogTitle>
             </DialogHeader>
             <form onSubmit={handleSubmit} className="space-y-4 mt-4">
               <div>
                 <Label>Event Type</Label>
                 <Select value={eventType} onValueChange={setEventType}>
                   <SelectTrigger className="mt-1">
                     <SelectValue placeholder="Select type" />
                   </SelectTrigger>
                   <SelectContent>
                     {EVENT_TYPES.map((type) => (
                       <SelectItem key={type} value={type}>{type}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label>Due Date</Label>
                 <Input
                   type="date"
                   value={dueDate}
                   onChange={(e) => setDueDate(e.target.value)}
                   required
                   className="mt-1"
                 />
               </div>
               <div>
                 <Label>Notes</Label>
                 <Input
                   value={notes}
                   onChange={(e) => setNotes(e.target.value)}
                   placeholder="Optional notes..."
                   className="mt-1"
                 />
               </div>
               <Button type="submit" className="w-full">Add Event</Button>
             </form>
           </DialogContent>
         </Dialog>
       </div>
 
       {events.length === 0 ? (
         <Card>
           <CardContent className="py-8 text-center">
             <Shield className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
             <p className="text-muted-foreground text-sm">No monitoring events for this patient</p>
             <p className="text-xs text-muted-foreground mt-1">Add labs, screenings, or vaccine reminders</p>
           </CardContent>
         </Card>
       ) : (
         <div className="space-y-3">
           {/* Overdue */}
           {overdueEvents.length > 0 && (
             <Card className="border-destructive/50">
               <CardHeader className="py-3 pb-2">
                 <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                   <AlertTriangle className="h-4 w-4" />
                   Overdue ({overdueEvents.length})
                 </CardTitle>
               </CardHeader>
               <CardContent className="py-2">
                 <div className="space-y-2">
                   {overdueEvents.map((event) => (
                     <div key={event.id} className="flex items-center justify-between p-2 bg-destructive/5 rounded">
                       <div>
                         <p className="text-sm font-medium">{event.event_type}</p>
                         <p className="text-xs text-muted-foreground">
                           Due: {format(new Date(event.due_date), 'MMM d, yyyy')}
                         </p>
                       </div>
                       <Button size="sm" variant="ghost" onClick={() => markComplete(event.id)}>
                         <Check className="h-4 w-4" />
                       </Button>
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>
           )}
 
           {/* Upcoming */}
           {upcomingEvents.length > 0 && (
             <Card>
               <CardHeader className="py-3 pb-2">
                 <CardTitle className="text-sm flex items-center gap-2">
                   <Clock className="h-4 w-4 text-info" />
                   Upcoming ({upcomingEvents.length})
                 </CardTitle>
               </CardHeader>
               <CardContent className="py-2">
                 <div className="space-y-2">
                   {upcomingEvents.map((event) => (
                     <div key={event.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                       <div>
                         <p className="text-sm font-medium">{event.event_type}</p>
                         <p className="text-xs text-muted-foreground">
                           Due: {format(new Date(event.due_date), 'MMM d, yyyy')}
                         </p>
                       </div>
                       <Button size="sm" variant="ghost" onClick={() => markComplete(event.id)}>
                         <Check className="h-4 w-4" />
                       </Button>
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>
           )}
 
           {/* Completed */}
           {completedEvents.length > 0 && (
             <Card>
               <CardHeader className="py-3 pb-2">
                 <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                   <Check className="h-4 w-4" />
                   Completed ({completedEvents.length})
                 </CardTitle>
               </CardHeader>
               <CardContent className="py-2">
                 <div className="space-y-2">
                   {completedEvents.slice(0, 5).map((event) => (
                     <div key={event.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                       <div>
                         <p className="text-sm font-medium">{event.event_type}</p>
                         <p className="text-xs text-muted-foreground">
                           {event.completed_at && format(new Date(event.completed_at), 'MMM d, yyyy')}
                         </p>
                       </div>
                       <Badge variant="secondary" className="text-xs">Done</Badge>
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>
           )}
         </div>
       )}
     </div>
   );
 }