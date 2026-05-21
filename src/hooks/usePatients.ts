import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { PatientCard, PatientCardInsert, PaginatedResult } from '../types';

interface UsePatientsOptions {
  search?: string;
  page?: number;
  perPage?: number;
  activeOnly?: boolean;
}

export function usePatients({
  search = '',
  page = 1,
  perPage = 20,
  activeOnly = true,
}: UsePatientsOptions = {}) {
  const [result, setResult] = useState<PaginatedResult<PatientCard>>({
    data: [], count: 0, page, perPage, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      let query = supabase
        .from('patient_cards')
        .select('*', { count: 'exact' })
        .order('full_name', { ascending: true })
        .range(from, to);

      if (activeOnly) query = query.eq('active', true);

      if (search.trim()) {
        const s = search.trim();
        query = query.or(`full_name.ilike.%${s}%,patient_code.ilike.%${s}%,phone_number.ilike.%${s}%`);
      }

      const { data, error: qErr, count } = await query;

      if (qErr) throw new Error(qErr.message);

      const total = count ?? 0;
      setResult({
        data: (data ?? []) as PatientCard[],
        count: total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar pacientes.');
    } finally {
      setLoading(false);
    }
  }, [search, page, perPage, activeOnly]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const createPatient = useCallback(async (patient: PatientCardInsert) => {
    const { data, error } = await supabase
      .from('patient_cards')
      .insert(patient)
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    await fetchPatients();
    return { data: data as PatientCard, error: null };
  }, [fetchPatients]);

  const updatePatient = useCallback(async (id: string, updates: Partial<PatientCard>) => {
    const { data, error } = await supabase
      .from('patient_cards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    await fetchPatients();
    return { data: data as PatientCard, error: null };
  }, [fetchPatients]);

  const deactivatePatient = useCallback(async (id: string) => {
    return updatePatient(id, { active: false });
  }, [updatePatient]);

  return {
    ...result,
    loading,
    error,
    refetch: fetchPatients,
    createPatient,
    updatePatient,
    deactivatePatient,
  };
}
