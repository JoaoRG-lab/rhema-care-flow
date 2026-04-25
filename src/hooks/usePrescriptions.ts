/**
 * usePrescriptions
 * CRUD for the `prescriptions` table.
 * Each prescription belongs to a patient_id and clinician (user_id).
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type PrescriptionStatus = 'draft' | 'signed' | 'dispensed' | 'cancelled';

export interface PrescriptionItem {
  drug: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  patient_id: string;
  user_id: string;
  status: PrescriptionStatus;
  items: PrescriptionItem[];
  notes: string;
  cid10: string;
  signature_data_url: string | null;
  signature_hash: string | null;
  signed_at: string | null;
  signed_by_name: string | null;
  signed_by_crm: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePrescriptionInput {
  patient_id: string;
  items: PrescriptionItem[];
  notes?: string;
  cid10?: string;
  status?: PrescriptionStatus;
  signature_data_url?: string | null;
  signature_hash?: string | null;
  signed_at?: string | null;
  signed_by_name?: string | null;
  signed_by_crm?: string | null;
}

export function usePrescriptions(patientId?: string) {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPrescriptions = useCallback(async () => {
    if (!user || !patientId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prescriptions' as any)
        .select('*')
        .eq('patient_id', patientId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPrescriptions((data ?? []) as Prescription[]);
    } catch (e: any) {
      toast.error('Erro ao carregar prescrições: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [user, patientId]);

  const createPrescription = useCallback(async (input: CreatePrescriptionInput): Promise<Prescription | null> => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('prescriptions' as any)
        .insert({ ...input, user_id: user.id, status: input.status ?? 'draft' })
        .select()
        .single();
      if (error) throw error;
      await fetchPrescriptions();
      toast.success('Prescrição criada com sucesso');
      return data as Prescription;
    } catch (e: any) {
      toast.error('Erro ao criar prescrição: ' + e.message);
      return null;
    }
  }, [user, fetchPrescriptions]);

  const signPrescription = useCallback(async (
    id: string,
    signatureDataUrl: string,
    options: { name: string; crm: string },
  ): Promise<boolean> => {
    if (!user) return false;
    try {
      // Compute a deterministic hash of the signature for verification
      const encoder = new TextEncoder();
      const buf = await crypto.subtle.digest('SHA-256', encoder.encode(signatureDataUrl + id));
      const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase
        .from('prescriptions' as any)
        .update({
          status: 'signed',
          signature_data_url: signatureDataUrl,
          signature_hash: hash,
          signed_at: new Date().toISOString(),
          signed_by_name: options.name,
          signed_by_crm: options.crm,
        } as any)
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      await fetchPrescriptions();
      toast.success('Prescrição assinada com sucesso');
      return true;
    } catch (e: any) {
      toast.error('Erro ao assinar: ' + e.message);
      return false;
    }
  }, [user, fetchPrescriptions]);

  const cancelPrescription = useCallback(async (id: string): Promise<void> => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('prescriptions' as any)
        .update({ status: 'cancelled' } as any)
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      await fetchPrescriptions();
      toast.success('Prescrição cancelada');
    } catch (e: any) {
      toast.error('Erro ao cancelar: ' + e.message);
    }
  }, [user, fetchPrescriptions]);

  const deletePrescription = useCallback(async (id: string): Promise<void> => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('prescriptions' as any)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      await fetchPrescriptions();
      toast.success('Prescrição removida');
    } catch (e: any) {
      toast.error('Erro ao remover: ' + e.message);
    }
  }, [user, fetchPrescriptions]);

  return {
    prescriptions,
    loading,
    fetchPrescriptions,
    createPrescription,
    signPrescription,
    cancelPrescription,
    deletePrescription,
  };
}
