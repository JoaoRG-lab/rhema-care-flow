// ============================================================
// Rhema Care Flow — Tipos globais TypeScript
// ============================================================

export type Role = 'admin' | 'medico' | 'enfermeiro';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  name: string;
  birthdate: string;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  diagnosis: string | null;
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  patient_id: string;
  doctor_id: string;
  visit_date: string;
  chief_complaint: string | null;
  notes: string | null;
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
  patient_id: string;
  author_id: string;
  score_type: 'DAS28' | 'SDAI' | 'Wells' | 'BASFI';
  score_value: number;
  inputs: Record<string, number>;
  interpretation: string;
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

// Paginacao generica
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// Toast — alinhado com useToast.ts e ToastContainer
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  /** Texto secundário exibido abaixo do título */
  description?: string;
  duration?: number;
}

// WebRTC sinalizacao
export type SignalingPayload =
  | { type: 'offer';     sdp: RTCSessionDescriptionInit }
  | { type: 'answer';    sdp: RTCSessionDescriptionInit }
  | { type: 'ice';       candidate: RTCIceCandidateInit }
  | { type: 'hangup' };
