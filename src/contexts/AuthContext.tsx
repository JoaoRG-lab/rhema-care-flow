import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, supabaseEnvError } from '../lib/supabase';
import type { UserProfile, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isMedico: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function SupabaseConfigError({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <section className="max-w-2xl rounded-2xl border border-red-400/40 bg-red-950/30 p-6 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-300">Erro de configuracao do deploy</p>
        <h1 className="mt-2 text-2xl font-bold">Supabase nao foi configurado no Vercel</h1>
        <p className="mt-4 text-slate-200">{message}</p>
        <div className="mt-5 rounded-xl bg-slate-900 p-4 font-mono text-sm text-slate-200">
          <p>VITE_SUPABASE_URL=https://seu-project-id.supabase.co</p>
          <p>VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key_publica</p>
        </div>
      </section>
    </main>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const [{ data: profileData }, { data: roleData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
      ]);
      setProfile(profileData as UserProfile | null);
      setRole((roleData?.role as UserRole) ?? null);
    } catch (e) {
      console.error('[AuthContext] fetchProfile error', e);
    }
  }, []);

  useEffect(() => {
    if (supabaseEnvError) {
      setLoading(false);
      return;
    }

    // Inicializa sessao existente
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    }).catch((e) => {
      console.error('[AuthContext] getSession error', e);
      setLoading(false);
    });

    // Escuta mudancas de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      else { setProfile(null); setRole(null); }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (supabaseEnvError) return { error: supabaseEnvError };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (supabaseEnvError) return;
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user && !supabaseEnvError) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  if (supabaseEnvError) {
    return <SupabaseConfigError message={supabaseEnvError} />;
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, role, loading,
      signIn, signOut, refreshProfile,
      isAdmin: role === 'admin',
      isMedico: role === 'medico' || role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
