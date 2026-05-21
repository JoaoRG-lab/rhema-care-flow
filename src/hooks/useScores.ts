import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ScoreEntry } from '../types';

export function useScores(patientId: string) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('score_entries')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (qErr) throw new Error(qErr.message);
      setScores((data ?? []) as ScoreEntry[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar scores.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  const saveScore = useCallback(async (
    scoreType: string,
    scoreValue: number,
    visitId?: string,
    metadata?: Record<string, unknown>,
  ) => {
    const { data, error } = await supabase
      .from('score_entries')
      .insert({
        patient_id:  patientId,
        visit_id:    visitId ?? null,
        score_type:  scoreType,
        score_value: scoreValue,
        metadata:    metadata ?? null,
      })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    setScores((prev) => [data as ScoreEntry, ...prev]);
    return { data: data as ScoreEntry, error: null };
  }, [patientId]);

  const latestByType = useCallback((type: string) => {
    return scores.find((s) => s.score_type === type) ?? null;
  }, [scores]);

  return { scores, loading, error, refetch: fetchScores, saveScore, latestByType };
}
