import { supabase } from '../lib/supabase';
import type { Score } from '../types';

export const ScoreService = {
  async listByPatient(patientId: string): Promise<Score[]> {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(payload: Omit<Score, 'id' | 'created_at'>): Promise<Score> {
    const { data, error } = await supabase
      .from('scores')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Calcula DAS28-CRP
  calcDAS28({ tj, ts, crp, vas }: { tj: number; ts: number; crp: number; vas: number }) {
    const value = parseFloat(
      (0.56 * Math.sqrt(tj) + 0.28 * Math.sqrt(ts) + 0.36 * Math.log(crp + 1) + 0.014 * vas + 0.96).toFixed(2)
    );
    const interpretation =
      value < 2.6 ? 'Remissao' :
      value < 3.2 ? 'Baixa atividade' :
      value < 5.1 ? 'Moderada atividade' : 'Alta atividade';
    return { value, interpretation };
  },

  // Calcula SDAI
  calcSDAI({ tj, ts, aglobal, pglobal, pcrm }: { tj: number; ts: number; aglobal: number; pglobal: number; pcrm: number }) {
    const value = parseFloat((tj + ts + aglobal + pglobal + pcrm).toFixed(1));
    const interpretation =
      value <= 3.3  ? 'Remissao' :
      value <= 11   ? 'Baixa atividade' :
      value <= 26   ? 'Moderada atividade' : 'Alta atividade';
    return { value, interpretation };
  },

  // Calcula Wells DVT
  calcWells(inputs: Record<string, number>) {
    const value = Object.values(inputs).reduce((a, b) => a + b, 0);
    const interpretation =
      value <= 0 ? 'Baixa probabilidade TVP' :
      value <= 2 ? 'Probabilidade moderada TVP' : 'Alta probabilidade TVP';
    return { value, interpretation };
  },

  // Calcula BASFI
  calcBASFI(inputs: number[]) {
    const value = parseFloat((inputs.reduce((a, b) => a + b, 0) / inputs.length).toFixed(1));
    const interpretation =
      value < 3 ? 'Funcionalidade preservada' :
      value < 6 ? 'Incapacidade moderada' : 'Incapacidade grave';
    return { value, interpretation };
  },
};
