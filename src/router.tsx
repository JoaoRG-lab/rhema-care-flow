import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AISiteAgentWidget } from '@/components/ai/AISiteAgentWidget2';

// Carregamento imediato — rotas críticas
import LoginPage         from './pages/LoginPage';
import AuthCallback      from './pages/AuthCallback';
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
import ReumatismosKnowledge from './pages/ReumatismosKnowledge';
import FibromialgiaPage from './pages/reumatismos/FibromialgiaPage';
import ArtriteReumatoidePage from './pages/reumatismos/ArtriteReumatoidePage';
import LupusPage from './pages/reumatismos/LupusPage';
import OsteoporosePage from './pages/reumatismos/OsteoporosePage';
import GotaPage from './pages/reumatismos/GotaPage';
import DorLombarInflamatoriaPage from './pages/reumatismos/DorLombarInflamatoriaPage';
import NotFound          from './pages/NotFound';

// Lazy-load — chunks pesados só carregam quando o usuário navega
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const AIIntegrationPage = lazy(() => import('./pages/AIIntegrationPage'));

function Spinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <span className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full" />
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <Spinner />;
  return session ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Rota raiz inteligente: logado → Dashboard, não logado → Login */
function RootRedirect() {
  const { session, loading } = useAuth();
  if (loading) return <Spinner />;
  return session
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/login" replace />;
}

function PublicWithAssistant({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AISiteAgentWidget />
    </>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz — redireciona conforme autenticação */}
        <Route path="/" element={<RootRedirect />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Conteúdo público com assistente */}
        <Route path="/reumatismos" element={<PublicWithAssistant><ReumatismosKnowledge /></PublicWithAssistant>} />
        <Route path="/reumatismos/fibromialgia" element={<PublicWithAssistant><FibromialgiaPage /></PublicWithAssistant>} />
        <Route path="/reumatismos/artrite-reumatoide" element={<PublicWithAssistant><ArtriteReumatoidePage /></PublicWithAssistant>} />
        <Route path="/reumatismos/lupus" element={<PublicWithAssistant><LupusPage /></PublicWithAssistant>} />
        <Route path="/reumatismos/osteoporose" element={<PublicWithAssistant><OsteoporosePage /></PublicWithAssistant>} />
        <Route path="/reumatismos/gota" element={<PublicWithAssistant><GotaPage /></PublicWithAssistant>} />
        <Route path="/reumatismos/dor-lombar-inflamatoria" element={<PublicWithAssistant><DorLombarInflamatoriaPage /></PublicWithAssistant>} />

        {/* Área autenticada */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
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

        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <Suspense fallback={<Spinner />}>
                <ReportsPage />
              </Suspense>
            </PrivateRoute>
          }
        />

        <Route
          path="/ai-panel"
          element={
            <PrivateRoute>
              <Suspense fallback={<Spinner />}>
                <AIIntegrationPage />
              </Suspense>
            </PrivateRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
