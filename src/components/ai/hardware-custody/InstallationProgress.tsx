import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { InstallationStep } from '@/hooks/useHardwareCustody';

interface InstallationProgressProps {
  currentStep: InstallationStep;
  progress: number;
}

const STEPS = [
  { key: 'idle', label: 'Initialize', threshold: 0 },
  { key: 'awaiting_hardware', label: 'Await Hardware', threshold: 15 },
  { key: 'connecting', label: 'Connect', threshold: 30 },
  { key: 'signing', label: 'Sign', threshold: 50 },
  { key: 'broadcasting', label: 'Broadcast', threshold: 70 },
  { key: 'installed', label: 'Complete', threshold: 100 },
] as const;

export function InstallationProgress({ currentStep, progress }: InstallationProgressProps) {
  if (currentStep === 'installed') return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Installation Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        <div className="grid grid-cols-6 gap-1 text-xs text-center">
          {STEPS.map((step) => (
            <div
              key={step.key}
              className={cn(
                'transition-colors',
                progress >= step.threshold && 'text-primary font-medium',
                step.key === 'installed' && progress >= 100 && 'text-success font-medium'
              )}
            >
              {step.label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
