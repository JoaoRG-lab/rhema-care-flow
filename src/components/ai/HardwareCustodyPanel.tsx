import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, Loader2 } from 'lucide-react';
import { useHardwareCustody } from '@/hooks/useHardwareCustody';

// Sub-components
import { InstallationProgress } from './hardware-custody/InstallationProgress';
import { ErrorDisplay } from './hardware-custody/ErrorDisplay';
import { StepIdle } from './hardware-custody/StepIdle';
import { StepAwaitingHardware } from './hardware-custody/StepAwaitingHardware';
import { StepSigning } from './hardware-custody/StepSigning';
import { StepInstalled } from './hardware-custody/StepInstalled';

export function HardwareCustodyPanel() {
  const {
    custodyStatus,
    isLoading,
    currentStep,
    error,
    retryCount,
    initiateHardwareTransfer,
    connectHardwareWallet,
    signAndBroadcast,
    clearError,
    getStepProgress,
  } = useHardwareCustody();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const handleRetry = () => {
    clearError();
    if (currentStep === 'awaiting_hardware') {
      connectHardwareWallet();
    } else if (currentStep === 'signing' || currentStep === 'broadcasting') {
      signAndBroadcast();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-warning to-warning/80 flex items-center justify-center shadow-lg">
          <Key className="h-7 w-7 text-warning-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Hardware Self-Custody
            {currentStep === 'installed' ? (
              <Badge className="bg-success text-success-foreground">Active</Badge>
            ) : (
              <Badge variant="outline">Pending Installation</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            One-time token installation to external hardware wallet
          </p>
        </div>
      </div>

      {/* Installation Progress */}
      <InstallationProgress 
        currentStep={currentStep} 
        progress={getStepProgress()} 
      />

      {/* Error Display */}
      {error && (
        <ErrorDisplay
          error={error}
          retryCount={retryCount}
          onRetry={handleRetry}
          onDismiss={clearError}
        />
      )}

      {/* Step Content */}
      {currentStep === 'idle' && (
        <StepIdle onStart={initiateHardwareTransfer} />
      )}

      {(currentStep === 'awaiting_hardware' || currentStep === 'connecting') && (
        <StepAwaitingHardware 
          onConnect={connectHardwareWallet}
          isLoading={currentStep === 'connecting'}
        />
      )}

      {(currentStep === 'signing' || currentStep === 'broadcasting') && (
        <StepSigning
          custodyStatus={custodyStatus}
          onSign={signAndBroadcast}
          isBroadcasting={currentStep === 'broadcasting'}
        />
      )}

      {currentStep === 'installed' && custodyStatus && (
        <StepInstalled custodyStatus={custodyStatus} />
      )}
    </div>
  );
}
