import { useState, useEffect, useCallback } from 'react';
import { PatientService } from '../services/PatientService';
import type { PatientCard, PatientCardInsert, PaginatedResult } from '../types';

interface UsePatientsOptions {
  search?: string;
  page?: number;
  perPage?: number;
}

export function usePatients(options: UsePatientsOptions = {}) {
  const { search = '', page = 1, perPage = 20 } = options;
  const [result, setResult] = useState<PaginatedResult<PatientCard> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await PatientService.list(page, perPage, search);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  }, [search, page, perPage]);

  useEffect(() => { fetch(); }, [fetch]);

  const createPatient = useCallback(async (payload: PatientCardInsert) => {
    try {
      const data = await PatientService.create(payload);
      await fetch();
      return { data, error: null as string | null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Erro ao criar paciente' };
    }
  }, [fetch]);

  const updatePatient = useCallback(async (id: string, payload: Partial<PatientCardInsert>) => {
    try {
      const data = await PatientService.update(id, payload);
      await fetch();
      return { data, error: null as string | null };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : 'Erro ao atualizar paciente' };
    }
  }, [fetch]);

  const deletePatient = useCallback(async (id: string) => {
    try {
      await PatientService.deactivate(id);
      await fetch();
      return { error: null as string | null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Erro ao desativar paciente' };
    }
  }, [fetch]);

  return {
    result,
    data: result?.data ?? [],
    count: result?.count ?? 0,
    totalPages: result?.totalPages ?? 1,
    loading,
    error,
    refetch: fetch,
    createPatient,
    updatePatient,
    deletePatient,
  };
}

export function usePatient(id: string) {
  const [patient, setPatient] = useState<PatientCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    PatientService.get(id)
      .then(setPatient)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar paciente'))
      .finally(() => setLoading(false));
  }, [id]);

  return { patient, loading, error };
}
