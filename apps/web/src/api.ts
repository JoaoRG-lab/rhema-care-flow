const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export type User = { id: number; email: string; full_name?: string | null };
export type Patient = { id: number; full_name: string; diagnosis?: string | null; phone?: string | null; email?: string | null };
export type Appointment = { id: number; patient_name: string; scheduled_date: string; start_time: string; kind: string; status: string };

export function getToken() {
  return sessionStorage.getItem('uhs_token');
}

export function setToken(token: string) {
  sessionStorage.setItem('uhs_token', token);
}

export function clearToken() {
  sessionStorage.removeItem('uhs_token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let detail = `Erro ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // keep fallback
    }
    throw new Error(detail);
  }

  return response.json();
}
