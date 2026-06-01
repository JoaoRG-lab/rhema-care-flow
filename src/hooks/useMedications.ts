import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface MedicationInstance {
  id: string;
  patient_id: string;
  problem_id: string | null;
  user_id: string;
  medication_name: string;
  dose: string | null;
  route: string | null;
  frequency: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'paused' | 'stopped' | 'completed' | 'planned';
  indication: string | null;
  safety_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useMedications(patientId?: string, problemId?: string) {
  const { user } = useAuth();
  const [medications, setMedications] = useState<MedicationInstance[]>([]);
  const [loading, setLoading] = useState(Boolean(patientId));
  const [error, setError] = useState<string | null>(null);

  const fetchMedications = useCallback(async () => {
    if (!patientId) {
      setMedications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let query = supabase
      .from('medication_instances')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (problemId) query = query.eq('problem_id', problemId);

    const { data, error: qErr } = await query;
    if (qErr) setError(qErr.message);
    setMedications((data ?? []) as MedicationInstance[]);
    setLoading(false);
  }, [patientId, problemId]);

  useEffect(() => { fetchMedications(); }, [fetchMedications]);

  const createMedication = useCallback(async (input: {
    medication_name: string;
    dose?: string | null;
    route?: string | null;
    frequency?: string | null;
    indication?: string | null;
    safety_notes?: string | null;
    start_date?: string | null;
    status?: MedicationInstance['status'];
  }) => {
    if (!patientId || !user) return { data: null, error: 'Paciente ou usuário ausente.' };

    const { data, error: insertErr } = await supabase
      .from('medication_instances')
      .insert({
        patient_id: patientId,
        problem_id: problemId ?? null,
        user_id: user.id,
        medication_name: input.medication_name,
        dose: input.dose ?? null,
        route: input.route ?? null,
        frequency: input.frequency ?? null,
        indication: input.indication ?? null,
        safety_notes: input.safety_notes ?? null,
        start_date: input.start_date ?? new Date().toISOString().slice(0, 10),
        status: input.status ?? 'active',
        metadata: {},
      })
      .select()
      .single();

    if (insertErr) return { data: null, error: insertErr.message };
    const created = data as MedicationInstance;
    setMedications((prev) => [created, ...prev]);
    return { data: created, error: null };
  }, [patientId, problemId, user]);

  const updateMedicationStatus = useCallback(async (medicationId: string, status: MedicationInstance['status']) => {
    const patch: Partial<MedicationInstance> = { status, end_date: status === 'active' ? null : new Date().toISOString().slice(0, 10) };
    const { data, error: updateErr } = await supabase
      .from('medication_instances')
      .update(patch)
      .eq('id', medicationId)
      .select()
      .single();

    if (updateErr) return { data: null, error: updateErr.message };
    const updated = data as MedicationInstance;
    setMedications((prev) => prev.map((med) => med.id === medicationId ? updated : med));
    return { data: updated, error: null };
  }, []);

  return { medications, loading, error, refetch: fetchMedications, createMedication, updateMedicationStatus };
}
