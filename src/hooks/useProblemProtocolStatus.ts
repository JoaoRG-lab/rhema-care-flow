import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface ProblemProtocolStatus {
  id: string;
  patient_id: string;
  problem_id: string;
  user_id: string;
  protocol_item_id: string;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useProblemProtocolStatus(patientId?: string, problemId?: string) {
  const { user } = useAuth();
  const [items, setItems] = useState<ProblemProtocolStatus[]>([]);
  const [loading, setLoading] = useState(Boolean(patientId && problemId));
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!patientId || !problemId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: qErr } = await supabase
      .from('problem_protocol_status')
      .select('*')
      .eq('patient_id', patientId)
      .eq('problem_id', problemId);

    if (qErr) setError(qErr.message);
    setItems((data ?? []) as ProblemProtocolStatus[]);
    setLoading(false);
  }, [patientId, problemId]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const byItemId = useMemo(() => new Map(items.map((item) => [item.protocol_item_id, item])), [items]);

  const toggleItem = useCallback(async (protocolItemId: string, completed: boolean) => {
    if (!patientId || !problemId || !user) return { data: null, error: 'Paciente, problema ou usuário ausente.' };

    const payload = {
      patient_id: patientId,
      problem_id: problemId,
      user_id: user.id,
      protocol_item_id: protocolItemId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
      completed_by: completed ? user.id : null,
    };

    const { data, error: upsertErr } = await supabase
      .from('problem_protocol_status')
      .upsert(payload, { onConflict: 'problem_id,protocol_item_id' })
      .select()
      .single();

    if (upsertErr) return { data: null, error: upsertErr.message };
    const saved = data as ProblemProtocolStatus;
    setItems((prev) => [saved, ...prev.filter((item) => item.protocol_item_id !== protocolItemId)]);
    return { data: saved, error: null };
  }, [patientId, problemId, user]);

  const saveNotes = useCallback(async (protocolItemId: string, notes: string) => {
    if (!patientId || !problemId || !user) return { data: null, error: 'Paciente, problema ou usuário ausente.' };

    const existing = byItemId.get(protocolItemId);
    const payload = {
      patient_id: patientId,
      problem_id: problemId,
      user_id: user.id,
      protocol_item_id: protocolItemId,
      completed: existing?.completed ?? false,
      completed_at: existing?.completed_at ?? null,
      completed_by: existing?.completed_by ?? null,
      notes,
    };

    const { data, error: upsertErr } = await supabase
      .from('problem_protocol_status')
      .upsert(payload, { onConflict: 'problem_id,protocol_item_id' })
      .select()
      .single();

    if (upsertErr) return { data: null, error: upsertErr.message };
    const saved = data as ProblemProtocolStatus;
    setItems((prev) => [saved, ...prev.filter((item) => item.protocol_item_id !== protocolItemId)]);
    return { data: saved, error: null };
  }, [patientId, problemId, user, byItemId]);

  return { items, byItemId, loading, error, refetch: fetchStatus, toggleItem, saveNotes };
}
