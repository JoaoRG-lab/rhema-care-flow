 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Switch } from '@/components/ui/switch';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { ScrollArea } from '@/components/ui/scroll-area';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { 
   Clock, Send, AlertCircle, CheckCircle2, XCircle, Calendar, 
   Plus, Trash2, Settings, Bell, BellOff 
 } from 'lucide-react';
 import { useScheduledSms, ScheduledSMS } from '@/hooks/useScheduledSms';
 import { format, formatDistanceToNow, isPast } from 'date-fns';
 import { cn } from '@/lib/utils';
 
 interface ScheduledSmsManagerProps {
   patientCardId?: string;
   patientCode?: string;
 }
 
 export function ScheduledSmsManager({ patientCardId, patientCode }: ScheduledSmsManagerProps) {
   const {
     scheduledSms,
     preferences,
     loading,
     cancelScheduledSms,
     deleteScheduledSms,
     updatePreferences,
     getPendingSms,
     getSentSms,
     getFailedSms,
   } = useScheduledSms();
 
   const [showPreferences, setShowPreferences] = useState(false);
 
   const filteredSms = patientCardId 
     ? scheduledSms.filter(sms => sms.patient_card_id === patientCardId)
     : scheduledSms;
 
   const pending = patientCardId 
     ? getPendingSms().filter(sms => sms.patient_card_id === patientCardId)
     : getPendingSms();
   const sent = patientCardId 
     ? getSentSms().filter(sms => sms.patient_card_id === patientCardId)
     : getSentSms();
   const failed = patientCardId 
     ? getFailedSms().filter(sms => sms.patient_card_id === patientCardId)
     : getFailedSms();
 
   const getStatusIcon = (status: ScheduledSMS['status']) => {
     switch (status) {
       case 'pending': return <Clock className="h-4 w-4 text-warning" />;
       case 'sent': return <CheckCircle2 className="h-4 w-4 text-success" />;
       case 'failed': return <AlertCircle className="h-4 w-4 text-destructive" />;
       case 'cancelled': return <XCircle className="h-4 w-4 text-muted-foreground" />;
     }
   };
 
   const getStatusBadge = (status: ScheduledSMS['status']) => {
     const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
       pending: 'secondary',
       sent: 'default',
       failed: 'destructive',
       cancelled: 'outline',
     };
     return <Badge variant={variants[status]}>{status}</Badge>;
   };
 
   const getReminderTypeBadge = (type: ScheduledSMS['reminder_type']) => {
     const labels = { '24h': '24h before', '1h': '1h before', 'custom': 'Custom' };
     return <Badge variant="outline" className="text-xs">{labels[type]}</Badge>;
   };
 
   const renderSmsList = (smsList: ScheduledSMS[]) => {
     if (smsList.length === 0) {
       return (
         <div className="text-center py-8 text-muted-foreground">
           <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
           <p className="text-sm">No messages</p>
         </div>
       );
     }
 
     return (
       <div className="space-y-2">
         {smsList.map((sms) => (
           <div
             key={sms.id}
             className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
           >
             <div className="flex items-start justify-between gap-2">
               <div className="flex items-center gap-2">
                 {getStatusIcon(sms.status)}
                 <div>
                   <p className="text-sm font-medium">{sms.phone_number}</p>
                   <p className="text-xs text-muted-foreground">
                     {sms.status === 'pending' 
                       ? `Scheduled ${formatDistanceToNow(new Date(sms.scheduled_for), { addSuffix: true })}`
                       : sms.status === 'sent'
                       ? `Sent ${format(new Date(sms.sent_at!), 'MMM d, h:mm a')}`
                       : format(new Date(sms.scheduled_for), 'MMM d, h:mm a')
                     }
                   </p>
                 </div>
               </div>
               <div className="flex items-center gap-1">
                 {getReminderTypeBadge(sms.reminder_type)}
                 {getStatusBadge(sms.status)}
               </div>
             </div>
             <p className="text-sm mt-2 line-clamp-2 text-muted-foreground">
               {sms.message}
             </p>
             {sms.error_message && (
               <p className="text-xs text-destructive mt-1">{sms.error_message}</p>
             )}
             {sms.status === 'pending' && (
               <div className="flex gap-2 mt-2">
                 <Button
                   variant="outline"
                   size="sm"
                   className="text-xs h-7"
                   onClick={() => cancelScheduledSms(sms.id)}
                 >
                   Cancel
                 </Button>
               </div>
             )}
             {(sms.status === 'cancelled' || sms.status === 'failed') && (
               <Button
                 variant="ghost"
                 size="sm"
                 className="text-xs h-7 mt-2 text-destructive"
                 onClick={() => deleteScheduledSms(sms.id)}
               >
                 <Trash2 className="h-3 w-3 mr-1" />
                 Delete
               </Button>
             )}
           </div>
         ))}
       </div>
     );
   };
 
   if (loading) {
     return (
       <Card>
         <CardContent className="p-6">
           <div className="animate-pulse space-y-3">
             <div className="h-4 bg-muted rounded w-1/3" />
             <div className="h-20 bg-muted rounded" />
           </div>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card>
       <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <CardTitle className="text-base flex items-center gap-2">
             <Clock className="h-4 w-4" />
             Scheduled SMS
             {pending.length > 0 && (
               <Badge variant="secondary" className="ml-1">{pending.length}</Badge>
             )}
           </CardTitle>
           <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
             <DialogTrigger asChild>
               <Button variant="ghost" size="icon" className="h-8 w-8">
                 <Settings className="h-4 w-4" />
               </Button>
             </DialogTrigger>
             <DialogContent>
               <DialogHeader>
                 <DialogTitle>SMS Reminder Preferences</DialogTitle>
               </DialogHeader>
               <div className="space-y-4 mt-4">
                 <div className="flex items-center justify-between">
                   <div>
                     <Label>24-hour reminder</Label>
                     <p className="text-xs text-muted-foreground">
                       Automatically schedule SMS 24h before appointments
                     </p>
                   </div>
                   <Switch
                     checked={preferences?.auto_schedule_24h ?? true}
                     onCheckedChange={(checked) => updatePreferences({ auto_schedule_24h: checked })}
                   />
                 </div>
                 <div className="flex items-center justify-between">
                   <div>
                     <Label>1-hour reminder</Label>
                     <p className="text-xs text-muted-foreground">
                       Automatically schedule SMS 1h before appointments
                     </p>
                   </div>
                   <Switch
                     checked={preferences?.auto_schedule_1h ?? true}
                     onCheckedChange={(checked) => updatePreferences({ auto_schedule_1h: checked })}
                   />
                 </div>
               </div>
             </DialogContent>
           </Dialog>
         </div>
       </CardHeader>
       <CardContent>
         <Tabs defaultValue="pending" className="w-full">
           <TabsList className="grid w-full grid-cols-3 mb-3">
             <TabsTrigger value="pending" className="gap-1 text-xs">
               <Clock className="h-3 w-3" />
               Pending ({pending.length})
             </TabsTrigger>
             <TabsTrigger value="sent" className="gap-1 text-xs">
               <CheckCircle2 className="h-3 w-3" />
               Sent ({sent.length})
             </TabsTrigger>
             <TabsTrigger value="failed" className="gap-1 text-xs">
               <AlertCircle className="h-3 w-3" />
               Failed ({failed.length})
             </TabsTrigger>
           </TabsList>
 
           <ScrollArea className="h-[250px]">
             <TabsContent value="pending" className="mt-0">
               {renderSmsList(pending)}
             </TabsContent>
             <TabsContent value="sent" className="mt-0">
               {renderSmsList(sent)}
             </TabsContent>
             <TabsContent value="failed" className="mt-0">
               {renderSmsList(failed)}
             </TabsContent>
           </ScrollArea>
         </Tabs>
       </CardContent>
     </Card>
   );
 }