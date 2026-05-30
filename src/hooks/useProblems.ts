import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ProblemFollowup, ProblemGoal, ProblemInstance, ProblemSeverity, ProblemStatus } from '../types';

export function useProblems(patientId?: string) {
  const { user } = useAuth();
  const [problems, setProblems] = useState<ProblemInstance[]>([]);
  const [loading, setLoading] = useState(Boolean(patientId));
  const [error, setError] = useState<string | null>(null);

  const fetchProblems = useCallback(async () => {
    if (!patientId) {
      setProblems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('problem_instances')
        .select('*')
        .eq('patient_id', patientId)
        .order('updated_at', { ascending: false });

      if (qErr) throw new Error(qErr.message);
      setProblems((data ?? []) as ProblemInstance[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar problemas clínicos.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetchProblems(); }, [fetchProblems]);

  const createProblem = useCallback(async (input: {
    template_id?: string | null;
    specialty: string;
    title: string;
    status?: ProblemStatus;
    severity?: ProblemSeverity;
    onset_date?: string | null;
    summary?: string | null;
    baseline_data?: Record<string, unknown>;
    followup_data?: Record<string, unknown>;
    safety_flags?: string[];
    red_flags?: string[];
    linked_modules?: string[];
  }) => {
    if (!patientId || !user) return { data: null, error: 'Paciente ou usuário ausente.' };

    const { data, error: insertErr } = await supabase
      .from('problem_instances')
      .insert({
        patient_id: patientId,
        user_id: user.id,
        template_id: input.template_id ?? null,
        specialty: input.specialty,
        title: input.title,
        status: input.status ?? 'active',
        severity: input.severity ?? 'moderate',
        onset_date: input.onset_date ?? null,
        summary: input.summary ?? null,
        baseline_data: input.baseline_data ?? {},
        followup_data: input.followup_data ?? {},
        safety_flags: input.safety_flags ?? [],
        red_flags: input.red_flags ?? [],
        linked_modules: input.linked_modules ?? [],
      })
      .select()
      .single();

    if (insertErr) return { data: null, error: insertErr.message };
    setProblems((prev) => [data as ProblemInstance, ...prev]);
    return { data: data as ProblemInstance, error: null };
  }, [patientId, user]);

  const updateProblem = useCallback(async (problemId: string, patch: Partial<Pick<ProblemInstance, 'title' | 'status' | 'severity' | 'summary' | 'baseline_data' | 'followup_data' | 'safety_flags' | 'red_flags' | 'linked_modules'>>) => {
    const { data, error: updateErr } = await supabase
      .from('problem_instances')
      .update(patch)
      .eq('id', problemId)
      .select()
      .single();

    if (updateErr) return { data: null, error: updateErr.message };
    setProblems((prev) => prev.map((problem) => problem.id === problemId ? data as ProblemInstance : problem));
    return { data: data as ProblemInstance, error: null };
  }, []);

  return { problems, loading, error, refetch: fetchProblems, createProblem, updateProblem };
}

export function useProblemGoals(problemId?: string) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<ProblemGoal[]>([]);
  const [loading, setLoading] = useState(Boolean(problemId));

  const fetchGoals = useCallback(async () => {
    if (!problemId) {
      setGoals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('problem_goals')
      .select('*')
      .eq('problem_id', problemId)
      .order('created_at', { ascending: false });
    setGoals((data ?? []) as ProblemGoal[]);
    setLoading(false);
  }, [problemId]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const addGoal = useCallback(async (input: { patient_id: string; goal: string; target_date?: string | null }) => {
    if (!problemId || !user) return { data: null, error: 'Problema ou usuário ausente.' };
    const { data, error } = await supabase
      .from('problem_goals')
      .insert({ problem_id: problemId, patient_id: input.patient_id, user_id: user.id, goal: input.goal, target_date: input.target_date ?? null })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    setGoals((prev) => [data as ProblemGoal, ...prev]);
    return { data: data as ProblemGoal, error: null };
  }, [problemId, user]);

  return { goals, loading, refetch: fetchGoals, addGoal };
}

export function useProblemFollowups(problemId?: string) {
  const { user } = useAuth();
  const [followups, setFollowups] = useState<ProblemFollowup[]>([]);
  const [loading, setLoading] = useState(Boolean(problemId));

  const fetchFollowups = useCallback(async () => {
    if (!problemId) {
      setFollowups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('problem_followups')
      .select('*')
      .eq('problem_id', problemId)
      .order('created_at', { ascending: false });
    setFollowups((data ?? []) as ProblemFollowup[]);
    setLoading(false);
  }, [problemId]);

  useEffect(() => { fetchFollowups(); }, [fetchFollowups]);

  const addFollowup = useCallback(async (input: { patient_id: string; note: string; metrics?: Record<string, unknown>; next_steps?: string | null }) => {
    if (!problemId || !user) return { data: null, error: 'Problema ou usuário ausente.' };
    const { data, error } = await supabase
      .from('problem_followups')
      .insert({ problem_id: problemId, patient_id: input.patient_id, user_id: user.id, note: input.note, metrics: input.metrics ?? {}, next_steps: input.next_steps ?? null })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    setFollowups((prev) => [data as ProblemFollowup, ...prev]);
    return { data: data as ProblemFollowup, error: null };
  }, [problemId, user]);

  return { followups, loading, refetch: fetchFollowups, addFollowup };
}
