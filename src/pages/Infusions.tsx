 import { useState } from 'react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { useInfusions, InfusionEvent } from '@/hooks/useInfusions';
 import { BIOLOGIC_DRUGS } from '@/config/clinical';
 import { Syringe, Plus, Calendar, Clock } from 'lucide-react';
 import { format, differenceInDays } from 'date-fns';
 
 export default function Infusions() {
   const { infusions, loading, createInfusion, markCompleted } = useInfusions();
   const [isOpen, setIsOpen] = useState(false);
 
   // Form state
   const [drug, setDrug] = useState('');
   const [intervalDays, setIntervalDays] = useState<number>(28);
   const [nextDate, setNextDate] = useState('');
   const [notes, setNotes] = useState('');
 
   const handleDrugChange = (selectedDrug: string) => {
     setDrug(selectedDrug);
     const drugInfo = BIOLOGIC_DRUGS.find(d => d.name === selectedDrug);
     if (drugInfo) {
       setIntervalDays(drugInfo.defaultInterval);
     }
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
 
     const success = await createInfusion({
       drug,
       interval_days: intervalDays,
       next_date: nextDate,
       notes: notes || null,
     });
 
     if (success) {
       setIsOpen(false);
       setDrug('');
       setIntervalDays(28);
       setNextDate('');
       setNotes('');
     }
   };
 
   const handleMarkCompleted = async (infusion: InfusionEvent) => {
     await markCompleted(infusion);
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
                         onClick={() => handleMarkCompleted(infusion)}
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