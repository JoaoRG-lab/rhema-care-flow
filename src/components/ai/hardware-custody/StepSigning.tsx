import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Fingerprint, Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { LedgerSetupGuide } from './LedgerSetupGuide';
import type { CustodyStatus } from '@/hooks/useHardwareCustody';

interface StepSigningProps {
  custodyStatus: CustodyStatus | null;
  onSign: () => void;
  isBroadcasting?: boolean;
}

export function StepSigning({ custodyStatus, onSign, isBroadcasting }: StepSigningProps) {
  return (
    <Card>
      <CardContent className="py-8 space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            {isBroadcasting ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <Fingerprint className="h-8 w-8 text-primary" />
            )}
          </div>
          <h3 className="font-semibold text-lg mt-4">
            {isBroadcasting ? 'Broadcasting Transaction...' : 'Sign to Install Token'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isBroadcasting 
              ? 'Your signature has been received. Broadcasting to the network...'
              : 'Your hardware wallet is connected. Follow the checklist below before signing.'}
          </p>
        </div>
        
        {custodyStatus && (
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>Hardware: {custodyStatus.hardware_type}</p>
            <p>Public Key: {custodyStatus.hardware_pubkey}</p>
          </div>
        )}

        {!isBroadcasting && <LedgerSetupGuide />}

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>⚠️ IRREVERSIBLE ACTION</AlertTitle>
          <AlertDescription>
            After signing, this hardware wallet will be the <strong>ONLY</strong> way to access
            Ultimate User privileges. There is <strong>NO recovery</strong> if you lose the device.
          </AlertDescription>
        </Alert>
        
        <div className="text-center">
          <Button
            onClick={onSign}
            disabled={isBroadcasting}
            size="lg"
            className="gap-2 bg-warning text-warning-foreground hover:bg-warning/90"
          >
            {isBroadcasting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Broadcasting...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Sign & Complete Installation
              </>
            )}
          </Button>
          {!isBroadcasting && (
            <p className="text-xs text-muted-foreground mt-2">
              Click above, then approve the message on your Ledger
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
