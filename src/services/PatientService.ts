import { supabase } from '../lib/supabase';
import type { PatientCard, PatientCardInsert, PaginatedResult } from '../types';

const TABLE = 'patient_cards';

function normalizePatientPayload(payload: Partial<PatientCardInsert>) {
  return {
    patient_code: payload.patient_code,
    full_name: payload.full_name,
    date_of_birth: payload.date_of_birth || null,
    gender: payload.gender || null,
    phone_number: payload.phone_number || null,
    email: payload.email || null,
    address: payload.address || null,
    active: payload.active ?? true,
    mrn_last4: payload.mrn_last4 || null,
    diagnosis_tags: payload.diagnosis_tags ?? [],
    therapy_tags: payload.therapy_tags ?? [],
    risk_flags: payload.risk_flags ?? [],
    last_visit_date: payload.last_visit_date || null,
    next_followup_date: payload.next_followup_date || null,
    notes: payload.notes || null,
  };
}

export const PatientService = {
  async list(page = 1, perPage = 20, search = ''): Promise<PaginatedResult<PatientCard>> {
    let query = supabase
      .from(TABLE)
      .select('*', { count: 'exact' })
      .eq('active', true)
      .order('full_name', { ascending: true, nullsFirst: false })
      .range((page - 1) * perPage, page * perPage - 1);

    const term = search.trim();
    if (term) {
      query = query.or(`full_name.ilike.%${term}%,patient_code.ilike.%${term}%,phone_number.ilike.%${term}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: (data ?? []) as PatientCard[],
      count: count ?? 0,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / perPage)),
    };
  },

  async get(id: string): Promise<PatientCard> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as PatientCard;
  },

  async create(payload: PatientCardInsert): Promise<PatientCard> {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) throw new Error('Usuario nao autenticado. Faca login novamente.');

    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ...normalizePatientPayload(payload), user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as PatientCard;
  },

  async update(id: string, payload: Partial<PatientCardInsert>): Promise<PatientCard> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...normalizePatientPayload(payload), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as PatientCard;
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE)
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};
