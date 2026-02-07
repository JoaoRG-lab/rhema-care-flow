import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Usb, Wallet } from 'lucide-react';

interface StepAwaitingHardwareProps {
  onConnect: () => void;
  isLoading?: boolean;
}

export function StepAwaitingHardware({ onConnect, isLoading }: StepAwaitingHardwareProps) {
  return (
    <Card>
      <CardContent className="py-8 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center animate-pulse">
          <Usb className="h-8 w-8 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Connect Hardware Wallet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your hardware wallet to proceed with token installation.
            Make sure your device is unlocked and the Solana app is open.
          </p>
        </div>
        <Button onClick={onConnect} disabled={isLoading} className="gap-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      </CardContent>
    </Card>
  );
}
