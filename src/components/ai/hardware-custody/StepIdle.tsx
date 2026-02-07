import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HardDrive, Shield, Zap } from 'lucide-react';

interface StepIdleProps {
  onStart: () => void;
  isLoading?: boolean;
}

export function StepIdle({ onStart, isLoading }: StepIdleProps) {
  return (
    <Card className="border-2 border-dashed border-warning/50">
      <CardContent className="py-8 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
          <HardDrive className="h-8 w-8 text-warning" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Install Ultimate User Token</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Transfer your Ultimate User privileges to an external hardware wallet.
            This is a ONE-TIME installation. Once complete, the hardware device
            will be the ONLY way to access Ultimate privileges.
          </p>
        </div>
        <Alert className="text-left">
          <Shield className="h-4 w-4" />
          <AlertTitle>Security Notice</AlertTitle>
          <AlertDescription>
            • Supported devices: Ledger (via Phantom), Phantom, Solflare<br />
            • Derivation path: m/44'/501'/0'/0' (Solana standard)<br />
            • This action is IRREVERSIBLE - token cannot be reinstalled
          </AlertDescription>
        </Alert>
        <Button 
          onClick={onStart}
          disabled={isLoading}
          className="gap-2 bg-warning text-warning-foreground hover:bg-warning/90"
        >
          <Zap className="h-4 w-4" />
          Begin Hardware Installation
        </Button>
      </CardContent>
    </Card>
  );
}
