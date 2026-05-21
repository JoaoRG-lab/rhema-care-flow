// ============================================================
// Rhema Care Flow — Tipos globais
// ============================================================

// --- Auth ---
export type UserRole = 'admin' | 'medico' | 'enfermeiro' | 'recepcao' | 'paciente';

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// --- Pacientes ---
export interface PatientCard {
  id: string;
  patient_code: string;
  full_name: string;
  date_of_birth: string | null;
  gender: 'M' | 'F' | 'outro' | null;
  phone_number: string | null;
  email: string | null;
  address: string | null;
  mrn_last4: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientCardInsert extends Omit<PatientCard, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

// --- Visitas ---
export type VisitStatus = 'agendada' | 'em_andamento' | 'concluida' | 'cancelada' | 'faltou';

export interface Visit {
  id: string;
  patient_id: string;
  provider_id: string | null;
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  status: VisitStatus;
  chief_complaint: string | null;
  diagnosis: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joins
  patient?: PatientCard;
  provider?: UserProfile;
}

// --- Prontuario ---
export interface ProntuarioEntry {
  id: string;
  patient_id: string;
  visit_id: string | null;
  author_id: string;
  entry_type: 'anamnese' | 'evolucao' | 'prescricao' | 'exame' | 'laudo' | 'outro';
  content: string;
  created_at: string;
  updated_at: string;
  author?: UserProfile;
}

// --- Score Clinico ---
export interface ScoreEntry {
  id: string;
  patient_id: string;
  visit_id: string | null;
  score_type: string;
  score_value: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// --- SMS ---
export type SMSStatus = 'pendente' | 'sent' | 'failed' | 'cancelled';

export interface ScheduledSMS {
  id: string;
  patient_id: string;
  phone_number: string;
  message: string;
  scheduled_at: string;
  sent_at: string | null;
  status: SMSStatus;
  error_message: string | null;
  created_at: string;
}

// --- Pagamentos ---
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';

export interface PaymentTransaction {
  id: string;
  patient_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripe_payment_intent_id: string | null;
  description: string | null;
  created_at: string;
}

// --- Audit ---
export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// --- Paginacao ---
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// --- API Response ---
export interface ApiSuccess<T = unknown> {
  ok: true;
  data?: T;
  message?: string;
}

export interface ApiError {
  ok: false;
  error: string;
  code?: number;
}

export type ApiResult<T = unknown> = ApiSuccess<T> | ApiError;
