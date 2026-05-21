import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Lazy pages — code-split por rota
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const PatientsPage       = lazy(() => import('./pages/PatientsPage'));
const PatientDetailPage  = lazy(() => import('./pages/PatientDetailPage'));
const PatientEditPage    = lazy(() => import('./pages/PatientEditPage'));
const NewPatientPage     = lazy(() => import('./pages/NewPatientPage'));
const ProntuarioPage     = lazy(() => import('./pages/ProntuarioPage'));
const ScorePage          = lazy(() => import('./pages/ScorePage'));
const TeleconsultaPage   = lazy(() => import('./pages/TeleconsultaPage'));
const ReportsPage        = lazy(() => import('./pages/ReportsPage'));
const SettingsPage       = lazy(() => import('./pages/SettingsPage'));
const AdminPage          = lazy(() => import('./pages/AdminPage'));
const NotFoundPage       = lazy(() => import('./pages/NotFound'));

// Skeleton de carregamento de rota
function PageSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
      <svg className="animate-spin text-teal-600" width="28" height="28" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" aria-label="Carregando">
        <circle cx="12" cy="12" r="10" strokeOpacity=".2"/>
        <path d="M12 2a10 10 0 0 1 10 10"/>
      </svg>
    </div>
  );
}

// Guard: requer autenticação
function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <PageSkeleton />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Guard: requer role específica
function RequireRole({ roles }: { roles: string[] }) {
  const { profile, loading } = useAuth();
  if (loading) return <PageSkeleton />;
  if (!profile || !roles.includes(profile.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<div className="flex items-center justify-center min-h-screen text-sm text-gray-500">Login em breve</div>} />

          {/* Rotas autenticadas */}
          <Route element={<RequireAuth />}>
            <Route path="/"                              element={<DashboardPage />} />
            <Route path="/patients"                     element={<PatientsPage />} />
            <Route path="/patients/new"                 element={<NewPatientPage />} />
            <Route path="/patients/:id"                 element={<PatientDetailPage />} />
            <Route path="/patients/:id/edit"            element={<PatientEditPage />} />
            <Route path="/patients/:id/prontuario"      element={<ProntuarioPage />} />
            <Route path="/patients/:id/scores"          element={<ScorePage />} />
            <Route path="/teleconsulta"                 element={<TeleconsultaPage />} />
            <Route path="/teleconsulta/:roomId"         element={<TeleconsultaPage />} />
            <Route path="/settings"                     element={<SettingsPage />} />

            {/* Rotas restritas: admin + clínicos */}
            <Route element={<RequireRole roles={['admin','medico','enfermeiro']} />}>
              <Route path="/reports" element={<ReportsPage />} />
            </Route>

            {/* Rotas restritas: apenas admin */}
            <Route element={<RequireRole roles={['admin']} />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
