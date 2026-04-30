/**
 * usePrescriptions
 * CRUD for the `prescriptions` table.
 * Each prescription belongs to a patient_id and clinician (user_id).
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { rxLog, describeError } from '@/lib/prescriptionLogger';

export interface RxError {
  stage: string;
  message: string;
  at: string;
}

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

export type PrescriptionInsert = CreatePrescriptionInput & {
  user_id: string;
  status: PrescriptionStatus;
};

export type PrescriptionUpdate = Partial<
  Omit<Prescription, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

/**
 * Typed query wrapper for the `prescriptions` table.
 *
 * The table is not present in the generated `Database` types, so the default
 * client widens its responses into `SelectQueryError` unions. This wrapper
 * narrows the responses back to strict `Prescription` rows for reads and
 * accepts well-typed insert/update payloads for writes — keeping all the
 * casting in a single place instead of every call site.
 */
type QueryResult<T> = { data: T | null; error: { message: string } | null };

const prescriptionsTable = () => {
  // Single `unknown` cast: the rest of the API is fully typed downstream.
  const table = (supabase as unknown as {
    from: (name: string) => any;
  }).from('prescriptions');

  return {
    selectAllForPatient: (
      patientId: string,
      userId: string,
    ): Promise<QueryResult<Prescription[]>> =>
      table
        .select('*')
        .eq('patient_id', patientId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

    insertOne: (payload: PrescriptionInsert): Promise<QueryResult<Prescription>> =>
      table.insert(payload).select().single(),

    updateForUser: (
      id: string,
      userId: string,
      payload: PrescriptionUpdate,
    ): Promise<QueryResult<null>> =>
      table.update(payload).eq('id', id).eq('user_id', userId),

    deleteForUser: (id: string, userId: string): Promise<QueryResult<null>> =>
      table.delete().eq('id', id).eq('user_id', userId),
  };
};

export function usePrescriptions(patientId?: string) {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<RxError | null>(null);

  const recordError = useCallback((stage: string, e: unknown) => {
    const { message } = describeError(e);
    setLastError({ stage, message, at: new Date().toISOString() });
  }, []);

  const clearLastError = useCallback(() => setLastError(null), []);

  const fetchPrescriptions = useCallback(async () => {
    if (!user || !patientId) return;
    setLoading(true);
    rxLog.info('fetch:start', { patientId });
    try {
      const { data, error } = await prescriptionsTable().selectAllForPatient(
        patientId,
        user.id,
      );
      if (error) throw error;
      setPrescriptions(data ?? []);
      rxLog.info('fetch:success', { patientId, count: data?.length ?? 0 });
    } catch (e: any) {
      rxLog.error('fetch:failed', { patientId, error: describeError(e) });
      recordError('fetch', e);
      toast.error('Erro ao carregar prescrições: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [user, patientId, recordError]);

  const createPrescription = useCallback(
    async (input: CreatePrescriptionInput): Promise<Prescription | null> => {
      if (!user) return null;
      rxLog.info('create:start', {
        patientId: input.patient_id,
        itemCount: input.items?.length ?? 0,
        hasCid10: !!input.cid10,
        status: input.status ?? 'draft',
      });
      try {
        const { data, error } = await prescriptionsTable().insertOne({
          ...input,
          user_id: user.id,
          status: input.status ?? 'draft',
        });
        if (error) throw error;
        rxLog.info('create:success', { rxId: data?.id, patientId: input.patient_id });
        await fetchPrescriptions();
        toast.success('Prescrição criada com sucesso');
        return data;
      } catch (e: any) {
        rxLog.error('create:failed', {
          patientId: input.patient_id,
          itemCount: input.items?.length ?? 0,
          error: describeError(e),
        });
        recordError('create', e);
        toast.error('Erro ao criar prescrição: ' + e.message);
        return null;
      }
    },
    [user, fetchPrescriptions, recordError],
  );

  const signPrescription = useCallback(
    async (
      id: string,
      signatureDataUrl: string,
      options: { name: string; crm: string },
    ): Promise<boolean> => {
      if (!user) return false;
      rxLog.info('sign:start', {
        rxId: id,
        signatureBytes: signatureDataUrl?.length ?? 0,
        hasName: !!options.name,
        hasCrm: !!options.crm,
      });
      try {
        const encoder = new TextEncoder();
        const buf = await crypto.subtle.digest(
          'SHA-256',
          encoder.encode(signatureDataUrl + id),
        );
        const hash = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        const { error } = await prescriptionsTable().updateForUser(id, user.id, {
          status: 'signed',
          signature_data_url: signatureDataUrl,
          signature_hash: hash,
          signed_at: new Date().toISOString(),
          signed_by_name: options.name,
          signed_by_crm: options.crm,
        });
        if (error) throw error;
        rxLog.info('sign:success', { rxId: id, hashPrefix: hash.slice(0, 12) });
        await fetchPrescriptions();
        toast.success('Prescrição assinada com sucesso');
        return true;
      } catch (e: any) {
        rxLog.error('sign:failed', { rxId: id, error: describeError(e) });
        recordError('sign', e);
        toast.error('Erro ao assinar: ' + e.message);
        return false;
      }
    },
    [user, fetchPrescriptions, recordError],
  );

  const cancelPrescription = useCallback(
    async (id: string): Promise<void> => {
      if (!user) return;
      rxLog.info('cancel:start', { rxId: id });
      try {
        const { error } = await prescriptionsTable().updateForUser(id, user.id, {
          status: 'cancelled',
        });
        if (error) throw error;
        rxLog.info('cancel:success', { rxId: id });
        await fetchPrescriptions();
        toast.success('Prescrição cancelada');
      } catch (e: any) {
        rxLog.error('cancel:failed', { rxId: id, error: describeError(e) });
        recordError('cancel', e);
        toast.error('Erro ao cancelar: ' + e.message);
      }
    },
    [user, fetchPrescriptions, recordError],
  );

  const deletePrescription = useCallback(
    async (id: string): Promise<void> => {
      if (!user) return;
      rxLog.info('delete:start', { rxId: id });
      try {
        const { error } = await prescriptionsTable().deleteForUser(id, user.id);
        if (error) throw error;
        rxLog.info('delete:success', { rxId: id });
        await fetchPrescriptions();
        toast.success('Prescrição removida');
      } catch (e: any) {
        rxLog.error('delete:failed', { rxId: id, error: describeError(e) });
        recordError('delete', e);
        toast.error('Erro ao remover: ' + e.message);
      }
    },
    [user, fetchPrescriptions, recordError],
  );

  return {
    prescriptions,
    loading,
    lastError,
    clearLastError,
    fetchPrescriptions,
    createPrescription,
    signPrescription,
    cancelPrescription,
    deletePrescription,
  };
}
