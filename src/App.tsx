 import { Toaster } from "@/components/ui/toaster";
 import { Toaster as Sonner } from "@/components/ui/sonner";
 import { TooltipProvider } from "@/components/ui/tooltip";
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
 import { AuthProvider, useAuth } from "@/contexts/AuthContext";
 import Landing from "./pages/Landing";
 import Login from "./pages/Login";
 import Signup from "./pages/Signup";
 import Dashboard from "./pages/Dashboard";
 import Patients from "./pages/Patients";
 import Scores from "./pages/Scores";
 import Monitoring from "./pages/Monitoring";
 import Infusions from "./pages/Infusions";
 import CalendarPage from "./pages/CalendarPage";
 import Tasks from "./pages/Tasks";
 import Focus from "./pages/Focus";
 import Settings from "./pages/Settings";
 import NotFound from "./pages/NotFound";
 
 const queryClient = new QueryClient();
 
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
           <Routes>
             <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
             <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
             <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
             <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
             <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
             <Route path="/scores" element={<ProtectedRoute><Scores /></ProtectedRoute>} />
             <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
             <Route path="/infusions" element={<ProtectedRoute><Infusions /></ProtectedRoute>} />
             <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
             <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
             <Route path="/focus" element={<ProtectedRoute><Focus /></ProtectedRoute>} />
             <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
             <Route path="*" element={<NotFound />} />
           </Routes>
         </AuthProvider>
       </BrowserRouter>
     </TooltipProvider>
   </QueryClientProvider>
 );
 
 export default App;
