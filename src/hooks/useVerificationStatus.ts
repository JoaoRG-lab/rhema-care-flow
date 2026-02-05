 import { useState, useEffect } from 'react';
 import { useAuth } from '@/contexts/AuthContext';
 import { supabase } from '@/integrations/supabase/client';
 import type { VerificationTier } from '@/components/ui/VerifiedBadge';
 
 export interface VerificationStatus {
   status: 'pending' | 'under_review' | 'approved' | 'rejected' | null;
   tier: VerificationTier;
   loading: boolean;
 }
 
 export function useVerificationStatus() {
   const { user } = useAuth();
   const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
     status: null,
     tier: null,
     loading: true,
   });
 
   useEffect(() => {
     const fetchStatus = async () => {
       if (!user) {
         setVerificationStatus({ status: null, tier: null, loading: false });
         return;
       }
 
       try {
         const { data, error } = await supabase
           .from('verification_requests')
           .select('status, tier')
           .eq('user_id', user.id)
           .order('created_at', { ascending: false })
           .limit(1)
           .maybeSingle();
 
         if (error) throw error;
 
         setVerificationStatus({
           status: data?.status as VerificationStatus['status'] ?? null,
           tier: data?.tier as VerificationTier ?? null,
           loading: false,
         });
       } catch (error) {
         console.error('Error fetching verification status:', error);
         setVerificationStatus({ status: null, tier: null, loading: false });
       }
     };
 
     fetchStatus();
   }, [user]);
 
   return verificationStatus;
 }