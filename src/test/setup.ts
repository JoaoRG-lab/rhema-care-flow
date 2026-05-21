// Vitest global setup
import '@testing-library/jest-dom';

// Mock supabase para testes unitarios
vi.mock('../lib/supabase', () => ({
  supabase: {
    from:  () => ({ select: () => ({ data: [], error: null, count: 0 }) }),
    auth:  { getUser: async () => ({ data: { user: { id: 'test-user' } } }) },
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
  },
}));
