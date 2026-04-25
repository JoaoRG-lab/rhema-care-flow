import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EvolucaoShared {
  id: string;
  visit_date: string;
  actions: string[] | null;
  labs_ordered: string[] | null;
  imaging: string[] | null;
  next_steps: string | null;
  disease_activity: Record<string, unknown> | null;
  specialty_do_medico: string;
  medico_iniciais: string;
  created_at: string;
}

export interface SharedRecordResult {
  patient_code: string;
  evolucoes: EvolucaoShared[];
  total: number;
}

export function useSharedRecord() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SharedRecordResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);

  const buscarPorCodigo = useCallback(async (
    codigo: string,
    accessorInfo?: { name?: string; crm?: string; specialty?: string }
  ): Promise<SharedRecordResult | null> => {
    const codigoNorm = codigo.trim().toUpperCase();
    if (!codigoNorm || codigoNorm.length < 4) {
      setError('Código inválido. O código do paciente deve ter ao menos 4 caracteres.');
      return null;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Busca evoluções via RPC segura
      const { data, error: rpcError } = await supabase.rpc('get_evolucoes_by_code', {
        p_code: codigoNorm,
      });

      if (rpcError) {
        if (rpcError.message.includes('não encontrado')) {
          setError('Código de paciente não encontrado. Verifique e tente novamente.');
        } else {
          setError('Erro ao buscar prontuário. Tente novamente.');
        }
        return null;
      }

      const evolucoes = (data ?? []) as EvolucaoShared[];

      const recordResult: SharedRecordResult = {
        patient_code: codigoNorm,
        evolucoes,
        total: evolucoes.length,
      };

      setResult(recordResult);

      // Registra log de acesso em background
      setLogging(true);
      const { data: { user } } = await supabase.auth.getUser();
      supabase.from('prontuario_access_log').insert({
        patient_code: codigoNorm,
        accessor_id: user?.id ?? null,
        accessor_name: accessorInfo?.name ?? null,
        accessor_crm: accessorInfo?.crm ?? null,
        accessor_specialty: accessorInfo?.specialty ?? null,
      }).then(() => setLogging(false));

      return recordResult;
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
      console.error('useSharedRecord error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const limpar = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { loading, logging, result, error, buscarPorCodigo, limpar };
}

// Hook para o médico dono — ver quem acessou o prontuário dos seus pacientes
export function useProntuarioAccessLog(patientCode: string) {
  const [logs, setLogs] = useState<{
    id: string;
    accessor_name: string | null;
    accessor_crm: string | null;
    accessor_specialty: string | null;
    accessed_at: string;
  }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!patientCode) return;
    setLoading(true);
    const { data } = await supabase
      .from('prontuario_access_log')
      .select('id, accessor_name, accessor_crm, accessor_specialty, accessed_at')
      .eq('patient_code', patientCode.toUpperCase())
      .order('accessed_at', { ascending: false })
      .limit(20);
    setLogs((data ?? []) as typeof logs);
    setLoading(false);
  }, [patientCode]);

  return { logs, loading, fetchLogs };
}
