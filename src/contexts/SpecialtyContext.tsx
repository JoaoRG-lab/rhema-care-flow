import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SPECIALTIES } from '@/config/specialties';

// ─── Constants ───────────────────────────────────────────────────────────────
const LS_KEY = 'uhs:lastSpecialtyId';

const DEFAULT_SPECIALTY = 'rheumatology';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function readLS(): string | null {
  try {
    return typeof window !== 'undefined'
      ? window.localStorage.getItem(LS_KEY)
      : null;
  } catch {
    return null;
  }
}

function writeLS(id: string) {
  try {
    window.localStorage.setItem(LS_KEY, id);
  } catch { /* private-mode or storage full — no-op */ }
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface SpecialtyContextType {
  /** Currently active specialty id, e.g. 'pediatrics' */
  specialtyId: string;
  /** Switch specialty — persists to profile when logged in */
  setSpecialty: (id: string) => Promise<void>;
  /** Whether an initial load from the DB is still in-flight */
  loadingSpecialty: boolean;
}

const SpecialtyContext = createContext<SpecialtyContextType | undefined>(
  undefined,
);

// ─── Provider ────────────────────────────────────────────────────────────────
export function SpecialtyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Initialise from localStorage so there's no flicker on load
  const [specialtyId, setSpecialtyId] = useState<string>(
    () => readLS() ?? DEFAULT_SPECIALTY,
  );
  const [loadingSpecialty, setLoadingSpecialty] = useState(false);

  // ── On login: fetch the saved specialty from the user's profile ─────────────
  useEffect(() => {
    if (!user) return; // anonymous — keep localStorage value

    let cancelled = false;
    setLoadingSpecialty(true);

    supabase
      .from('profiles')
      .select('specialty')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoadingSpecialty(false);

        if (error) {
          console.error('[SpecialtyContext] profile fetch error:', error.message);
          return;
        }

        const saved = data?.specialty;
        if (
          saved &&
          SPECIALTIES.some((s) => s.id === saved) // guard against stale ids
        ) {
          setSpecialtyId(saved);
          writeLS(saved);
        }
      });

    return () => { cancelled = true; };
  }, [user?.id]); // re-run only when the logged-in user changes

  // ── setSpecialty: update state + localStorage + DB ─────────────────────────
  const setSpecialty = useCallback(
    async (id: string) => {
      if (!SPECIALTIES.some((s) => s.id === id)) {
        console.warn('[SpecialtyContext] unknown specialty id:', id);
        return;
      }

      // Optimistic local update
      setSpecialtyId(id);
      writeLS(id);

      // Persist to DB only when authenticated
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ specialty: id, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        console.error('[SpecialtyContext] profile update error:', error.message);
        // Non-fatal — the local state is already updated
      }
    },
    [user],
  );

  return (
    <SpecialtyContext.Provider
      value={{ specialtyId, setSpecialty, loadingSpecialty }}
    >
      {children}
    </SpecialtyContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useSpecialty() {
  const ctx = useContext(SpecialtyContext);
  if (!ctx) {
    throw new Error('useSpecialty must be used within <SpecialtyProvider>');
  }
  return ctx;
}
