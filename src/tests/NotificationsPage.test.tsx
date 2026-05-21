import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationsPage from '../pages/NotificationsPage';
import { ToastProvider } from '../components/ui/Toast';

const mockNotifs = [
  { id: '1', type: 'consulta', title: 'Consulta confirmada', body: 'Amanhã às 9h', status: 'nao_lida', created_at: new Date().toISOString() },
  { id: '2', type: 'sistema',  title: 'Sistema atualizado',  body: 'v2.1.0',        status: 'lida',     created_at: new Date().toISOString() },
];

const selectMock = vi.fn().mockResolvedValue({ data: mockNotifs, error: null });
const updateMock = vi.fn().mockResolvedValue({ error: null });
const deleteMock = vi.fn().mockResolvedValue({ error: null });

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockReturnThis(),
      limit:  selectMock,
      update: updateMock,
      delete: deleteMock,
    })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ToastProvider><MemoryRouter>{children}</MemoryRouter></ToastProvider>;
}

describe('NotificationsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders notification titles', async () => {
    render(<NotificationsPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('Consulta confirmada')).toBeTruthy();
      expect(screen.getByText('Sistema atualizado')).toBeTruthy();
    });
  });

  it('shows unread badge count', async () => {
    render(<NotificationsPage />, { wrapper: Wrapper });
    await waitFor(() => {
      // 1 nao_lida
      expect(screen.getByText('1')).toBeTruthy();
    });
  });

  it('renders filter buttons', async () => {
    render(<NotificationsPage />, { wrapper: Wrapper });
    expect(screen.getByText('Todas')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText(/Não lidas/i)).toBeTruthy();
    });
  });
});
