import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HardDrive, AlertTriangle } from 'lucide-react';

const SETUP_STEPS = [
  {
    step: 1,
    title: 'Open Solana App',
    description: 'Screen should show "Application is ready"',
  },
  {
    step: 2,
    title: 'Navigate to Settings',
    description: 'Press the RIGHT button until you see "Settings"',
  },
  {
    step: 3,
    title: 'Enable Blind Signing',
    description: 'Press BOTH buttons on "Allow blind sign" → change to "Yes"',
  },
  {
    step: 4,
    title: 'Return to Main Screen',
    description: 'Press RIGHT to "Back" → BOTH buttons → "Application is ready"',
  },
];

export function LedgerSetupGuide() {
  return (
    <Card className="bg-muted/50 border-2 border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Ledger Setup Checklist
        </CardTitle>
        <CardDescription>Complete these steps on your physical Ledger device</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {SETUP_STEPS.map(({ step, title, description }) => (
          <div key={step} className="flex items-start gap-3 p-3 rounded-lg bg-background">
            <Badge variant="outline" className="mt-0.5">{step}</Badge>
            <div>
              <p className="font-medium text-sm">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
        
        <Alert className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm">App Version Required: v1.3.0+</AlertTitle>
          <AlertDescription className="text-xs">
            Update via Ledger Live if needed. Check version in Settings → About on your Ledger.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
