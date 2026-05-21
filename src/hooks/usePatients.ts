import { useState, useEffect, useCallback } from 'react';
import { PatientService } from '../services/PatientService';
import type { Patient, PaginatedResult } from '../types';

export function usePatients(search = '', page = 1) {
  const [result,  setResult]  = useState<PaginatedResult<Patient> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await PatientService.list(page, 20, search);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetch(); }, [fetch]);

  return { result, loading, error, refetch: fetch };
}

export function usePatient(id: string) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    PatientService.get(id)
      .then(setPatient)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { patient, loading, error };
}
