 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { useAuditLog } from '@/hooks/useAuditLog';
 import { toast } from 'sonner';
 import type { Visit } from '@/types/clinical';
 
 interface UseVisitsOptions {
   patientId: string;
   refreshKey?: number;
 }
 
 interface UseVisitsReturn {
   visits: Visit[];
   loading: boolean;
   error: string | null;
   refetch: () => Promise<void>;
   deleteVisit: (visitId: string) => Promise<boolean>;
   isDeleting: boolean;
 }
 
 export function useVisits({ patientId, refreshKey }: UseVisitsOptions): UseVisitsReturn {
   const { user } = useAuth();
   const { logAccess } = useAuditLog();
   const [visits, setVisits] = useState<Visit[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);
 
   const fetchVisits = useCallback(async () => {
     if (!user) {
       setLoading(false);
       return;
     }
 
     setLoading(true);
     setError(null);
 
     try {
       const { data, error: fetchError } = await supabase
         .from('visits_secure')
         .select('*')
         .eq('patient_card_id', patientId)
         .eq('user_id', user.id)
         .order('visit_date', { ascending: false });
 
       if (fetchError) {
         throw fetchError;
       }
 
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
     } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'Failed to fetch visits';
       setError(errorMessage);
       console.error('Error fetching visits:', err);
     } finally {
       setLoading(false);
     }
   }, [user, patientId, logAccess]);
 
   const deleteVisit = useCallback(async (visitId: string): Promise<boolean> => {
     setIsDeleting(true);
 
     try {
       const { error: deleteError } = await supabase
         .from('visits')
         .delete()
         .eq('id', visitId);
 
       if (deleteError) {
         throw deleteError;
       }
 
       toast.success('Visit deleted');
       logAccess({
         action: 'delete',
         resourceType: 'visit',
         resourceId: visitId,
         metadata: { patient_id: patientId }
       });
 
       // Refresh the visits list
       await fetchVisits();
       return true;
     } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'Failed to delete visit';
       toast.error(errorMessage);
       console.error('Error deleting visit:', err);
       return false;
     } finally {
       setIsDeleting(false);
     }
   }, [patientId, fetchVisits, logAccess]);
 
   useEffect(() => {
     fetchVisits();
   }, [fetchVisits, refreshKey]);
 
   return {
     visits,
     loading,
     error,
     refetch: fetchVisits,
     deleteVisit,
     isDeleting,
   };
 }