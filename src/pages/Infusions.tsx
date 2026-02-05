 import { useEffect, useState } from 'react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { Syringe, Plus, Calendar, Clock } from 'lucide-react';
 import { format, addDays, differenceInDays } from 'date-fns';
 import { toast } from 'sonner';
 
 interface InfusionEvent {
   id: string;
   drug: string;
   interval_days: number;
   next_date: string;
   notes: string | null;
   patient_card_id: string | null;
 }
 
 const BIOLOGIC_DRUGS = [
   { name: 'Infliximab', defaultInterval: 56 },
   { name: 'Rituximab', defaultInterval: 180 },
   { name: 'Abatacept IV', defaultInterval: 28 },
   { name: 'Tocilizumab IV', defaultInterval: 28 },
   { name: 'Belimumab', defaultInterval: 28 },
   { name: 'Secukinumab', defaultInterval: 28 },
   { name: 'Vedolizumab', defaultInterval: 56 },
 ];
 
 export default function Infusions() {
   const { user } = useAuth();
   const [infusions, setInfusions] = useState<InfusionEvent[]>([]);
   const [isOpen, setIsOpen] = useState(false);
   const [loading, setLoading] = useState(true);
 
   // Form state
   const [drug, setDrug] = useState('');
   const [intervalDays, setIntervalDays] = useState<number>(28);
   const [nextDate, setNextDate] = useState('');
   const [notes, setNotes] = useState('');
 
   const fetchInfusions = async () => {
     if (!user) return;
     const { data, error } = await supabase
        .from('infusion_events_secure')
       .select('*')
       .eq('user_id', user.id)
       .order('next_date', { ascending: true });
 
      if (data) setInfusions(data as InfusionEvent[]);
     if (error) toast.error('Failed to load infusions');
     setLoading(false);
   };
 
   useEffect(() => {
     fetchInfusions();
   }, [user]);
 
   const handleDrugChange = (selectedDrug: string) => {
     setDrug(selectedDrug);
     const drugInfo = BIOLOGIC_DRUGS.find(d => d.name === selectedDrug);
     if (drugInfo) {
       setIntervalDays(drugInfo.defaultInterval);
     }
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!user) return;
 
     const { error } = await supabase.from('infusion_events').insert({
       user_id: user.id,
       drug,
       interval_days: intervalDays,
       next_date: nextDate,
       notes: notes || null,
     });
 
     if (error) {
       toast.error('Failed to create infusion');
     } else {
       toast.success('Infusion scheduled');
       setIsOpen(false);
       setDrug('');
       setIntervalDays(28);
       setNextDate('');
       setNotes('');
       fetchInfusions();
     }
   };
 
   const markCompleted = async (infusion: InfusionEvent) => {
     // Update to next scheduled date
     const newNextDate = addDays(new Date(infusion.next_date), infusion.interval_days);
     
     const { error } = await supabase
       .from('infusion_events')
       .update({ next_date: format(newNextDate, 'yyyy-MM-dd') })
       .eq('id', infusion.id);
 
     if (error) {
       toast.error('Failed to update');
     } else {
       toast.success(`Next infusion scheduled for ${format(newNextDate, 'MMM d, yyyy')}`);
       fetchInfusions();
     }
   };
 
   const getDaysUntil = (dateStr: string) => {
     return differenceInDays(new Date(dateStr), new Date());
   };
 
   return (
     <AppLayout>
       <div className="p-6 lg:p-8">
         <div className="flex items-center justify-between mb-6">
           <div>
             <h1 className="text-2xl font-bold flex items-center gap-2">
               <Syringe className="h-6 w-6 text-primary" />
               Infusion Coordination
             </h1>
             <p className="text-muted-foreground">Track biologic infusion schedules</p>
           </div>
           <Dialog open={isOpen} onOpenChange={setIsOpen}>
             <DialogTrigger asChild>
               <Button className="gap-2">
                 <Plus className="h-4 w-4" />
                 Schedule Infusion
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>Schedule New Infusion</DialogTitle>
               </DialogHeader>
               <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                 <div>
                   <Label>Drug</Label>
                   <Select value={drug} onValueChange={handleDrugChange}>
                     <SelectTrigger className="mt-1">
                       <SelectValue placeholder="Select drug" />
                     </SelectTrigger>
                     <SelectContent>
                       {BIOLOGIC_DRUGS.map((d) => (
                         <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 <div>
                   <Label>Interval (days)</Label>
                   <Input
                     type="number"
                     min={1}
                     value={intervalDays}
                     onChange={(e) => setIntervalDays(Number(e.target.value))}
                     className="mt-1"
                   />
                 </div>
                 <div>
                   <Label>Next Infusion Date</Label>
                   <Input
                     type="date"
                     value={nextDate}
                     onChange={(e) => setNextDate(e.target.value)}
                     required
                     className="mt-1"
                   />
                 </div>
                 <div>
                   <Label>Notes</Label>
                   <Input
                     value={notes}
                     onChange={(e) => setNotes(e.target.value)}
                     placeholder="Pre-infusion checklist, etc."
                     className="mt-1"
                   />
                 </div>
                 <Button type="submit" className="w-full">Schedule</Button>
               </form>
             </DialogContent>
           </Dialog>
         </div>
 
         {/* Infusion Cards */}
         {loading ? (
           <div className="text-center py-12 text-muted-foreground">Loading...</div>
         ) : infusions.length === 0 ? (
           <Card>
             <CardContent className="py-12 text-center">
               <Syringe className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
               <p className="text-muted-foreground">No infusions scheduled</p>
               <p className="text-sm text-muted-foreground mt-1">Schedule your first infusion to get started</p>
             </CardContent>
           </Card>
         ) : (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
             {infusions.map((infusion) => {
               const daysUntil = getDaysUntil(infusion.next_date);
               const isOverdue = daysUntil < 0;
               const isToday = daysUntil === 0;
               const isSoon = daysUntil > 0 && daysUntil <= 7;
 
               return (
                 <Card key={infusion.id} className={isOverdue ? 'border-destructive/50' : ''}>
                   <CardHeader className="pb-2">
                     <CardTitle className="text-lg flex items-center justify-between">
                       {infusion.drug}
                       <span className={`text-xs px-2 py-1 rounded-full ${
                         isOverdue ? 'status-overdue' : 
                         isToday ? 'status-pending' : 
                         isSoon ? 'bg-info/10 text-info' : 
                         'bg-muted text-muted-foreground'
                       }`}>
                         {isOverdue ? 'Overdue' : isToday ? 'Today' : isSoon ? 'Soon' : `${daysUntil}d`}
                       </span>
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="space-y-3">
                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                         <Calendar className="h-4 w-4" />
                         {format(new Date(infusion.next_date), 'EEEE, MMM d, yyyy')}
                       </div>
                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                         <Clock className="h-4 w-4" />
                         Every {infusion.interval_days} days
                       </div>
                       {infusion.notes && (
                         <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                           {infusion.notes}
                         </p>
                       )}
                       <Button 
                         size="sm" 
                         variant="outline" 
                         className="w-full"
                         onClick={() => markCompleted(infusion)}
                       >
                         Mark Complete & Schedule Next
                       </Button>
                     </div>
                   </CardContent>
                 </Card>
               );
             })}
           </div>
         )}
       </div>
     </AppLayout>
   );
 }