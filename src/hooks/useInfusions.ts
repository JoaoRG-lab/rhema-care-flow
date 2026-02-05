 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 import { addDays, format } from 'date-fns';
 
 export interface InfusionEvent {
   id: string;
   drug: string;
   interval_days: number;
   next_date: string;
   notes: string | null;
   patient_card_id: string | null;
   pre_checklist?: any;
   created_at?: string;
   updated_at?: string;
 }
 
 export interface CreateInfusionInput {
   drug: string;
   interval_days: number;
   next_date: string;
   notes?: string | null;
   patient_card_id?: string | null;
   pre_checklist?: any;
 }
 
 export function useInfusions() {
   const { user } = useAuth();
   const [infusions, setInfusions] = useState<InfusionEvent[]>([]);
   const [loading, setLoading] = useState(true);
 
   const fetchInfusions = useCallback(async () => {
     if (!user) return;
     setLoading(true);
 
     const { data, error } = await supabase
       .from('infusion_events_secure')
       .select('*')
       .eq('user_id', user.id)
       .order('next_date', { ascending: true });
 
     if (data) setInfusions(data as InfusionEvent[]);
     if (error) toast.error('Failed to load infusions');
     setLoading(false);
   }, [user]);
 
   useEffect(() => {
     fetchInfusions();
   }, [fetchInfusions]);
 
   const createInfusion = useCallback(async (input: CreateInfusionInput): Promise<boolean> => {
     if (!user) return false;
 
     const { error } = await supabase.from('infusion_events').insert({
       user_id: user.id,
       drug: input.drug,
       interval_days: input.interval_days,
       next_date: input.next_date,
       notes: input.notes || null,
       patient_card_id: input.patient_card_id || null,
       pre_checklist: input.pre_checklist || null,
     });
 
     if (error) {
       toast.error('Failed to create infusion');
       return false;
     }
 
     toast.success('Infusion scheduled');
     await fetchInfusions();
     return true;
   }, [user, fetchInfusions]);
 
   const markCompleted = useCallback(async (infusion: InfusionEvent): Promise<boolean> => {
     if (!user) return false;
 
     const newNextDate = addDays(new Date(infusion.next_date), infusion.interval_days);
 
     const { error } = await supabase
       .from('infusion_events')
       .update({ next_date: format(newNextDate, 'yyyy-MM-dd') })
       .eq('id', infusion.id)
       .eq('user_id', user.id);
 
     if (error) {
       toast.error('Failed to update');
       return false;
     }
 
     toast.success(`Next infusion scheduled for ${format(newNextDate, 'MMM d, yyyy')}`);
     await fetchInfusions();
     return true;
   }, [user, fetchInfusions]);
 
   const deleteInfusion = useCallback(async (id: string): Promise<boolean> => {
     if (!user) return false;
 
     const { error } = await supabase
       .from('infusion_events')
       .delete()
       .eq('id', id)
       .eq('user_id', user.id);
 
     if (error) {
       toast.error('Failed to delete infusion');
       return false;
     }
 
     toast.success('Infusion deleted');
     await fetchInfusions();
     return true;
   }, [user, fetchInfusions]);
 
   return {
     infusions,
     loading,
     fetchInfusions,
     createInfusion,
     markCompleted,
     deleteInfusion,
   };
 }