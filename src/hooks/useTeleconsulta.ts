import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Teleconsulta {
  id: string;
  provider_id: string;
  patient_card_id: string | null;
  patient_name: string | null;
  specialty: string | null;
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  daily_room_name: string | null;
  daily_room_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateTeleconsultaInput = {
  patient_card_id?: string;
  patient_name?: string;
  specialty?: string;
  scheduled_date: string;
  start_time: string;
  duration_minutes?: number;
  notes?: string;
};

export type UpdateTeleconsultaInput = Partial<Omit<Teleconsulta, 'id' | 'provider_id' | 'created_at' | 'updated_at'>>;

const DAILY_API_KEY = import.meta.env.VITE_DAILY_CO_API_KEY as string | undefined;

async function createDailyRoom(roomName: string): Promise<{ url: string; name: string } | null> {
  if (!DAILY_API_KEY) {
    // Fallback: use a public demo room for development
    const fallbackName = roomName;
    return { url: `https://rhema.daily.co/${fallbackName}`, name: fallbackName };
  }
  try {
    const res = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          max_participants: 2,
          enable_chat: true,
          enable_screenshare: true,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4, // 4 horas de validade
        },
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json() as { url: string; name: string };
    return data;
  } catch (err) {
    console.error('Daily.co room creation failed:', err);
    return null;
  }
}

export function useTeleconsulta(patientCardId?: string) {
  const { user } = useAuth();
  const [teleconsultas, setTeleconsultas] = useState<Teleconsulta[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeleconsultas = useCallback(async () => {
    if (!user) { setTeleconsultas([]); setLoading(false); return; }
    try {
      let query = supabase
        .from('teleconsultas')
        .select('*')
        .eq('provider_id', user.id)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (patientCardId) query = query.eq('patient_card_id', patientCardId);

      const { data, error } = await query;
      if (error) throw error;
      setTeleconsultas(data as Teleconsulta[]);
    } catch (err) {
      console.error('Error fetching teleconsultas:', err);
      toast.error('Erro ao carregar teleconsultas');
    } finally {
      setLoading(false);
    }
  }, [user, patientCardId]);

  useEffect(() => { fetchTeleconsultas(); }, [fetchTeleconsultas]);

  const createTeleconsulta = async (input: CreateTeleconsultaInput): Promise<Teleconsulta | null> => {
    if (!user) return null;
    try {
      // Gera nome único para a sala
      const roomName = `rhema-${user.id.slice(0, 8)}-${Date.now()}`;
      const room = await createDailyRoom(roomName);

      const { data, error } = await supabase
        .from('teleconsultas')
        .insert({
          provider_id: user.id,
          ...input,
          duration_minutes: input.duration_minutes ?? 30,
          daily_room_name: room?.name ?? null,
          daily_room_url: room?.url ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      const created = data as Teleconsulta;
      setTeleconsultas(prev =>
        [...prev, created].sort((a, b) =>
          a.scheduled_date.localeCompare(b.scheduled_date) || a.start_time.localeCompare(b.start_time)
        )
      );
      toast.success('Teleconsulta agendada com sucesso');
      return created;
    } catch (err) {
      console.error('Error creating teleconsulta:', err);
      toast.error('Erro ao agendar teleconsulta');
      return null;
    }
  };

  const updateTeleconsulta = async (id: string, input: UpdateTeleconsultaInput): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('teleconsultas')
        .update(input)
        .eq('id', id)
        .eq('provider_id', user.id);
      if (error) throw error;
      setTeleconsultas(prev => prev.map(t => t.id === id ? { ...t, ...input, updated_at: new Date().toISOString() } : t));
      toast.success('Teleconsulta atualizada');
      return true;
    } catch (err) {
      console.error('Error updating teleconsulta:', err);
      toast.error('Erro ao atualizar teleconsulta');
      return false;
    }
  };

  const deleteTeleconsulta = async (id: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('teleconsultas')
        .delete()
        .eq('id', id)
        .eq('provider_id', user.id);
      if (error) throw error;
      setTeleconsultas(prev => prev.filter(t => t.id !== id));
      toast.success('Teleconsulta cancelada');
      return true;
    } catch (err) {
      console.error('Error deleting teleconsulta:', err);
      toast.error('Erro ao cancelar teleconsulta');
      return false;
    }
  };

  const iniciarConsulta = async (id: string): Promise<Teleconsulta | null> => {
    const ok = await updateTeleconsulta(id, { status: 'in_progress' });
    if (!ok) return null;
    return teleconsultas.find(t => t.id === id) ?? null;
  };

  const finalizarConsulta = async (id: string) => updateTeleconsulta(id, { status: 'completed' });

  const getTodas = () => teleconsultas;
  const getHoje = () => {
    const hoje = new Date().toISOString().split('T')[0];
    return teleconsultas.filter(t => t.scheduled_date === hoje);
  };
  const getProximas = () => {
    const hoje = new Date().toISOString().split('T')[0];
    return teleconsultas.filter(t => t.scheduled_date >= hoje && ['scheduled', 'in_progress'].includes(t.status));
  };

  return {
    teleconsultas,
    loading,
    createTeleconsulta,
    updateTeleconsulta,
    deleteTeleconsulta,
    iniciarConsulta,
    finalizarConsulta,
    getTodas,
    getHoje,
    getProximas,
    refetch: fetchTeleconsultas,
  };
}
