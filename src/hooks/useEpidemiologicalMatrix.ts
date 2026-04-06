import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { VariableDefinition } from '@/lib/epidemiologicalMatrix';

export function useEpidemiologicalMatrix() {
  const { user } = useAuth();
  const [variables, setVariables] = useState<VariableDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVariables();
  }, []);

  async function loadVariables() {
    try {
      const { data, error } = await supabase
        .from('epi_variable_definitions')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      setVariables((data || []).map(d => ({
        ...d,
        data_type: d.data_type as 'numeric' | 'binary' | 'categorical',
        value_range: d.value_range as VariableDefinition['value_range'],
      })));
    } catch (e: any) {
      toast.error('Failed to load variable definitions');
    } finally {
      setLoading(false);
    }
  }

  async function submitVector(
    vectorHash: string,
    vectorEncrypted: Uint8Array,
    variableCodes: string[],
    dimension: number,
    patientCardId?: string,
    source: string = 'manual'
  ) {
    if (!user) throw new Error('Not authenticated');

    // Convert Uint8Array to hex string for bytea storage
    const hexString = '\\x' + Array.from(vectorEncrypted).map(b => b.toString(16).padStart(2, '0')).join('');

    const { data, error } = await supabase
      .from('epi_feature_vectors')
      .insert({
        user_id: user.id,
        patient_card_id: patientCardId || null,
        vector_hash: vectorHash,
        vector_encrypted: hexString,
        variable_codes: variableCodes,
        dimension,
        source,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async function getMyVectors() {
    if (!user) return [];
    const { data, error } = await supabase
      .from('epi_feature_vectors')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function getAggregatedStats(cohortKey?: string) {
    let query = supabase
      .from('epi_aggregated_stats')
      .select('*');
    if (cohortKey) query = query.eq('cohort_key', cohortKey);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  return {
    variables,
    loading,
    submitVector,
    getMyVectors,
    getAggregatedStats,
    reload: loadVariables,
  };
}
