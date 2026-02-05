 import { useEffect, useState } from 'react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { Shield, Plus, Check, Clock, AlertTriangle, User } from 'lucide-react';
 import { format, isBefore } from 'date-fns';
 import { toast } from 'sonner';
 import { Link } from 'react-router-dom';
 
 interface MonitoringEvent {
   id: string;
   event_type: string;
   due_date: string;
   status: string;
   completed_at: string | null;
   notes: string | null;
   patient_card_id: string | null;
   patient_cards?: { patient_code: string } | null;
 }
 
 interface PatientCard {
   id: string;
   patient_code: string;
 }
 
 const EVENT_TYPES = [
   'CBC',
   'LFTs',
   'Creatinine',
   'Lipid Panel',
   'TB Screening',
   'HBV Screening',
   'HCV Screening',
   'Flu Vaccine',
   'Pneumococcal Vaccine',
   'COVID Vaccine',
   'Eye Exam (HCQ)',
   'Chest X-ray',
 ];
 
 const MED_CLASS_RECOMMENDATIONS = {
   MTX: ['CBC', 'LFTs', 'Creatinine'],
   LEF: ['CBC', 'LFTs'],
   AZA: ['CBC', 'LFTs'],
   MMF: ['CBC', 'LFTs', 'Creatinine'],
   HCQ: ['Eye Exam (HCQ)'],
   Biologics: ['TB Screening', 'HBV Screening', 'HCV Screening', 'CBC'],
   'JAK-i': ['CBC', 'LFTs', 'Lipid Panel', 'TB Screening'],
 };
 
 export default function Monitoring() {
   const { user } = useAuth();
   const [events, setEvents] = useState<MonitoringEvent[]>([]);
   const [patients, setPatients] = useState<PatientCard[]>([]);
   const [isOpen, setIsOpen] = useState(false);
   const [loading, setLoading] = useState(true);
 
   // Form state
   const [eventType, setEventType] = useState('');
   const [dueDate, setDueDate] = useState('');
   const [notes, setNotes] = useState('');
   const [selectedPatientId, setSelectedPatientId] = useState<string>('');
 
   const fetchEvents = async () => {
     if (!user) return;
     const { data, error } = await supabase
        .from('monitoring_events_secure')
         .select('*')
       .eq('user_id', user.id)
       .order('due_date', { ascending: true });
 
      if (data) {
         // Fetch patient codes separately to avoid join issues with views
         const patientIds = [...new Set(data.filter(e => e.patient_card_id).map(e => e.patient_card_id!))];
         let patientMap: Record<string, string> = {};
         
         if (patientIds.length > 0) {
           const { data: patientData } = await supabase
             .from('patient_cards_secure')
             .select('id, patient_code')
             .in('id', patientIds);
           
           if (patientData) {
             patientMap = Object.fromEntries(patientData.map(p => [p.id, p.patient_code]));
           }
         }
         
         const mappedEvents = data.map((e: any) => ({
           ...e,
           patient_cards: e.patient_card_id ? { patient_code: patientMap[e.patient_card_id] || 'Unknown' } : null
         }));
         setEvents(mappedEvents as MonitoringEvent[]);
      }
     if (error) toast.error('Failed to load events');
     setLoading(false);
   };
 
   const fetchPatients = async () => {
     if (!user) return;
     const { data } = await supabase
        .from('patient_cards_secure')
       .select('id, patient_code')
       .eq('user_id', user.id)
       .order('patient_code');
      if (data) setPatients(data as PatientCard[]);
   };
 
   useEffect(() => {
     fetchEvents();
     fetchPatients();
   }, [user]);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user) return;
 
     const { error } = await supabase.from('monitoring_events').insert({
       user_id: user.id,
       event_type: eventType,
       due_date: dueDate,
       notes: notes || null,
       status: 'pending',
       patient_card_id: selectedPatientId || null,
     });
 
     if (error) {
       toast.error('Failed to create event');
     } else {
       toast.success('Monitoring event created');
       setIsOpen(false);
       setEventType('');
       setDueDate('');
       setNotes('');
       setSelectedPatientId('');
       fetchEvents();
     }
   };
 
   const markComplete = async (id: string) => {
     const { error } = await supabase
       .from('monitoring_events')
       .update({ status: 'completed', completed_at: new Date().toISOString() })
       .eq('id', id);
 
     if (error) {
       toast.error('Failed to update');
     } else {
       toast.success('Marked complete');
       fetchEvents();
     }
   };
 
   const pendingEvents = events.filter(e => e.status === 'pending');
   const completedEvents = events.filter(e => e.status === 'completed');
   const overdueEvents = pendingEvents.filter(e => isBefore(new Date(e.due_date), new Date()));
   const upcomingEvents = pendingEvents.filter(e => !isBefore(new Date(e.due_date), new Date()));
 
   return (
     <AppLayout>
       <div className="p-6 lg:p-8">
         <div className="flex items-center justify-between mb-6">
           <div>
             <h1 className="text-2xl font-bold flex items-center gap-2">
               <Shield className="h-6 w-6 text-primary" />
               Safety Monitoring
             </h1>
             <p className="text-muted-foreground">Track labs, screenings, and vaccines</p>
           </div>
           <Dialog open={isOpen} onOpenChange={setIsOpen}>
             <DialogTrigger asChild>
               <Button className="gap-2">
                 <Plus className="h-4 w-4" />
                 Add Event
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>New Monitoring Event</DialogTitle>
               </DialogHeader>
               <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                 <div>
                     <Label>Patient (Optional)</Label>
                     <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                       <SelectTrigger className="mt-1">
                         <SelectValue placeholder="General (no patient)" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="">General (no patient)</SelectItem>
                         {patients.map((patient) => (
                           <SelectItem key={patient.id} value={patient.id}>{patient.patient_code}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
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
                 <Button type="submit" className="w-full">Create Event</Button>
               </form>
             </DialogContent>
           </Dialog>
         </div>
 
         {/* Quick Reference */}
         <Card className="mb-6">
           <CardHeader>
             <CardTitle className="text-base">Monitoring by Medication Class</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
               {Object.entries(MED_CLASS_RECOMMENDATIONS).map(([med, tests]) => (
                 <div key={med} className="p-3 bg-muted/50 rounded-lg">
                   <p className="font-medium text-sm mb-1">{med}</p>
                   <p className="text-xs text-muted-foreground">{tests.join(', ')}</p>
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>
 
         <Tabs defaultValue="pending" className="space-y-6">
           <TabsList>
             <TabsTrigger value="pending" className="gap-2">
               <Clock className="h-4 w-4" />
               Pending ({pendingEvents.length})
             </TabsTrigger>
             <TabsTrigger value="completed" className="gap-2">
               <Check className="h-4 w-4" />
               Completed ({completedEvents.length})
             </TabsTrigger>
           </TabsList>
 
           <TabsContent value="pending">
             {overdueEvents.length > 0 && (
               <Card className="mb-4 border-destructive/50">
                 <CardHeader className="pb-2">
                   <CardTitle className="text-base flex items-center gap-2 text-destructive">
                     <AlertTriangle className="h-4 w-4" />
                     Overdue ({overdueEvents.length})
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-2">
                     {overdueEvents.map((event) => (
                       <div key={event.id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
                         <div>
                           <p className="font-medium text-sm">{event.event_type}</p>
                           <p className="text-xs text-muted-foreground">
                             Due: {format(new Date(event.due_date), 'MMM d, yyyy')}
                           </p>
                             {event.patient_cards && (
                               <Link to={`/patients/${event.patient_card_id}`} className="text-xs text-primary hover:underline">
                                 {event.patient_cards.patient_code}
                               </Link>
                             )}
                         </div>
                         <Button size="sm" variant="outline" onClick={() => markComplete(event.id)}>
                           <Check className="h-4 w-4" />
                         </Button>
                       </div>
                     ))}
                   </div>
                 </CardContent>
               </Card>
             )}
 
             <Card>
               <CardHeader>
                 <CardTitle className="text-base">Upcoming</CardTitle>
               </CardHeader>
               <CardContent>
                 {upcomingEvents.length === 0 ? (
                   <p className="text-muted-foreground text-sm text-center py-4">No upcoming events</p>
                 ) : (
                   <div className="space-y-2">
                     {upcomingEvents.map((event) => (
                       <div key={event.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                         <div>
                           <p className="font-medium text-sm">{event.event_type}</p>
                           <p className="text-xs text-muted-foreground">
                             Due: {format(new Date(event.due_date), 'MMM d, yyyy')}
                           </p>
                             {event.patient_cards && (
                               <Link to={`/patients/${event.patient_card_id}`} className="text-xs text-primary hover:underline">
                                 {event.patient_cards.patient_code}
                               </Link>
                             )}
                         </div>
                         <Button size="sm" variant="outline" onClick={() => markComplete(event.id)}>
                           <Check className="h-4 w-4" />
                         </Button>
                       </div>
                     ))}
                   </div>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
 
           <TabsContent value="completed">
             <Card>
               <CardContent className="pt-6">
                 {completedEvents.length === 0 ? (
                   <p className="text-muted-foreground text-sm text-center py-4">No completed events</p>
                 ) : (
                   <div className="space-y-2">
                     {completedEvents.slice(0, 20).map((event) => (
                       <div key={event.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                         <div>
                           <p className="font-medium text-sm">{event.event_type}</p>
                           <p className="text-xs text-muted-foreground">
                             Completed: {event.completed_at && format(new Date(event.completed_at), 'MMM d, yyyy')}
                           </p>
                             {event.patient_cards && (
                               <Link to={`/patients/${event.patient_card_id}`} className="text-xs text-primary hover:underline">
                                 {event.patient_cards.patient_code}
                               </Link>
                             )}
                         </div>
                         <span className="status-completed text-xs px-2 py-1 rounded-full">Done</span>
                       </div>
                     ))}
                   </div>
                 )}
               </CardContent>
             </Card>
           </TabsContent>
         </Tabs>
       </div>
     </AppLayout>
   );
 }