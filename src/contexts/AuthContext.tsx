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

function defaultName(user: User) {
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Usuario'
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = useCallback(async (currentUser: User) => {
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (profileError) throw profileError;

    let finalProfile = existingProfile as UserProfile | null;

    if (!finalProfile) {
      const { data: createdProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          user_id: currentUser.id,
          full_name: defaultName(currentUser),
          avatar_url: currentUser.user_metadata?.avatar_url ?? null,
        })
        .select('*')
        .single();

      if (createProfileError) throw createProfileError;
      finalProfile = createdProfile as UserProfile;
    }

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (roleError) throw roleError;

    let finalRole = (roleData?.role as UserRole | undefined) ?? null;

    if (!finalRole) {
      const { data: createdRole, error: createRoleError } = await supabase
        .from('user_roles')
        .insert({ user_id: currentUser.id, role: 'user' })
        .select('role')
        .single();

      if (!createRoleError) finalRole = createdRole?.role as UserRole;
    }

    try {
      await supabase.from('user_ai_credits').insert({ user_id: currentUser.id });
    } catch {
      // Non-critical: existing row or restricted policy should not block login.
    }

    setProfile(finalProfile);
    setRole(finalRole ?? 'user');
  }, []);

  useEffect(() => {
    if (supabaseEnvError) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function applySession(s: Session | null) {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        try {
          await ensureProfile(s.user);
        } catch (e) {
          console.error('[AuthContext] ensureProfile error', e);
        }
      } else {
        setProfile(null);
        setRole(null);
      }

      if (mounted) setLoading(false);
    }

    supabase.auth.getSession()
      .then(({ data: { session: s } }) => applySession(s))
      .catch((e) => {
        console.error('[AuthContext] getSession error', e);
        if (mounted) setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      applySession(s);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensureProfile]);

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
    if (user && !supabaseEnvError) await ensureProfile(user);
  }, [user, ensureProfile]);

  if (supabaseEnvError) {
    return <SupabaseConfigError message={supabaseEnvError} />;
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, role, loading,
      signIn, signOut, refreshProfile,
      isAdmin: role === 'admin',
      isMedico: role === 'medico' || role === 'admin' || role === 'user',
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
