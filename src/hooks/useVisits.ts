import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Visit, VisitStatus } from '../types';

export function useVisits(patientId?: string) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from('visits')
        .select(`
          *,
          patient:patient_cards(id, full_name, patient_code),
          provider:profiles(id, full_name, avatar_url)
        `)
        .order('scheduled_at', { ascending: false });

      if (patientId) q = q.eq('patient_id', patientId);

      const { data, error: qErr } = await q;
      if (qErr) throw new Error(qErr.message);
      setVisits((data ?? []) as Visit[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar visitas.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const createVisit = useCallback(async (visit: Omit<Visit, 'id' | 'created_at' | 'updated_at' | 'patient' | 'provider'>) => {
    const { data, error } = await supabase
      .from('visits')
      .insert(visit)
      .select(`*, patient:patient_cards(id, full_name, patient_code), provider:profiles(id, full_name, avatar_url)`)
      .single();
    if (error) return { data: null, error: error.message };
    setVisits((prev) => [data as Visit, ...prev]);
    return { data: data as Visit, error: null };
  }, []);

  const updateStatus = useCallback(async (id: string, status: VisitStatus) => {
    const { data, error } = await supabase
      .from('visits')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    setVisits((prev) => prev.map((v) => v.id === id ? { ...v, status } : v));
    return { data: data as Visit, error: null };
  }, []);

  return { visits, loading, error, refetch: fetch, createVisit, updateStatus };
}
