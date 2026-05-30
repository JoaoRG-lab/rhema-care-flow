// ============================================================
// Rhema Care Flow — Tipos globais TypeScript
// ============================================================

export type Role = 'admin' | 'medico' | 'enfermeiro' | 'moderator' | 'user';
export type UserRole = Role;

export interface Profile {
  id: string;
  user_id?: string;
  full_name: string | null;
  phone?: string | null;
  specialty?: string | null;
  institution?: string | null;
  role?: Role;
  avatar_url: string | null;
  active?: boolean;
  created_at: string;
  updated_at: string;
}

export type UserProfile = Profile;

export interface PatientCard {
  id: string;
  user_id: string;
  patient_code: string;
  full_name: string;
  date_of_birth: string | null;
  gender: 'M' | 'F' | 'outro' | null;
  phone_number: string | null;
  email: string | null;
  address: string | null;
  active: boolean;
  mrn_last4: string | null;
  diagnosis_tags: string[];
  therapy_tags: string[];
  risk_flags: string[];
  last_visit_date: string | null;
  next_followup_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type PatientCardInsert = Omit<PatientCard, 'id' | 'user_id' | 'created_at' | 'updated_at'> & { user_id?: string };
export type Patient = PatientCard;

export interface Visit { id: string; patient_card_id: string; user_id: string; visit_date: string; disease_activity?: Record<string, unknown> | null; actions?: string[] | null; labs_ordered?: string[] | null; imaging?: string[] | null; next_steps?: string | null; created_at: string; }
export type VisitStatus = 'agendada' | 'em_andamento' | 'concluida' | 'cancelada' | 'faltou';

export interface Prontuario { id: string; patient_id: string; author_id: string; content: string; type: 'evolucao' | 'prescricao' | 'laudo' | 'anamnese'; created_at: string; updated_at: string; }
export type ProntuarioEntryType = 'anamnese' | 'evolucao' | 'prescricao' | 'exame' | 'laudo' | 'outro';
export interface ProntuarioEntry { id: string; patient_id: string; author_id: string; visit_id: string | null; entry_type: ProntuarioEntryType; content: string; created_at: string; updated_at: string; author?: Pick<Profile, 'full_name'> | null; }

export interface Score { id: string; patient_card_id: string | null; user_id: string; score_type: string; calculated_score: number | null; data_json: Record<string, unknown> | null; created_at: string; }
export interface ScoreEntry { id: string; patient_id: string; visit_id: string | null; score_type: string; score_value: number; metadata: Record<string, unknown> | null; created_at: string; }

export interface Exam { id: string; patient_id: string; uploaded_by: string; file_name: string; file_url: string; file_size: number; mime_type: string; description: string | null; created_at: string; }

export type ClinicalTimelineEventType = 'score' | 'prescription' | 'safety' | 'visit' | 'note' | 'problem' | 'goal' | 'followup';
export interface ClinicalTimelineEvent { id: string; patient_id: string; user_id: string; event_type: ClinicalTimelineEventType; title: string; description: string | null; payload: Record<string, unknown>; created_at: string; }

export interface TherapySafetyChecklistRecord { id: string; patient_id: string; user_id: string; checklist: Record<string, boolean>; completion: number; notes: string | null; created_at: string; updated_at: string; }

export type ProblemSeverity = 'low' | 'moderate' | 'high' | 'critical';
export type ProblemStatus = 'active' | 'controlled' | 'monitoring' | 'resolved' | 'uncertain';
export type ProblemGoalStatus = 'active' | 'met' | 'paused' | 'cancelled';

export interface ProblemInstance {
  id: string;
  patient_id: string;
  user_id: string;
  template_id: string | null;
  specialty: string;
  title: string;
  status: ProblemStatus;
  severity: ProblemSeverity;
  onset_date: string | null;
  summary: string | null;
  baseline_data: Record<string, unknown>;
  followup_data: Record<string, unknown>;
  safety_flags: string[];
  red_flags: string[];
  linked_modules: string[];
  created_at: string;
  updated_at: string;
}

export interface ProblemGoal {
  id: string;
  problem_id: string;
  patient_id: string;
  user_id: string;
  goal: string;
  target_date: string | null;
  status: ProblemGoalStatus;
  created_at: string;
  updated_at: string;
}

export interface ProblemFollowup {
  id: string;
  problem_id: string;
  patient_id: string;
  user_id: string;
  note: string;
  metrics: Record<string, unknown>;
  next_steps: string | null;
  created_at: string;
}

export interface Notification { id: string; user_id: string; title: string; body: string; type: 'info' | 'warning' | 'success' | 'error'; read: boolean; link: string | null; created_at: string; }
export interface AuditLog { id: string; user_id: string; action: string; resource: string; resource_id: string | null; meta: Record<string, unknown> | null; created_at: string; }
export interface PaginatedResult<T> { data: T[]; count: number; page: number; perPage: number; totalPages: number; }
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast { id: string; type: ToastType; title: string; description?: string; duration?: number; }

export type SignalingPayload =
  | { type: 'offer'; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; sdp: RTCSessionDescriptionInit }
  | { type: 'ice'; candidate: RTCIceCandidateInit }
  | { type: 'hangup' };
