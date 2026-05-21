import { useAuth } from '../contexts/AuthContext';
import { AIDashboard } from '../components/AIDashboard';
import { AppShell } from '../components/layout/AppShell';

export function DashboardPage() {
  const { profile, role } = useAuth();

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header de boas-vindas */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Ola, {profile?.full_name?.split(' ')[0] ?? 'Profissional'} 👋
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
              {role ?? 'Usuario'} · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <a
            href="/patients/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors w-fit"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" d="M12 5v14M5 12h14"/>
            </svg>
            Novo Paciente
          </a>
        </div>

        {/* Painel de tendencias com IA */}
        <AIDashboard />
      </div>
    </AppShell>
  );
}

export default DashboardPage;
