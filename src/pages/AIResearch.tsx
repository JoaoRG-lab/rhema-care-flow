import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AIResearchDashboard } from '@/components/knowledge/AIResearchDashboard';
import { QualityAssurancePanel } from '@/components/knowledge/QualityAssurancePanel';
import { IgnitionPanel } from '@/components/knowledge/IgnitionPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Scale, Flame } from 'lucide-react';

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
      <div className="container mx-auto py-6 px-4 max-w-7xl space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text-organic mb-2">
            AI Research & Quality System
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Dual AI architecture: Research Engine generates content, Judge evaluates evidence quality,
            and Sentinel continuously monitors for inconsistencies
          </p>
        </div>

        <Tabs defaultValue="ignition" className="space-y-6">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3">
            <TabsTrigger value="ignition" className="gap-2">
              <Flame className="h-4 w-4" />
              Ignition
            </TabsTrigger>
            <TabsTrigger value="research" className="gap-2">
              <Bot className="h-4 w-4" />
              Research
            </TabsTrigger>
            <TabsTrigger value="quality" className="gap-2">
              <Scale className="h-4 w-4" />
              Quality
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ignition">
            <IgnitionPanel />
          </TabsContent>

          <TabsContent value="research">
            <AIResearchDashboard />
          </TabsContent>

          <TabsContent value="quality">
            <QualityAssurancePanel />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
