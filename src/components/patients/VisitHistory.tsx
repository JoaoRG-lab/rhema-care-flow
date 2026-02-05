 import { useEffect, useState } from 'react';
 import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { format } from 'date-fns';
 import { Calendar, FlaskConical, Image, ArrowRight } from 'lucide-react';
 
 import type { Json } from '@/integrations/supabase/types';
 
 interface Visit {
   id: string;
   visit_date: string;
   disease_activity: Json | null;
   actions: string[] | null;
   labs_ordered: string[] | null;
   imaging: string[] | null;
   next_steps: string | null;
   created_at: string;
 }
 
 interface VisitHistoryProps {
   patientId: string;
   refreshKey?: number;
 }
 
 export function VisitHistory({ patientId, refreshKey }: VisitHistoryProps) {
   const { user } = useAuth();
   const [visits, setVisits] = useState<Visit[]>([]);
   const [loading, setLoading] = useState(true);
 
   const fetchVisits = async () => {
     if (!user) return;
     const { data, error } = await supabase
       .from('visits')
       .select('*')
       .eq('patient_card_id', patientId)
       .eq('user_id', user.id)
       .order('visit_date', { ascending: false });
 
     if (data) setVisits(data);
     setLoading(false);
   };
 
   useEffect(() => {
     fetchVisits();
   }, [user, patientId, refreshKey]);
 
   if (loading) {
     return (
       <Card>
         <CardContent className="py-8 text-center text-muted-foreground">
           Loading visits...
         </CardContent>
       </Card>
     );
   }
 
   if (visits.length === 0) {
     return (
       <Card>
         <CardContent className="py-12 text-center">
           <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
           <p className="text-muted-foreground">No visits recorded yet</p>
           <p className="text-sm text-muted-foreground mt-1">Add a visit to start tracking</p>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <div className="space-y-4">
       {visits.map((visit) => (
         <Card key={visit.id}>
           <CardHeader className="pb-2">
             <div className="flex items-center justify-between">
               <CardTitle className="text-base flex items-center gap-2">
                 <Calendar className="h-4 w-4 text-primary" />
                 {format(new Date(visit.visit_date), 'MMMM d, yyyy')}
               </CardTitle>
               {visit.disease_activity && Object.keys(visit.disease_activity).length > 0 && (
               <Badge variant="outline" className="font-normal">
                 {typeof visit.disease_activity === 'object' && visit.disease_activity !== null && !Array.isArray(visit.disease_activity) && 
                   Object.entries(visit.disease_activity).map(([key, value]) => (
                     <span key={key} className="mr-2">{key}: {String(value)}</span>
                   ))
                 }
               </Badge>
               )}
             </div>
           </CardHeader>
           <CardContent className="space-y-3">
             {visit.actions && visit.actions.length > 0 && (
               <div>
                 <p className="text-sm font-medium text-muted-foreground mb-1">Actions</p>
                 <div className="flex flex-wrap gap-1.5">
                   {(visit.actions as string[]).map((action, idx) => (
                     <Badge key={idx} variant="secondary">{action}</Badge>
                   ))}
                 </div>
               </div>
             )}
 
             {visit.labs_ordered && visit.labs_ordered.length > 0 && (
               <div>
                 <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                   <FlaskConical className="h-3 w-3" /> Labs Ordered
                 </p>
                 <div className="flex flex-wrap gap-1.5">
                   {(visit.labs_ordered as string[]).map((lab, idx) => (
                     <Badge key={idx} variant="outline">{lab}</Badge>
                   ))}
                 </div>
               </div>
             )}
 
             {visit.imaging && visit.imaging.length > 0 && (
               <div>
                 <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                   <Image className="h-3 w-3" /> Imaging
                 </p>
                 <div className="flex flex-wrap gap-1.5">
                   {(visit.imaging as string[]).map((img, idx) => (
                     <Badge key={idx} variant="outline">{img}</Badge>
                   ))}
                 </div>
               </div>
             )}
 
             {visit.next_steps && (
               <div>
                 <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                   <ArrowRight className="h-3 w-3" /> Next Steps
                 </p>
                 <p className="text-sm">{visit.next_steps}</p>
               </div>
             )}
           </CardContent>
         </Card>
       ))}
     </div>
   );
 }