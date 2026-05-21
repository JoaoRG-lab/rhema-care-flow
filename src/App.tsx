import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PersonaProvider } from "@/contexts/PersonaContext";
import { SpecialtyProvider } from "@/contexts/SpecialtyContext";
import { AccountTypeProvider, useAccountType } from "@/contexts/AccountTypeContext";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useSiteTracker } from "@/hooks/useSiteTracker";

function ActivityTracker({ children }: { children: React.ReactNode }) {
  useActivityTracker();
  useSiteTracker();
  return <>{children}</>;
}

// Lazy load pages for code splitting
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Patients = lazy(() => import("./pages/Patients"));
const Scores = lazy(() => import("./pages/Scores"));
const Monitoring = lazy(() => import("./pages/Monitoring"));
const Infusions = lazy(() => import("./pages/Infusions"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Focus = lazy(() => import("./pages/Focus"));
const Settings = lazy(() => import("./pages/Settings"));
const SettingsCredits = lazy(() => import("./pages/SettingsCredits"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PatientDetail = lazy(() => import("./pages/PatientDetail"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const AcademicWorkspace = lazy(() => import("./pages/AcademicWorkspace"));
const PatientPortal = lazy(() => import("./pages/PatientPortal"));
const Education = lazy(() => import("./pages/Education"));
const KnowledgeLibrary = lazy(() => import("./pages/KnowledgeLibrary"));
const PatientEducationLibrary = lazy(() => import("./pages/PatientEducationLibrary"));
const ReumatismosKnowledge = lazy(() => import("./pages/ReumatismosKnowledge"));
const FibromialgiaPage = lazy(() => import("./pages/reumatismos/FibromialgiaPage"));
const LearnPediatrics = lazy(() => import("./pages/LearnPediatrics"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const BlockchainRegistry = lazy(() => import("./pages/BlockchainRegistry"));
const UrvPage = lazy(() => import("./pages/UrvPage"));
const ReumatoPortal = lazy(() => import("./pages/ReumatoPortal"));
const PediatriaPortal = lazy(() => import("./pages/PediatriaPortal"));
const GinecologiaPortal = lazy(() => import("./pages/GinecologiaPortal"));
const ObstetriciaPortal = lazy(() => import("./pages/ObstetriciaPortal"));
const SpecialtyPortal = lazy(() => import("./pages/SpecialtyPortal"));
const AIResearch = lazy(() => import("./pages/AIResearch"));
const OutreachCRM = lazy(() => import("./pages/OutreachCRM"));
const GuardianAgent = lazy(() => import("./pages/GuardianAgent"));
const ArticleBuilder = lazy(() => import("./pages/ArticleBuilder"));
const EpidemiologicalMatrix = lazy(() => import("./pages/EpidemiologicalMatrix"));
const AboutManifest = lazy(() => import("./pages/AboutManifest"));
const SiteAnalytics = lazy(() => import("./pages/SiteAnalytics"));
const CaseStudies = lazy(() => import("./pages/CaseStudies"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const AdminBilling = lazy(() => import("./pages/AdminBilling"));
const AccountTypeSelect = lazy(() => import("./pages/AccountTypeSelect"));
const Teleconsulta = lazy(() => import("./pages/Teleconsulta"));
const ProntuarioIntegrado = lazy(() => import("./pages/ProntuarioIntegrado"));
const ResearchHub = lazy(() => import("./pages/ResearchHub"));
const MirrorSettings = lazy(() => import("./pages/MirrorSettings"));
const TellUs = lazy(() => import("./pages/TellUs"));
const VerificationRequest = lazy(() => import("./pages/VerificationRequest"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ClinicianRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { accountType, loading: typeLoading } = useAccountType();
  if (authLoading || typeLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!accountType) return <Navigate to="/onboarding" replace />;
  if (accountType !== 'clinician') return <Navigate to="/patient-portal" replace />;
  return <>{children}</>;
}

function PatientRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { accountType, loading: typeLoading } = useAccountType();
  if (authLoading || typeLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!accountType) return <Navigate to="/onboarding" replace />;
  if (accountType !== 'patient') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { accountType, loading: typeLoading } = useAccountType();
  if (authLoading || typeLoading) return <PageLoader />;
  if (!user) return <>{children}</>;
  if (!accountType) return <Navigate to="/onboarding" replace />;
  return <Navigate to={accountType === 'patient' ? '/patient-portal' : '/dashboard'} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AccountTypeProvider>
            <SpecialtyProvider>
              <PersonaProvider>
                <ActivityTracker>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* ── Public ────────────────────────────────────── */}
                      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
                      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/about" element={<AboutManifest />} />
                      <Route path="/case-studies" element={<CaseStudies />} />
                      <Route path="/learn" element={<PatientEducationLibrary />} />
                      <Route path="/reumatismos" element={<ReumatismosKnowledge />} />
                      <Route path="/reumatismos/fibromialgia" element={<FibromialgiaPage />} />
                      <Route path="/learn/pediatrics" element={<LearnPediatrics />} />
                      <Route path="/tell-us" element={<TellUs />} />
                      <Route path="/scores" element={<Scores />} />

                      {/* ── Specialty portals (public) ─────────────────── */}
                      <Route path="/reumato" element={<ReumatoPortal />} />
                      <Route path="/pediatria" element={<PediatriaPortal />} />
                      <Route path="/ginecologia" element={<GinecologiaPortal />} />
                      <Route path="/obstetrics" element={<ObstetriciaPortal />} />
                      <Route path="/especialidades" element={<SpecialtyPortal />} />
                      <Route path="/specialty/:specialtyId" element={<SpecialtyPortal />} />
                      <Route path="/urv" element={<UrvPage />} />

                      {/* ── Redirects ─────────────────────────────────── */}
                      <Route path="/gineco-obstetricia" element={<Navigate to="/ginecologia" replace />} />
                      <Route path="/obstetricia" element={<Navigate to="/ginecologia" replace />} />

                      {/* ── Onboarding ────────────────────────────────── */}
                      <Route path="/onboarding" element={<ProtectedRoute><AccountTypeSelect /></ProtectedRoute>} />
                      <Route path="/verification-request" element={<ProtectedRoute><VerificationRequest /></ProtectedRoute>} />

                      {/* ── Clinician ─────────────────────────────────── */}
                      <Route path="/dashboard" element={<ClinicianRoute><Dashboard /></ClinicianRoute>} />
                      <Route path="/patients" element={<ClinicianRoute><Patients /></ClinicianRoute>} />
                      <Route path="/patients/:id" element={<ClinicianRoute><PatientDetail /></ClinicianRoute>} />
                      <Route path="/monitoring" element={<ClinicianRoute><Monitoring /></ClinicianRoute>} />
                      <Route path="/infusions" element={<ClinicianRoute><Infusions /></ClinicianRoute>} />
                      <Route path="/tasks" element={<ClinicianRoute><Tasks /></ClinicianRoute>} />
                      <Route path="/focus" element={<ClinicianRoute><Focus /></ClinicianRoute>} />
                      <Route path="/analytics" element={<ClinicianRoute><Analytics /></ClinicianRoute>} />
                      <Route path="/academic" element={<ClinicianRoute><AcademicWorkspace /></ClinicianRoute>} />
                      <Route path="/teleconsulta" element={<ClinicianRoute><Teleconsulta /></ClinicianRoute>} />
                      <Route path="/outreach" element={<ClinicianRoute><OutreachCRM /></ClinicianRoute>} />

                      {/* ── Protected (ambos os perfis) ───────────────── */}
                      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                      <Route path="/settings/credits" element={<ProtectedRoute><SettingsCredits /></ProtectedRoute>} />
                      <Route path="/settings/mirror" element={<ProtectedRoute><MirrorSettings /></ProtectedRoute>} />
                      <Route path="/education" element={<ProtectedRoute><Education /></ProtectedRoute>} />
                      <Route path="/knowledge" element={<ProtectedRoute><KnowledgeLibrary /></ProtectedRoute>} />
                      <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
                      <Route path="/ai-research" element={<ProtectedRoute><AIResearch /></ProtectedRoute>} />
                      <Route path="/blockchain" element={<ProtectedRoute><BlockchainRegistry /></ProtectedRoute>} />
                      <Route path="/guardian" element={<ProtectedRoute><GuardianAgent /></ProtectedRoute>} />
                      <Route path="/epi-matrix" element={<ProtectedRoute><EpidemiologicalMatrix /></ProtectedRoute>} />
                      <Route path="/site-analytics" element={<ProtectedRoute><SiteAnalytics /></ProtectedRoute>} />
                      <Route path="/research-hub" element={<ProtectedRoute><ResearchHub /></ProtectedRoute>} />
                      <Route path="/prontuario" element={<ProtectedRoute><ProntuarioIntegrado /></ProtectedRoute>} />
                      <Route path="/article-builder" element={<ProtectedRoute><ArticleBuilder /></ProtectedRoute>} />

                      {/* ── Patient ───────────────────────────────────── */}
                      <Route path="/patient-portal" element={<PatientRoute><PatientPortal /></PatientRoute>} />

                      {/* ── Admin ─────────────────────────────────────── */}
                      <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
                      <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
                      <Route path="/admin/billing" element={<ProtectedRoute><AdminBilling /></ProtectedRoute>} />

                      {/* ── 404 ───────────────────────────────────────── */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </ActivityTracker>
              </PersonaProvider>
            </SpecialtyProvider>
          </AccountTypeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
