 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 import type { 
   MonitoringEvent, 
   MonitoringEventWithPatient, 
   CreateMonitoringEventInput 
 } from '@/types/clinical';
 
 // Re-export types for convenience
 export type { MonitoringEvent, MonitoringEventWithPatient, CreateMonitoringEventInput };
 
 interface UseMonitoringEventsOptions {
   patientId?: string;
 }
 
 export function useMonitoringEvents(options: UseMonitoringEventsOptions = {}) {
   const { user } = useAuth();
   const [events, setEvents] = useState<MonitoringEventWithPatient[]>([]);
   const [loading, setLoading] = useState(true);
 
   const fetchEvents = useCallback(async () => {
     if (!user) return;
     setLoading(true);
 
     let query = supabase
       .from('monitoring_events_secure')
       .select('*')
       .eq('user_id', user.id)
       .order('due_date', { ascending: true });
 
     if (options.patientId) {
       query = query.eq('patient_card_id', options.patientId);
     }
 
     const { data, error } = await query;
 
     if (data) {
       // Fetch patient codes for events with patient_card_id
       const patientIds = [...new Set(data.filter(e => e.patient_card_id).map(e => e.patient_card_id!))];
       let patientMap: Record<string, string> = {};
 
       if (patientIds.length > 0) {
         const { data: patientData } = await supabase
           .from('patient_cards_secure')
           .select('id, patient_code')
           .in('id', patientIds);
 
         if (patientData) {
           patientMap = Object.fromEntries(patientData.map(p => [p.id, p.patient_code]));
         }
       }
 
       const mappedEvents = data.map((e: any) => ({
         ...e,
         patient_cards: e.patient_card_id ? { patient_code: patientMap[e.patient_card_id] || 'Unknown' } : null
       }));
       setEvents(mappedEvents as MonitoringEventWithPatient[]);
     }
 
     if (error) toast.error('Failed to load events');
     setLoading(false);
   }, [user, options.patientId]);
 
   useEffect(() => {
     fetchEvents();
   }, [fetchEvents]);
 
   const createEvent = useCallback(async (input: CreateMonitoringEventInput): Promise<boolean> => {
     if (!user) return false;
 
     const { error } = await supabase.from('monitoring_events').insert({
       user_id: user.id,
       event_type: input.event_type,
       due_date: input.due_date,
       notes: input.notes || null,
       status: 'pending',
       patient_card_id: input.patient_card_id || null,
     });
 
     if (error) {
       toast.error('Failed to create event');
       return false;
     }
 
     toast.success('Monitoring event created');
     await fetchEvents();
     return true;
   }, [user, fetchEvents]);
 
   const markComplete = useCallback(async (id: string): Promise<boolean> => {
     if (!user) return false;
 
     const { error } = await supabase
       .from('monitoring_events')
       .update({ status: 'completed', completed_at: new Date().toISOString() })
       .eq('id', id)
       .eq('user_id', user.id);
 
     if (error) {
       toast.error('Failed to update');
       return false;
     }
 
     toast.success('Marked complete');
     await fetchEvents();
     return true;
   }, [user, fetchEvents]);
 
   const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
     if (!user) return false;
 
     const { error } = await supabase
       .from('monitoring_events')
       .delete()
       .eq('id', id)
       .eq('user_id', user.id);
 
     if (error) {
       toast.error('Failed to delete event');
       return false;
     }
 
     toast.success('Event deleted');
     await fetchEvents();
     return true;
   }, [user, fetchEvents]);
 
   return {
     events,
     loading,
     fetchEvents,
     createEvent,
     markComplete,
     deleteEvent,
   };
 }