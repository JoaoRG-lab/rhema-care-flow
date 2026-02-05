 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 import { useAuditLog } from '@/hooks/useAuditLog';
 import type { PatientCard, CreatePatientInput, UpdatePatientInput } from '@/types/clinical';
 
 // Re-export types for convenience
 export type { PatientCard, CreatePatientInput, UpdatePatientInput };
 
 export function usePatients() {
   const { user } = useAuth();
   const { logAccess } = useAuditLog();
   const [patients, setPatients] = useState<PatientCard[]>([]);
   const [loading, setLoading] = useState(true);
 
   const fetchPatients = useCallback(async () => {
     if (!user) return;
     setLoading(true);
     const { data, error } = await supabase
       .from('patient_cards_secure')
       .select('*')
       .eq('user_id', user.id)
       .order('created_at', { ascending: false });
 
     if (data) setPatients(data as PatientCard[]);
     if (error) toast.error('Failed to load patients');
     setLoading(false);
   }, [user]);
 
   useEffect(() => {
     fetchPatients();
   }, [fetchPatients]);
 
   const createPatient = useCallback(async (input: CreatePatientInput): Promise<PatientCard | null> => {
     if (!user) return null;
 
     const { data, error } = await supabase.from('patient_cards').insert({
       user_id: user.id,
       patient_code: input.patient_code,
       mrn_last4: input.mrn_last4 || null,
       diagnosis_tags: input.diagnosis_tags || [],
       therapy_tags: input.therapy_tags || [],
       risk_flags: input.risk_flags || [],
       notes: input.notes || null,
       next_followup_date: input.next_followup_date || null,
     }).select().single();
 
     if (error) {
       toast.error('Failed to create patient card');
       return null;
     }
 
     toast.success('Patient card created');
     logAccess({
       action: 'create',
       resourceType: 'patient_card',
       resourceId: data?.id,
       metadata: { patient_code: input.patient_code }
     });
     await fetchPatients();
     return data as PatientCard;
   }, [user, fetchPatients, logAccess]);
 
   const updatePatient = useCallback(async (input: UpdatePatientInput): Promise<boolean> => {
     if (!user) return false;
 
     const { id, ...updateData } = input;
     const { error } = await supabase
       .from('patient_cards')
       .update(updateData)
       .eq('id', id)
       .eq('user_id', user.id);
 
     if (error) {
       toast.error('Failed to update patient');
       return false;
     }
 
     toast.success('Patient updated');
     logAccess({
       action: 'update',
       resourceType: 'patient_card',
       resourceId: id,
       metadata: { patient_code: updateData.patient_code }
     });
     await fetchPatients();
     return true;
   }, [user, fetchPatients, logAccess]);
 
   const deletePatient = useCallback(async (id: string): Promise<boolean> => {
     if (!user) return false;
 
     const { error } = await supabase
       .from('patient_cards')
       .delete()
       .eq('id', id)
       .eq('user_id', user.id);
 
     if (error) {
       toast.error('Failed to delete patient');
       return false;
     }
 
     toast.success('Patient deleted');
     logAccess({
       action: 'delete',
       resourceType: 'patient_card',
       resourceId: id,
     });
     await fetchPatients();
     return true;
   }, [user, fetchPatients, logAccess]);
 
   const getPatientById = useCallback(async (id: string): Promise<PatientCard | null> => {
     if (!user) return null;
 
     const { data, error } = await supabase
       .from('patient_cards_secure')
       .select('*')
       .eq('id', id)
       .eq('user_id', user.id)
       .maybeSingle();
 
     if (error || !data) return null;
 
     logAccess({
       action: 'view',
       resourceType: 'patient_card',
       resourceId: data.id,
       metadata: { patient_code: data.patient_code }
     });
 
     return data as PatientCard;
   }, [user, logAccess]);
 
   return {
     patients,
     loading,
     fetchPatients,
     createPatient,
     updatePatient,
     deletePatient,
     getPatientById,
   };
 }