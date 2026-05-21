import { supabase } from '../lib/supabase';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_at: string;
  end_at: string;
  status: 'agendado' | 'confirmado' | 'realizado' | 'cancelado' | 'falta';
  reason: string | null;
  notes: string | null;
  teleconsulta: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const AppointmentService = {
  async listByDate(date: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('start_at', `${date}T00:00:00`)
      .lte('start_at', `${date}T23:59:59`)
      .order('start_at');
    if (error) throw error;
    return data ?? [];
  },

  async listByPatient(patientId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('start_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(payload: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: Appointment['status']): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};
