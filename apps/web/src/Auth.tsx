import { useState } from 'react';
import { api, setToken, type User } from './api';

export function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api<{ access_token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(result.access_token);
      onLogin(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="screen center gradient">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark">U</div>
        <p className="eyebrow">UHS HealthOS</p>
        <h1>Clinical Operating Layer</h1>
        <p className="muted">
          MVP clínico multi-especialidade. Reumatologia é o primeiro domínio vertical, não o limite da plataforma.
        </p>
        {error && <div className="alert">{error}</div>}
        <label>
          E-mail
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
        </label>
        <label>
          Senha
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
        </label>
        <button disabled={loading}>{loading ? 'Entrando...' : 'Entrar no UHS HealthOS'}</button>
        <small>Use o usuário seed definido nos Secrets/README do ambiente de desenvolvimento.</small>
      </form>
    </main>
  );
}
