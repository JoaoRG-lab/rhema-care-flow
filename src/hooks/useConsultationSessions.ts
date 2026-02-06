import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ConsultationSession {
  id: string;
  provider_id: string;
  patient_card_id: string | null;
  title: string;
  description: string | null;
  session_type: 'informational' | 'follow_up' | 'education' | 'medication_review';
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  patient_phone: string | null;
  patient_email: string | null;
  reminder_sent: boolean;
  provider_notes: string | null;
  patient_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateSessionInput = Pick<
  ConsultationSession,
  'title' | 'session_type' | 'scheduled_date' | 'start_time' | 'duration_minutes'
> & {
  patient_card_id?: string;
  description?: string;
  patient_phone?: string;
  patient_email?: string;
};

export type UpdateSessionInput = Partial<Omit<ConsultationSession, 'id' | 'provider_id' | 'created_at' | 'updated_at'>>;

export function useConsultationSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ConsultationSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('consultation_sessions')
        .select('*')
        .eq('provider_id', user.id)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSessions(data as ConsultationSession[]);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load consultation sessions');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = async (input: CreateSessionInput): Promise<ConsultationSession | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('consultation_sessions')
        .insert({
          provider_id: user.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;

      const newSession = data as ConsultationSession;
      setSessions(prev => [...prev, newSession].sort((a, b) => 
        a.scheduled_date.localeCompare(b.scheduled_date) || a.start_time.localeCompare(b.start_time)
      ));
      toast.success('Consultation session created');
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
      return null;
    }
  };

  const updateSession = async (id: string, input: UpdateSessionInput): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('consultation_sessions')
        .update(input)
        .eq('id', id)
        .eq('provider_id', user.id);

      if (error) throw error;

      setSessions(prev => prev.map(s => 
        s.id === id ? { ...s, ...input, updated_at: new Date().toISOString() } : s
      ));
      toast.success('Session updated');
      return true;
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session');
      return false;
    }
  };

  const deleteSession = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('consultation_sessions')
        .delete()
        .eq('id', id)
        .eq('provider_id', user.id);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== id));
      toast.success('Session deleted');
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
      return false;
    }
  };

  const getUpcomingSessions = () => {
    const today = new Date().toISOString().split('T')[0];
    return sessions.filter(s => 
      s.scheduled_date >= today && 
      ['scheduled', 'confirmed'].includes(s.status)
    );
  };

  const getTodaysSessions = () => {
    const today = new Date().toISOString().split('T')[0];
    return sessions.filter(s => s.scheduled_date === today);
  };

  return {
    sessions,
    loading,
    createSession,
    updateSession,
    deleteSession,
    getUpcomingSessions,
    getTodaysSessions,
    refetch: fetchSessions,
  };
}

export const SESSION_TYPES = [
  { value: 'informational', label: 'Informational', description: 'General patient education and Q&A' },
  { value: 'follow_up', label: 'Follow-up', description: 'Check-in on treatment progress' },
  { value: 'education', label: 'Disease Education', description: 'Detailed condition education' },
  { value: 'medication_review', label: 'Medication Review', description: 'Review and explain medications' },
] as const;

export const SESSION_STATUSES = [
  { value: 'scheduled', label: 'Scheduled', color: 'bg-info' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-success' },
  { value: 'completed', label: 'Completed', color: 'bg-muted' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-destructive' },
  { value: 'no_show', label: 'No Show', color: 'bg-warning' },
] as const;
