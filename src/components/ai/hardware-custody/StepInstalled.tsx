import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Lock } from 'lucide-react';
import type { CustodyStatus } from '@/hooks/useHardwareCustody';

interface StepInstalledProps {
  custodyStatus: CustodyStatus;
}

export function StepInstalled({ custodyStatus }: StepInstalledProps) {
  return (
    <Card className="border-success">
      <CardContent className="py-8 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-success">Token Installed</h3>
            <p className="text-sm text-muted-foreground">
              Ultimate User privileges are now bound to your hardware wallet
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Hardware Type</p>
            <p className="font-medium">{custodyStatus.hardware_type || 'Unknown'}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Public Key</p>
            <p className="font-mono text-sm truncate">{custodyStatus.hardware_pubkey}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Derivation Path</p>
            <p className="font-mono text-sm">{custodyStatus.derivation_path}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Installed At</p>
            <p className="text-sm">
              {custodyStatus.transfer_completed_at 
                ? new Date(custodyStatus.transfer_completed_at).toLocaleString()
                : 'N/A'}
            </p>
          </div>
        </div>
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>Hardware Required</AlertTitle>
          <AlertDescription>
            All Ultimate User operations now require hardware wallet signature verification.
            Keep your device secure - there is no recovery mechanism.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
