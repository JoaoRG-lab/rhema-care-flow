import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type ClinicalTimelineEventType = 'score' | 'prescription' | 'safety' | 'visit' | 'note';

export interface ClinicalTimelineEvent {
  id: string;
  patient_id: string;
  user_id: string;
  event_type: ClinicalTimelineEventType;
  title: string;
  description: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export function useClinicalTimeline(patientId?: string) {
  const { user } = useAuth();
  const [events, setEvents] = useState<ClinicalTimelineEvent[]>([]);
  const [loading, setLoading] = useState(Boolean(patientId));
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    if (!patientId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('clinical_timeline_events')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(80);

      if (qErr) throw new Error(qErr.message);
      setEvents((data ?? []) as ClinicalTimelineEvent[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar timeline clínica.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

  const addEvent = useCallback(async (event: {
    event_type: ClinicalTimelineEventType;
    title: string;
    description?: string | null;
    payload?: Record<string, unknown>;
  }) => {
    if (!patientId || !user) return { data: null, error: 'Paciente ou usuário ausente.' };

    const { data, error: insertErr } = await supabase
      .from('clinical_timeline_events')
      .insert({
        patient_id: patientId,
        user_id: user.id,
        event_type: event.event_type,
        title: event.title,
        description: event.description ?? null,
        payload: event.payload ?? {},
      })
      .select()
      .single();

    if (insertErr) return { data: null, error: insertErr.message };
    setEvents((prev) => [data as ClinicalTimelineEvent, ...prev]);
    return { data: data as ClinicalTimelineEvent, error: null };
  }, [patientId, user]);

  return { events, loading, error, refetch: fetchTimeline, addEvent };
}
