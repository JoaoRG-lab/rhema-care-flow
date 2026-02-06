import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AIResearchDashboard } from '@/components/knowledge/AIResearchDashboard';

export default function AIResearch() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <AIResearchDashboard />
      </div>
    </AppLayout>
  );
}
