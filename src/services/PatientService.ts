import { supabase } from '../lib/supabase';
import type { Patient, PaginatedResult } from '../types';

const TABLE = 'patients';

export const PatientService = {
  async list(page = 1, perPage = 20, search = ''): Promise<PaginatedResult<Patient>> {
    let query = supabase
      .from(TABLE)
      .select('*', { count: 'exact' })
      .eq('active', true)
      .order('name')
      .range((page - 1) * perPage, page * perPage - 1);

    if (search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: data ?? [],
      count: count ?? 0,
      page,
      perPage,
      totalPages: Math.ceil((count ?? 0) / perPage),
    };
  },

  async get(id: string): Promise<Patient> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(payload: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, payload: Partial<Patient>): Promise<Patient> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};
