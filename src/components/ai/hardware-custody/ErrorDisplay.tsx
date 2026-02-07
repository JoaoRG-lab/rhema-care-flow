import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, HardDrive } from 'lucide-react';
import type { HardwareError } from '@/hooks/useHardwareCustody';

interface ErrorDisplayProps {
  error: HardwareError;
  retryCount: number;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorDisplay({ error, retryCount, onRetry, onDismiss }: ErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'blind_signing':
        return <HardDrive className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'blind_signing':
        return 'Ledger Configuration Required';
      case 'rejected':
        return 'Signing Cancelled';
      case 'disconnected':
        return 'Device Disconnected';
      case 'network':
        return 'Network Error';
      default:
        return 'Error';
    }
  };

  return (
    <Alert variant="destructive" className="relative">
      {getErrorIcon()}
      <AlertTitle className="flex items-center justify-between">
        <span>{getErrorTitle()}</span>
        {error.code && (
          <code className="text-xs bg-destructive-foreground/10 px-2 py-0.5 rounded">
            {error.code}
          </code>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2 whitespace-pre-line">
        {error.message}
      </AlertDescription>
      
      {(error.recoverable || retryCount < 3) && (
        <div className="flex gap-2 mt-4">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Retry {retryCount > 0 && `(${retryCount})`}
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          )}
        </div>
      )}
      
      {retryCount >= 3 && (
        <p className="text-xs text-destructive-foreground/70 mt-3">
          Multiple attempts failed. Please verify your hardware device is properly configured.
        </p>
      )}
    </Alert>
  );
}
