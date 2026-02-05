 /**
  * Centralized clinical TypeScript interfaces.
  * All clinical data types should be defined here to ensure consistency.
  */
 
 import type { Json } from '@/integrations/supabase/types';
 
 // ============================================
 // PATIENT TYPES
 // ============================================
 
 export interface PatientCard {
   id: string;
   patient_code: string;
   mrn_last4: string | null;
   diagnosis_tags: string[];
   therapy_tags: string[];
   risk_flags: string[];
   last_visit_date: string | null;
   next_followup_date: string | null;
   notes: string | null;
   created_at: string;
   updated_at?: string;
   user_id?: string;
 }
 
 export interface CreatePatientInput {
   patient_code: string;
   mrn_last4?: string | null;
   diagnosis_tags?: string[];
   therapy_tags?: string[];
   risk_flags?: string[];
   notes?: string | null;
   next_followup_date?: string | null;
 }
 
 export interface UpdatePatientInput extends Partial<CreatePatientInput> {
   id: string;
 }
 
 // ============================================
 // VISIT TYPES
 // ============================================
 
 export interface Visit {
   id: string;
   visit_date: string;
   disease_activity: Json | null;
   actions: string[] | null;
   labs_ordered: string[] | null;
   imaging: string[] | null;
   next_steps: string | null;
   attachments: string[] | null;
   created_at?: string;
   patient_card_id?: string;
   user_id?: string;
 }
 
 export interface CreateVisitInput {
   patient_card_id: string;
   visit_date: string;
   disease_activity?: Json | null;
   actions?: string[];
   labs_ordered?: string[];
   imaging?: string[];
   next_steps?: string | null;
   attachments?: string[];
 }
 
 export interface UpdateVisitInput extends Partial<Omit<CreateVisitInput, 'patient_card_id'>> {
   id: string;
 }
 
 // ============================================
 // MONITORING EVENT TYPES
 // ============================================
 
 export interface MonitoringEvent {
   id: string;
   event_type: string;
   due_date: string;
   status: string;
   completed_at: string | null;
   notes: string | null;
   patient_card_id: string | null;
   created_at?: string;
   user_id?: string;
 }
 
 export interface MonitoringEventWithPatient extends MonitoringEvent {
   patient_cards?: { patient_code: string } | null;
 }
 
 export interface CreateMonitoringEventInput {
   event_type: string;
   due_date: string;
   notes?: string | null;
   patient_card_id?: string | null;
 }
 
 // ============================================
 // INFUSION EVENT TYPES
 // ============================================
 
 export interface InfusionEvent {
   id: string;
   drug: string;
   interval_days: number;
   next_date: string;
   notes: string | null;
   patient_card_id: string | null;
   pre_checklist?: Json | null;
   created_at?: string;
   updated_at?: string;
   user_id?: string;
 }
 
 export interface CreateInfusionInput {
   drug: string;
   interval_days: number;
   next_date: string;
   notes?: string | null;
   patient_card_id?: string | null;
   pre_checklist?: Json | null;
 }
 
 // ============================================
 // SCORE ENTRY TYPES
 // ============================================
 
 export interface ScoreEntry {
   id: string;
   score_type: string;
   calculated_score: number | null;
   data_json?: Json | null;
   created_at: string;
   patient_card_id?: string | null;
   visit_id?: string | null;
   user_id?: string;
 }
 
 export interface CreateScoreEntryInput {
   score_type: string;
   calculated_score: number;
   data_json: Json;
   patient_card_id?: string | null;
   visit_id?: string | null;
 }
 
 // ============================================
 // TASK TYPES
 // ============================================
 
 export interface Task {
   id: string;
   title: string;
   description: string | null;
   status: string | null;
   priority: string | null;
   category: string | null;
   due_date: string | null;
   completed_at: string | null;
   created_at: string;
   updated_at: string;
   user_id: string;
 }
 
 // ============================================
 // SHIFT TYPES
 // ============================================
 
 export interface Shift {
   id: string;
   shift_date: string;
   shift_type: string;
   start_time: string | null;
   end_time: string | null;
   location: string | null;
   notes: string | null;
   created_at: string;
   user_id: string;
 }
 
 // ============================================
 // FOCUS SESSION TYPES
 // ============================================
 
 export interface FocusSession {
   id: string;
   duration_minutes: number;
   task_category: string | null;
   notes: string | null;
   completed_at: string;
   user_id: string;
 }
 
 // ============================================
 // PROFILE TYPES
 // ============================================
 
 export interface Profile {
   id: string;
   user_id: string;
   full_name: string | null;
   specialty: string | null;
   institution: string | null;
   linkedin_url: string | null;
   avatar_url: string | null;
   created_at: string;
   updated_at: string;
 }