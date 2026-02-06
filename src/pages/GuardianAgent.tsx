import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIGuardianPanel } from '@/components/ai/AIGuardianPanel';
import { HardwareCustodyPanel } from '@/components/ai/HardwareCustodyPanel';
import { AppLayout } from '@/components/layout/AppLayout';
import { Crown, Key } from 'lucide-react';

export default function GuardianAgent() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="guardian" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="guardian" className="gap-2">
              <Crown className="h-4 w-4" />
              AI Guardian
            </TabsTrigger>
            <TabsTrigger value="custody" className="gap-2">
              <Key className="h-4 w-4" />
              Hardware Custody
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guardian">
            <AIGuardianPanel />
          </TabsContent>

          <TabsContent value="custody">
            <HardwareCustodyPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
