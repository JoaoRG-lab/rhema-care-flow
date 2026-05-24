import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';

type Mode = 'magic' | 'password';

export function LoginPage() {
  const [mode,     setMode]     = useState<Mode>('magic');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [sent,     setSent]     = useState(false);
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/', { replace: true });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate('/', { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { toastError('Informe o e-mail'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) { toastError('Erro ao enviar link', error.message); return; }
    setSent(true);
    success('Link enviado!', 'Verifique seu e-mail.');
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) { toastError('Preencha e-mail e senha'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) { toastError('Credenciais inválidas', error.message); return; }
    success('Bem-vindo!');
    navigate('/', { replace: true });
  }

  async function handleOAuth(provider: 'google' | 'apple') {
    setOauthLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        ...(provider === 'google'
          ? { queryParams: { access_type: 'offline', prompt: 'consent' } }
          : {}),
      },
    });
    if (error) {
      toastError(`Erro ao entrar com ${provider === 'google' ? 'Google' : 'Apple'}`, error.message);
      setOauthLoading(null);
    }
    // Se não der erro, o Supabase redireciona o browser — não precisa setar null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-600 mb-4">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" fill="white" fillOpacity=".15"/>
              <path d="M16 9v7l4.5 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 16a6 6 0 1 0 12 0" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rhema Care Flow</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Acesse o sistema clínico</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-5">

          {/* Mode toggle */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {([['magic', 'Magic Link'], ['password', 'Senha']] as [Mode, string][]).map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setSent(false); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Magic Link */}
          {mode === 'magic' && (
            sent ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600 dark:text-teal-400" aria-hidden="true">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Verifique seu e-mail</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Enviamos um link para <strong>{email}</strong>. Clique nele para entrar.</p>
                <button onClick={() => setSent(false)} className="text-xs text-teal-600 dark:text-teal-400 hover:underline">Reenviar</button>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label htmlFor="email-magic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">E-mail</label>
                  <input
                    id="email-magic" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com" required autoComplete="email"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  {loading
                    ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  }
                  {loading ? 'Enviando...' : 'Enviar Magic Link'}
                </button>
              </form>
            )
          )}

          {/* Password */}
          {mode === 'password' && (
            <form onSubmit={handlePassword} className="space-y-4">
              <div>
                <label htmlFor="email-pwd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">E-mail</label>
                <input
                  id="email-pwd" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com" required autoComplete="email"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                  <button type="button"
                    onClick={async () => {
                      if (!email.trim()) { toastError('Informe o e-mail primeiro'); return; }
                      await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/settings` });
                      info('E-mail de redefinição enviado!', email);
                    }}
                    className="text-xs text-teal-600 dark:text-teal-400 hover:underline">
                    Esqueci a senha
                  </button>
                </div>
                <input
                  id="password" type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {loading && <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>}
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400">ou continue com</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Google */}
            <button
              onClick={() => handleOAuth('google')}
              disabled={oauthLoading !== null}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-60"
              aria-label="Entrar com Google"
            >
              {oauthLoading === 'google'
                ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
              }
              Google
            </button>

            {/* Apple */}
            <button
              onClick={() => handleOAuth('apple')}
              disabled={oauthLoading !== null}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-black hover:bg-gray-900 text-sm font-medium text-white transition-colors disabled:opacity-60"
              aria-label="Entrar com Apple"
            >
              {oauthLoading === 'apple'
                ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeOpacity=".25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                : <svg width="17" height="17" viewBox="0 0 814 1000" fill="white" aria-hidden="true">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.3-158.4-107.4C46.5 702.1 0 584.1 0 470.6c0-209 138.3-319.5 272.4-319.5 97.4 0 178.4 64.1 236.7 64.1 54.7 0 140.8-68 253.3-68 40.5 0 145.3 3.5 216.4 112.5zM523.3 87.3c21-25.3 36.5-60.5 36.5-95.7 0-4.8-.4-9.7-1.3-13.7-34.9 1.3-76.2 23.2-101.5 52.4-19.4 22-38.2 57.2-38.2 93 0 5.2.9 10.4 1.3 12.1 2.2.4 5.8.6 9.4.6 31.6 0 71.1-21.2 93.8-48.7z"/>
                  </svg>
              }
              Apple
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600">
          Ao entrar, você concorda com os termos de uso e política de privacidade da plataforma.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
