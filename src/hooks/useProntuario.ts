import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ProntuarioEntry } from '../types';

export function useProntuario(patientId: string) {
  const [entries, setEntries] = useState<ProntuarioEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('prontuario_entries')
        .select(`
          *,
          author:profiles(id, full_name, avatar_url, role)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (qErr) throw new Error(qErr.message);
      setEntries((data ?? []) as ProntuarioEntry[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar prontuario.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const addEntry = useCallback(async (
    entry: Omit<ProntuarioEntry, 'id' | 'created_at' | 'updated_at' | 'author'>
  ) => {
    const { data, error } = await supabase
      .from('prontuario_entries')
      .insert(entry)
      .select(`*, author:profiles(id, full_name, avatar_url, role)`)
      .single();
    if (error) return { data: null, error: error.message };
    setEntries((prev) => [data as ProntuarioEntry, ...prev]);
    return { data: data as ProntuarioEntry, error: null };
  }, []);

  const updateEntry = useCallback(async (id: string, content: string) => {
    const { data, error } = await supabase
      .from('prontuario_entries')
      .update({ content })
      .eq('id', id)
      .select(`*, author:profiles(id, full_name, avatar_url, role)`)
      .single();
    if (error) return { data: null, error: error.message };
    setEntries((prev) => prev.map((e) => e.id === id ? (data as ProntuarioEntry) : e));
    return { data: data as ProntuarioEntry, error: null };
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase.from('prontuario_entries').delete().eq('id', id);
    if (error) return { error: error.message };
    setEntries((prev) => prev.filter((e) => e.id !== id));
    return { error: null };
  }, []);

  return { entries, loading, error, refetch: fetchEntries, addEntry, updateEntry, deleteEntry };
}
