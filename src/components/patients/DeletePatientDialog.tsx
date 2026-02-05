 import { useState } from 'react';
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
 import { toast } from 'sonner';
import { useAuditLog } from '@/hooks/useAuditLog';
 
 interface DeletePatientDialogProps {
   patientId: string;
   patientCode: string;
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onDeleted: () => void;
 }
 
 export function DeletePatientDialog({ 
   patientId, 
   patientCode, 
   open, 
   onOpenChange, 
   onDeleted 
 }: DeletePatientDialogProps) {
  const { logAccess } = useAuditLog();
   const [deleting, setDeleting] = useState(false);
 
   const handleDelete = async () => {
     setDeleting(true);
 
     // Delete related records first (visits, monitoring events, score entries)
     await supabase.from('visits').delete().eq('patient_card_id', patientId);
     await supabase.from('monitoring_events').delete().eq('patient_card_id', patientId);
     await supabase.from('score_entries').delete().eq('patient_card_id', patientId);
     await supabase.from('infusion_events').delete().eq('patient_card_id', patientId);
 
     const { error } = await supabase
       .from('patient_cards')
       .delete()
       .eq('id', patientId);
 
     setDeleting(false);
 
     if (error) {
       toast.error('Failed to delete patient');
     } else {
       toast.success('Patient deleted');
        logAccess({
          action: 'delete',
          resourceType: 'patient_card',
          resourceId: patientId,
          metadata: { patient_code: patientCode }
        });
       onDeleted();
     }
   };
 
   return (
     <AlertDialog open={open} onOpenChange={onOpenChange}>
       <AlertDialogContent>
         <AlertDialogHeader>
           <AlertDialogTitle>Delete Patient Card</AlertDialogTitle>
           <AlertDialogDescription>
             Are you sure you want to delete <strong>{patientCode}</strong>? This will also delete all associated visits, monitoring events, and score entries. This action cannot be undone.
           </AlertDialogDescription>
         </AlertDialogHeader>
         <AlertDialogFooter>
           <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
           <AlertDialogAction
             onClick={handleDelete}
             disabled={deleting}
             className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
           >
             {deleting ? 'Deleting...' : 'Delete'}
           </AlertDialogAction>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
   );
 }