import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Carregamento imediato — rotas cr\u00edticas
import LoginPage         from './pages/LoginPage';
import DashboardPage     from './pages/DashboardPage';
import PatientsPage      from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import PatientEditPage   from './pages/PatientEditPage';
import NewPatientPage    from './pages/NewPatientPage';
import ProntuarioPage    from './pages/ProntuarioPage';
import SchedulePage      from './pages/SchedulePage';
import ScorePage         from './pages/ScorePage';
import TeleconsultaPage  from './pages/TeleconsultaPage';
import SettingsPage      from './pages/SettingsPage';
import AdminPage         from './pages/AdminPage';
import NotFound          from './pages/NotFound';

// Lazy-load — chunks pesados s\u00f3 carregam quando o usu\u00e1rio navega
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><span className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full" /></div>;
  return session ? <>{children}</> : <Navigate to="/login" replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/patients" element={<PrivateRoute><PatientsPage /></PrivateRoute>} />
        <Route path="/patients/new" element={<PrivateRoute><NewPatientPage /></PrivateRoute>} />
        <Route path="/patients/:id" element={<PrivateRoute><PatientDetailPage /></PrivateRoute>} />
        <Route path="/patients/:id/edit" element={<PrivateRoute><PatientEditPage /></PrivateRoute>} />
        <Route path="/prontuario/:id" element={<PrivateRoute><ProntuarioPage /></PrivateRoute>} />
        <Route path="/schedule" element={<PrivateRoute><SchedulePage /></PrivateRoute>} />
        <Route path="/scores" element={<PrivateRoute><ScorePage /></PrivateRoute>} />
        <Route path="/teleconsulta" element={<PrivateRoute><TeleconsultaPage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />

        {/* Lazy — carrega vendor-charts s\u00f3 quando acessado */}
        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <Suspense fallback={<div className="flex h-screen items-center justify-center"><span className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full" /></div>}>
                <ReportsPage />
              </Suspense>
            </PrivateRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
