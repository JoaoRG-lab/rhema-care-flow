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

export type PatientCardInsert = Omit<PatientCard, 'id' | 'user_id' | 'created_at' | 'updated_at'> & {
  user_id?: string;
};

export type Patient = PatientCard;

export interface Visit {
  id: string;
  patient_card_id: string;
  user_id: string;
  visit_date: string;
  disease_activity?: Record<string, unknown> | null;
  actions?: string[] | null;
  labs_ordered?: string[] | null;
  imaging?: string[] | null;
  next_steps?: string | null;
  created_at: string;
}

export interface Prontuario {
  id: string;
  patient_id: string;
  author_id: string;
  content: string;
  type: 'evolucao' | 'prescricao' | 'laudo' | 'anamnese';
  created_at: string;
  updated_at: string;
}

export interface Score {
  id: string;
  patient_card_id: string | null;
  user_id: string;
  score_type: string;
  calculated_score: number | null;
  data_json: Record<string, unknown> | null;
  created_at: string;
}

export interface Exam {
  id: string;
  patient_id: string;
  uploaded_by: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  description: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  link: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

export type SignalingPayload =
  | { type: 'offer'; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; sdp: RTCSessionDescriptionInit }
  | { type: 'ice'; candidate: RTCIceCandidateInit }
  | { type: 'hangup' };
