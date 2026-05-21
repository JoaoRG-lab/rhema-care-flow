import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      gte:    vi.fn().mockReturnThis(),
      lte:    vi.fn().mockReturnThis(),
      lt:     vi.fn().mockReturnThis(),
      in:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockReturnThis(),
      limit:  vi.fn().mockResolvedValue({ data: [], count: 0, error: null }),
    })),
  },
}));

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ profile: { full_name: 'Dr. Teste', role: 'medico' } }),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('DashboardPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders greeting with user name', async () => {
    render(<DashboardPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText(/Dr\./i)).toBeTruthy();
    });
  });

  it('renders 4 KPI skeleton cards initially', () => {
    render(<DashboardPage />, { wrapper: Wrapper });
    const pulses = document.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBeGreaterThanOrEqual(4);
  });

  it('renders quick action links', async () => {
    render(<DashboardPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('Novo paciente')).toBeTruthy();
      expect(screen.getByText('Agendar consulta')).toBeTruthy();
      expect(screen.getByText('Teleconsulta')).toBeTruthy();
    });
  });
});
