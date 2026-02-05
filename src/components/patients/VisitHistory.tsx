 import { useEffect, useState } from 'react';
 import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from '@/components/ui/alert-dialog';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { format } from 'date-fns';
 import { Calendar, FlaskConical, Image, ArrowRight, Pencil, Trash2 } from 'lucide-react';
 import { Paperclip } from 'lucide-react';
 import { toast } from 'sonner';
 import { EditVisitDialog } from './EditVisitDialog';
import DOMPurify from 'dompurify';
import { useAuditLog } from '@/hooks/useAuditLog';
import { VisitSummaryAssistant } from './VisitSummaryAssistant';
 
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
   attachments: string[] | null;
 }
 
 interface VisitHistoryProps {
   patientId: string;
   refreshKey?: number;
  patientCode?: string;
  diagnosisTags?: string[] | null;
 }
 
export function VisitHistory({ patientId, refreshKey, patientCode, diagnosisTags }: VisitHistoryProps) {
   const { user } = useAuth();
  const { logAccess } = useAuditLog();
   const [visits, setVisits] = useState<Visit[]>([]);
   const [loading, setLoading] = useState(true);
   const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
   const [deletingVisitId, setDeletingVisitId] = useState<string | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);
 
   const handleDownloadAttachment = async (path: string) => {
     const { data } = await supabase.storage
       .from('visit-attachments')
       .createSignedUrl(path, 3600);
     if (data?.signedUrl) {
       window.open(data.signedUrl, '_blank');
     }
   };
 
   const getAttachmentName = (path: string) => {
     const parts = path.split('/');
     const fileName = parts[parts.length - 1];
     const match = fileName.match(/^\d+-[a-z0-9]+-(.+)$/);
     return match ? match[1] : fileName;
   };
 
   const fetchVisits = async () => {
     if (!user) return;
     const { data, error } = await supabase
        .from('visits_secure')
       .select('*')
       .eq('patient_card_id', patientId)
       .eq('user_id', user.id)
       .order('visit_date', { ascending: false });
 
      if (data) {
         setVisits(data as Visit[]);
        // Log visit history access
        if (data.length > 0) {
          logAccess({
            action: 'view',
            resourceType: 'visit',
            resourceId: patientId,
            metadata: { visit_count: data.length }
          });
        }
      }
     setLoading(false);
   };
 
   const handleDeleteVisit = async () => {
     if (!deletingVisitId) return;
     setIsDeleting(true);
 
     const { error } = await supabase
       .from('visits')
       .delete()
       .eq('id', deletingVisitId);
 
     setIsDeleting(false);
     setDeletingVisitId(null);
 
     if (error) {
       toast.error('Failed to delete visit');
     } else {
       toast.success('Visit deleted');
        logAccess({
          action: 'delete',
          resourceType: 'visit',
          resourceId: deletingVisitId,
          metadata: { patient_id: patientId }
        });
       fetchVisits();
     }
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
      {/* AI Summary Assistant */}
      <VisitSummaryAssistant 
        visits={visits} 
        patientCode={patientCode || 'Unknown'} 
        diagnosisTags={diagnosisTags || null}
      />

       {visits.map((visit) => (
         <Card key={visit.id}>
           <CardHeader className="pb-2">
             <div className="flex items-center justify-between">
               <CardTitle className="text-base flex items-center gap-2">
                 <Calendar className="h-4 w-4 text-primary" />
                 {format(new Date(visit.visit_date), 'MMMM d, yyyy')}
               </CardTitle>
              <div className="flex items-center gap-2">
                {visit.disease_activity && Object.keys(visit.disease_activity).length > 0 && (
                  <Badge variant="outline" className="font-normal">
                    {typeof visit.disease_activity === 'object' && visit.disease_activity !== null && !Array.isArray(visit.disease_activity) && 
                      Object.entries(visit.disease_activity).map(([key, value]) => (
                        <span key={key} className="mr-2">{key}: {String(value)}</span>
                      ))
                    }
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditingVisit(visit)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeletingVisitId(visit.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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
                 <div 
                   className="text-sm prose prose-sm max-w-none" 
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(visit.next_steps) }} 
                 />
               </div>
             )}
             
             {visit.attachments && visit.attachments.length > 0 && (
               <div>
                 <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                   <Paperclip className="h-3 w-3" /> Attachments
                 </p>
                 <div className="flex flex-wrap gap-1.5">
                   {visit.attachments.map((attachment, idx) => (
                     <Badge 
                       key={idx} 
                       variant="outline" 
                       className="cursor-pointer hover:bg-muted"
                       onClick={() => handleDownloadAttachment(attachment)}
                     >
                       {getAttachmentName(attachment)}
                     </Badge>
                   ))}
                 </div>
               </div>
             )}
           </CardContent>
         </Card>
       ))}
       
       {editingVisit && (
         <EditVisitDialog
           visit={editingVisit}
           open={!!editingVisit}
           onOpenChange={(open) => !open && setEditingVisit(null)}
           onVisitUpdated={fetchVisits}
         />
       )}
       
       <AlertDialog open={!!deletingVisitId} onOpenChange={(open) => !open && setDeletingVisitId(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Visit</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to delete this visit? This action cannot be undone.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
             <AlertDialogAction
               onClick={handleDeleteVisit}
               disabled={isDeleting}
               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
             >
               {isDeleting ? 'Deleting...' : 'Delete'}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </div>
   );
 }