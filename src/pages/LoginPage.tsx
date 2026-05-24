import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';

type Mode = 'magic' | 'password';

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/dashboard', { replace: true });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate('/dashboard', { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) { toastError('Informe o e-mail'); return; }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    });
    setLoading(false);

    if (error) { toastError('Erro ao enviar Magic Link', error.message); return; }
    setSent(true);
    success('Link enviado!', 'Verifique seu e-mail e clique no link de acesso.');
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) { toastError('Preencha e-mail e senha'); return; }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    setLoading(false);

    if (error) { toastError('Credenciais inválidas', error.message); return; }
    success('Bem-vindo!');
    navigate('/dashboard', { replace: true });
  }

  async function handlePasswordReset() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) { toastError('Informe o e-mail primeiro'); return; }

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    if (error) { toastError('Erro ao enviar redefinição', error.message); return; }
    info('E-mail de redefinição enviado!', cleanEmail);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 mb-4">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" fill="white" fillOpacity=".15" />
              <path d="M16 9v7l4.5 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 16a6 6 0 1 0 12 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rhema Care Flow</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Acesse o sistema clínico</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-5">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button type="button" onClick={() => { setMode('magic'); setSent(false); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'magic' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              Magic Link
            </button>
            <button type="button" onClick={() => { setMode('password'); setSent(false); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'password' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              Senha
            </button>
          </div>

          {mode === 'magic' && sent ? (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Verifique seu e-mail</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Enviamos um link para <strong>{email}</strong>. Clique nele para entrar.</p>
              <button type="button" onClick={() => setSent(false)} className="text-xs text-teal-600 dark:text-teal-400 hover:underline">Reenviar</button>
            </div>
          ) : mode === 'magic' ? (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label htmlFor="email-magic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">E-mail</label>
                <input id="email-magic" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required autoComplete="email" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                {loading ? 'Enviando...' : 'Enviar Magic Link'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePassword} className="space-y-4">
              <div>
                <label htmlFor="email-pwd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">E-mail</label>
                <input id="email-pwd" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required autoComplete="email" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                  <button type="button" onClick={handlePasswordReset} className="text-xs text-teal-600 dark:text-teal-400 hover:underline">Esqueci a senha</button>
                </div>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            Google e Apple foram desativados temporariamente até os providers OAuth serem habilitados no Supabase.
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
