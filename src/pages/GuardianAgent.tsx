import { AIGuardianPanel } from '@/components/ai/AIGuardianPanel';
import { AppLayout } from '@/components/layout/AppLayout';

export default function GuardianAgent() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <AIGuardianPanel />
      </div>
    </AppLayout>
  );
}
