import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppShell } from './components/layout/AppShell';
import type { Role } from './types';

// Lazy pages
const LoginPage        = lazy(() => import('./pages/LoginPage'));
const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const PatientsPage     = lazy(() => import('./pages/PatientsPage'));
const PatientDetailPage= lazy(() => import('./pages/PatientDetailPage'));
const PatientEditPage  = lazy(() => import('./pages/PatientEditPage'));
const NewPatientPage   = lazy(() => import('./pages/NewPatientPage'));
const ProntuarioPage   = lazy(() => import('./pages/ProntuarioPage'));
const ScorePage        = lazy(() => import('./pages/ScorePage'));
const TeleconsultaPage = lazy(() => import('./pages/TeleconsultaPage'));
const ReportsPage      = lazy(() => import('./pages/ReportsPage'));
const SchedulePage     = lazy(() => import('./pages/SchedulePage'));
const SettingsPage     = lazy(() => import('./pages/SettingsPage'));
const AdminPage        = lazy(() => import('./pages/AdminPage'));
const NotFound         = lazy(() => import('./pages/NotFound'));

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <svg className="animate-spin text-teal-600" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Carregando">
        <circle cx="12" cy="12" r="10" strokeOpacity=".2"/>
        <path d="M12 2a10 10 0 0 1 10 10"/>
      </svg>
    </div>
  );
}

// Guard: requer autenticacao
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

// Guard: requer role especifica
function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!profile || !roles.includes(profile.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Spinner />}>
          <Routes>
            {/* Publica */}
            <Route path="/login" element={<LoginPage />} />

            {/* Autenticadas */}
            <Route element={<RequireAuth><AppShell /></RequireAuth>}>
              <Route index element={<DashboardPage />} />
              <Route path="patients"          element={<PatientsPage />} />
              <Route path="patients/new"      element={<RequireRole roles={['admin','medico']}><NewPatientPage /></RequireRole>} />
              <Route path="patients/:id"      element={<PatientDetailPage />} />
              <Route path="patients/:id/edit" element={<RequireRole roles={['admin','medico']}><PatientEditPage /></RequireRole>} />
              <Route path="prontuario/:id"    element={<ProntuarioPage />} />
              <Route path="scores/:id"        element={<ScorePage />} />
              <Route path="teleconsulta"      element={<TeleconsultaPage />} />
              <Route path="schedule"          element={<SchedulePage />} />
              <Route path="reports"           element={<RequireRole roles={['admin','medico']}><ReportsPage /></RequireRole>} />
              <Route path="settings"          element={<SettingsPage />} />
              <Route path="admin"             element={<RequireRole roles={['admin']}><AdminPage /></RequireRole>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
