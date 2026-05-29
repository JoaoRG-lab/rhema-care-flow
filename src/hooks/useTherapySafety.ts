import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { TherapySafetyChecklistRecord } from '../types';

export function useTherapySafety(patientId?: string) {
  const { user } = useAuth();
  const [record, setRecord] = useState<TherapySafetyChecklistRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(patientId));
  const [error, setError] = useState<string | null>(null);

  const fetchLatest = useCallback(async () => {
    if (!patientId) {
      setRecord(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('therapy_safety_checklists')
        .select('*')
        .eq('patient_id', patientId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (qErr) throw new Error(qErr.message);
      setRecord((data ?? null) as TherapySafetyChecklistRecord | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar checklist terapêutico.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetchLatest(); }, [fetchLatest]);

  const saveChecklist = useCallback(async (params: { checklist: Record<string, boolean>; completion: number; notes?: string | null }) => {
    if (!patientId || !user) return { data: null, error: 'Paciente ou usuário ausente.' };

    const payload = {
      patient_id: patientId,
      user_id: user.id,
      checklist: params.checklist,
      completion: params.completion,
      notes: params.notes ?? null,
    };

    const query = record?.id
      ? supabase.from('therapy_safety_checklists').update(payload).eq('id', record.id).select().single()
      : supabase.from('therapy_safety_checklists').insert(payload).select().single();

    const { data, error: saveErr } = await query;
    if (saveErr) return { data: null, error: saveErr.message };
    setRecord(data as TherapySafetyChecklistRecord);
    return { data: data as TherapySafetyChecklistRecord, error: null };
  }, [patientId, user, record?.id]);

  return { record, loading, error, refetch: fetchLatest, saveChecklist };
}
