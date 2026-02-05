 import { useState, useEffect, useCallback } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 import { subHours, addHours, format } from 'date-fns';
 
 export interface ScheduledSMS {
   id: string;
   user_id: string;
   patient_card_id: string | null;
   phone_number: string;
   message: string;
   template_id: string | null;
   scheduled_for: string;
   reminder_type: '24h' | '1h' | 'custom';
   source_type: 'followup' | 'infusion' | 'monitoring' | 'shift';
   source_id: string;
   status: 'pending' | 'sent' | 'failed' | 'cancelled';
   sent_at: string | null;
   error_message: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export interface SMSPreferences {
   id: string;
   user_id: string;
   auto_schedule_24h: boolean;
   auto_schedule_1h: boolean;
   default_phone_field: string;
   twilio_phone_number: string | null;
 }
 
 interface ScheduleSMSInput {
   patientCardId?: string;
   phoneNumber: string;
   message: string;
   templateId?: string;
   scheduledFor: Date;
   reminderType: '24h' | '1h' | 'custom';
   sourceType: 'followup' | 'infusion' | 'monitoring' | 'shift';
   sourceId: string;
 }
 
 export function useScheduledSms() {
   const { user } = useAuth();
   const [scheduledSms, setScheduledSms] = useState<ScheduledSMS[]>([]);
   const [preferences, setPreferences] = useState<SMSPreferences | null>(null);
   const [loading, setLoading] = useState(true);
 
   const fetchScheduledSms = useCallback(async () => {
     if (!user) {
       setScheduledSms([]);
       setLoading(false);
       return;
     }
 
     try {
       const { data, error } = await supabase
         .from('scheduled_sms')
         .select('*')
         .eq('user_id', user.id)
         .order('scheduled_for', { ascending: true });
 
       if (error) throw error;
       setScheduledSms(data as ScheduledSMS[]);
     } catch (error) {
       console.error('Error fetching scheduled SMS:', error);
     } finally {
       setLoading(false);
     }
   }, [user]);
 
   const fetchPreferences = useCallback(async () => {
     if (!user) return;
 
     try {
       const { data, error } = await supabase
         .from('sms_preferences')
         .select('*')
         .eq('user_id', user.id)
         .maybeSingle();
 
       if (error) throw error;
       setPreferences(data as SMSPreferences | null);
     } catch (error) {
       console.error('Error fetching SMS preferences:', error);
     }
   }, [user]);
 
   useEffect(() => {
     fetchScheduledSms();
     fetchPreferences();
   }, [fetchScheduledSms, fetchPreferences]);
 
   const scheduleSms = async (input: ScheduleSMSInput): Promise<ScheduledSMS | null> => {
     if (!user) return null;
 
     try {
       const { data, error } = await supabase
         .from('scheduled_sms')
         .insert({
           user_id: user.id,
           patient_card_id: input.patientCardId || null,
           phone_number: input.phoneNumber,
           message: input.message,
           template_id: input.templateId || null,
           scheduled_for: input.scheduledFor.toISOString(),
           reminder_type: input.reminderType,
           source_type: input.sourceType,
           source_id: input.sourceId,
         })
         .select()
         .single();
 
       if (error) throw error;
 
       const newSms = data as ScheduledSMS;
       setScheduledSms(prev => [...prev, newSms].sort((a, b) => 
         new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
       ));
       
       toast.success(`SMS scheduled for ${format(input.scheduledFor, 'MMM d, h:mm a')}`);
       return newSms;
     } catch (error) {
       console.error('Error scheduling SMS:', error);
       toast.error('Failed to schedule SMS');
       return null;
     }
   };
 
   const scheduleAppointmentReminders = async (
     appointmentDate: Date,
     phoneNumber: string,
     patientCode: string,
     sourceType: 'followup' | 'infusion' | 'monitoring' | 'shift',
     sourceId: string,
     patientCardId?: string
   ): Promise<ScheduledSMS[]> => {
     if (!user) return [];
 
     const results: ScheduledSMS[] = [];
     const shouldSchedule24h = preferences?.auto_schedule_24h ?? true;
     const shouldSchedule1h = preferences?.auto_schedule_1h ?? true;
 
     const dateStr = format(appointmentDate, 'MMMM d');
     const timeStr = format(appointmentDate, 'h:mm a');
 
     // Schedule 24h reminder
     if (shouldSchedule24h) {
       const reminder24h = subHours(appointmentDate, 24);
       if (reminder24h > new Date()) {
         const sms = await scheduleSms({
           patientCardId,
           phoneNumber,
           message: `Reminder: Your appointment is tomorrow, ${dateStr} at ${timeStr}. Please reply CONFIRM or call to reschedule.`,
           scheduledFor: reminder24h,
           reminderType: '24h',
           sourceType,
           sourceId,
         });
         if (sms) results.push(sms);
       }
     }
 
     // Schedule 1h reminder
     if (shouldSchedule1h) {
       const reminder1h = subHours(appointmentDate, 1);
       if (reminder1h > new Date()) {
         const sms = await scheduleSms({
           patientCardId,
           phoneNumber,
           message: `Your appointment is in 1 hour at ${timeStr}. See you soon!`,
           scheduledFor: reminder1h,
           reminderType: '1h',
           sourceType,
           sourceId,
         });
         if (sms) results.push(sms);
       }
     }
 
     return results;
   };
 
   const cancelScheduledSms = async (id: string): Promise<boolean> => {
     if (!user) return false;
 
     try {
       const { error } = await supabase
         .from('scheduled_sms')
         .update({ status: 'cancelled' })
         .eq('id', id)
         .eq('user_id', user.id);
 
       if (error) throw error;
 
       setScheduledSms(prev => prev.map(sms => 
         sms.id === id ? { ...sms, status: 'cancelled' as const } : sms
       ));
       toast.success('Scheduled SMS cancelled');
       return true;
     } catch (error) {
       console.error('Error cancelling SMS:', error);
       toast.error('Failed to cancel SMS');
       return false;
     }
   };
 
   const deleteScheduledSms = async (id: string): Promise<boolean> => {
     if (!user) return false;
 
     try {
       const { error } = await supabase
         .from('scheduled_sms')
         .delete()
         .eq('id', id)
         .eq('user_id', user.id);
 
       if (error) throw error;
 
       setScheduledSms(prev => prev.filter(sms => sms.id !== id));
       toast.success('Scheduled SMS deleted');
       return true;
     } catch (error) {
       console.error('Error deleting SMS:', error);
       toast.error('Failed to delete SMS');
       return false;
     }
   };
 
   const updatePreferences = async (updates: Partial<SMSPreferences>): Promise<boolean> => {
     if (!user) return false;
 
     try {
       if (preferences) {
         const { error } = await supabase
           .from('sms_preferences')
           .update(updates)
           .eq('user_id', user.id);
         if (error) throw error;
       } else {
         const { error } = await supabase
           .from('sms_preferences')
           .insert({ user_id: user.id, ...updates });
         if (error) throw error;
       }
 
       setPreferences(prev => prev ? { ...prev, ...updates } : null);
       toast.success('SMS preferences updated');
       return true;
     } catch (error) {
       console.error('Error updating preferences:', error);
       toast.error('Failed to update preferences');
       return false;
     }
   };
 
   const getPendingSms = () => scheduledSms.filter(sms => sms.status === 'pending');
   const getSentSms = () => scheduledSms.filter(sms => sms.status === 'sent');
   const getFailedSms = () => scheduledSms.filter(sms => sms.status === 'failed');
 
   return {
     scheduledSms,
     preferences,
     loading,
     scheduleSms,
     scheduleAppointmentReminders,
     cancelScheduledSms,
     deleteScheduledSms,
     updatePreferences,
     getPendingSms,
     getSentSms,
     getFailedSms,
     refetch: fetchScheduledSms,
   };
 }