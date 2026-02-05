 import { lazy, Suspense } from "react";
 import { Toaster } from "@/components/ui/toaster";
 import { Toaster as Sonner } from "@/components/ui/sonner";
 import { TooltipProvider } from "@/components/ui/tooltip";
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
 import { AuthProvider, useAuth } from "@/contexts/AuthContext";
 
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
 const NotFound = lazy(() => import("./pages/NotFound"));
 const PatientDetail = lazy(() => import("./pages/PatientDetail"));
const StyleGuide = lazy(() => import("./pages/StyleGuide"));
const VerificationRequest = lazy(() => import("./pages/VerificationRequest"));
 const AdminPanel = lazy(() => import("./pages/AdminPanel"));
 
 const queryClient = new QueryClient();

 const PageLoader = () => (
   <div className="min-h-screen flex items-center justify-center">
     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
   </div>
 );
 
 function ProtectedRoute({ children }: { children: React.ReactNode }) {
   const { user, loading } = useAuth();
   if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
   if (!user) return <Navigate to="/login" replace />;
   return <>{children}</>;
 }
 
 function PublicRoute({ children }: { children: React.ReactNode }) {
   const { user, loading } = useAuth();
   if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
   if (user) return <Navigate to="/dashboard" replace />;
   return <>{children}</>;
 }
 
 const App = () => (
   <QueryClientProvider client={queryClient}>
     <TooltipProvider>
       <Toaster />
       <Sonner />
       <BrowserRouter>
         <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
                <Route path="/patients/:id" element={<ProtectedRoute><PatientDetail /></ProtectedRoute>} />
                <Route path="/scores" element={<ProtectedRoute><Scores /></ProtectedRoute>} />
                <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
                <Route path="/infusions" element={<ProtectedRoute><Infusions /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
                <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                <Route path="/focus" element={<ProtectedRoute><Focus /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/style-guide" element={<StyleGuide />} />
                <Route path="/verification-request" element={<ProtectedRoute><VerificationRequest /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
         </AuthProvider>
       </BrowserRouter>
     </TooltipProvider>
   </QueryClientProvider>
 );
 
 export default App;
