import { useState, useCallback, useEffect } from 'react';
import { invokeEdgeFn } from '@/lib/invokeEdgeFn';
import { toast } from 'sonner';
import { PublicKey } from '@solana/web3.js';

export interface CustodyStatus {
  installation_status: string;
  hardware_type: string | null;
  hardware_pubkey: string | null;
  transfer_completed_at: string | null;
  derivation_path: string;
  last_auth_at: string | null;
}

export type InstallationStep = 
  | 'idle' 
  | 'initiating' 
  | 'awaiting_hardware' 
  | 'connecting' 
  | 'signing' 
  | 'broadcasting'
  | 'installed';

export interface HardwareError {
  type: 'blind_signing' | 'rejected' | 'disconnected' | 'network' | 'unknown';
  code: string | null;
  message: string;
  recoverable: boolean;
}

function parseHardwareError(err: any): HardwareError {
  const message = err?.message || 'Unknown error';
  const errorCode = message.match(/0x[a-fA-F0-9]+/)?.[0] || null;
  
  const isBlindSignError = message.includes('0x6a81') || message.includes('UNKNOWN_ERROR');
  const isRejected = message.toLowerCase().includes('rejected') || message.toLowerCase().includes('cancelled');
  const isDisconnected = message.toLowerCase().includes('disconnected') || message.toLowerCase().includes('not connected');
  const isNetwork = message.toLowerCase().includes('network') || message.toLowerCase().includes('timeout');

  if (isBlindSignError) {
    return {
      type: 'blind_signing',
      code: errorCode || '0x6a81',
      message: `Ledger Error (${errorCode || '0x6a81'}): Blind Signing is disabled or your Solana App is outdated.\n\n` +
        '• On your Ledger device: Open Solana App → Settings → Allow blind sign → Yes\n' +
        '• Ensure Solana App version is 1.3.0 or higher (update via Ledger Live)\n' +
        '• Return to main screen before trying again',
      recoverable: true,
    };
  }
  
  if (isRejected) {
    return {
      type: 'rejected',
      code: null,
      message: 'Transaction was rejected or cancelled on the device. Please try again when ready.',
      recoverable: true,
    };
  }
  
  if (isDisconnected) {
    return {
      type: 'disconnected',
      code: null,
      message: 'Hardware wallet disconnected. Please reconnect your device and try again.',
      recoverable: true,
    };
  }
  
  if (isNetwork) {
    return {
      type: 'network',
      code: null,
      message: 'Network error occurred. Please check your connection and try again.',
      recoverable: true,
    };
  }

  return {
    type: 'unknown',
    code: errorCode,
    message: `Signing failed: ${message}. Please ensure your device is unlocked and the Solana app is open.`,
    recoverable: false,
  };
}

export function useHardwareCustody() {
  const [custodyStatus, setCustodyStatus] = useState<CustodyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<InstallationStep>('idle');
  const [error, setError] = useState<HardwareError | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const clearError = useCallback(() => setError(null), []);

  const fetchCustodyStatus = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('hardware-custody-auth', {
        body: { action: 'get_custody_status' },
      });

      if (fetchError) {
        // Extract real message from FunctionsHttpError
        if (fetchError instanceof FunctionsHttpError) {
          try {
            const body = await fetchError.context?.json();
            console.warn('Custody status error:', body?.error || fetchError.message);
          } catch { /* ignore parse errors */ }
        }
        // Don't show error for auth failures on initial load (user not logged in)
        return;
      }

      setCustodyStatus(data?.custody || null);
      
      if (data?.custody?.installation_status === 'active') {
        setCurrentStep('installed');
      } else if (data?.custody?.installation_status === 'hardware_connected') {
        const newChallenge = `UHS_ULTIMATE_USER_INSTALLATION_${Date.now()}_${crypto.randomUUID()}`;
        setChallenge(newChallenge);
        setCurrentStep('signing');
      } else if (data?.custody?.installation_status === 'awaiting_hardware') {
        setCurrentStep('awaiting_hardware');
      }
    } catch (err: any) {
      console.error('Failed to fetch custody status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustodyStatus();
  }, [fetchCustodyStatus]);

  const initiateHardwareTransfer = useCallback(async () => {
    setCurrentStep('initiating');
    setError(null);
    setRetryCount(0);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('hardware-custody-auth', {
        body: { action: 'initiate_hardware_transfer' },
      });

      if (invokeError) throw invokeError;

      setCurrentStep('awaiting_hardware');
      toast.success('Hardware transfer initiated. Connect your hardware wallet.');
      return { success: true, data };
    } catch (err: any) {
      const parsedError = parseHardwareError(err);
      setError(parsedError);
      setCurrentStep('idle');
      toast.error(parsedError.message);
      return { success: false, error: parsedError };
    }
  }, []);

  const connectHardwareWallet = useCallback(async () => {
    setCurrentStep('connecting');
    setError(null);

    try {
      const solana = (window as any).solana;
      
      if (!solana) {
        throw new Error('No Solana wallet detected. Please connect a hardware wallet (Ledger via Phantom, or Solflare).');
      }

      const response = await solana.connect();
      const publicKey = response.publicKey.toString();

      // Detect hardware type
      let hardwareType = 'software_wallet';
      if (solana.isLedger) hardwareType = 'ledger';
      else if (solana.isPhantom) hardwareType = 'phantom';
      else if (solana.isSolflare) hardwareType = 'solflare';

      // Register the hardware wallet
      const { data, error: registerError } = await supabase.functions.invoke('hardware-custody-auth', {
        body: {
          action: 'register_hardware_wallet',
          hardware_pubkey: publicKey,
          hardware_type: hardwareType,
        },
      });

      if (registerError) throw registerError;

      // Generate challenge for signing
      const newChallenge = `UHS_ULTIMATE_USER_INSTALLATION_${Date.now()}_${crypto.randomUUID()}`;
      setChallenge(newChallenge);
      setCurrentStep('signing');
      
      toast.success(`${hardwareType.toUpperCase()} wallet connected. Sign to complete installation.`);
      fetchCustodyStatus();
      
      return { success: true, publicKey, hardwareType };
    } catch (err: any) {
      const parsedError = parseHardwareError(err);
      setError(parsedError);
      
      if (parsedError.type === 'disconnected') {
        setCurrentStep('awaiting_hardware');
      }
      
      toast.error(parsedError.message);
      return { success: false, error: parsedError };
    }
  }, [fetchCustodyStatus]);

  const signAndBroadcast = useCallback(async () => {
    if (!challenge) {
      setError({
        type: 'unknown',
        code: null,
        message: 'No challenge available. Please reconnect wallet.',
        recoverable: true,
      });
      return { success: false };
    }

    setError(null);
    setCurrentStep('signing');

    try {
      const solana = (window as any).solana;

      if (!solana?.isConnected) {
        throw new Error('Wallet not connected. Please reconnect.');
      }

      const publicKey: PublicKey = solana.publicKey;

      // Notify user to check device
      toast.info('Please approve the message on your Ledger device...', {
        duration: 10000,
        id: 'ledger-approval',
      });
      
      const message = new TextEncoder().encode(challenge);
      const { signature } = await solana.signMessage(message, 'utf8');
      
      toast.dismiss('ledger-approval');
      
      const signatureHex = Array.from(signature as Uint8Array)
        .map((b: number) => b.toString(16).padStart(2, '0'))
        .join('');

      // Move to broadcasting step
      setCurrentStep('broadcasting');
      toast.info('Signature received. Broadcasting to network...');

      const { data, error: completeError } = await supabase.functions.invoke('hardware-custody-auth', {
        body: {
          action: 'complete_installation',
          signature: signatureHex,
          challenge,
          publicKey: publicKey.toBase58(),
        },
      });

      if (completeError) throw completeError;

      setCurrentStep('installed');
      setRetryCount(0);
      toast.success('🎉 Ultimate User token permanently installed on hardware wallet!');
      fetchCustodyStatus();
      
      return { success: true, data };
    } catch (err: any) {
      console.error('Installation error:', err);
      toast.dismiss('ledger-approval');
      
      const parsedError = parseHardwareError(err);
      setError(parsedError);
      setRetryCount(prev => prev + 1);
      
      // Handle step rollback based on error type
      if (parsedError.type === 'disconnected') {
        setCurrentStep('awaiting_hardware');
        toast.error('Device disconnected', { description: 'Please reconnect your hardware wallet' });
      } else if (parsedError.type === 'blind_signing') {
        setCurrentStep('signing');
        toast.error('Ledger requires Blind Signing to be enabled', {
          description: 'Check your device settings and try again',
          duration: 8000,
        });
      } else if (parsedError.type === 'rejected') {
        setCurrentStep('signing');
        toast.warning('Signing cancelled', { description: 'You can try again when ready' });
      } else if (parsedError.type === 'network') {
        // Stay on broadcasting step for network errors - allow retry
        setCurrentStep('signing');
        toast.error('Network error', { description: 'Please check your connection and retry' });
      } else {
        setCurrentStep('signing');
        toast.error('Signing failed', { description: parsedError.message });
      }
      
      return { success: false, error: parsedError };
    }
  }, [challenge, fetchCustodyStatus]);

  const resetFlow = useCallback(() => {
    setCurrentStep('idle');
    setError(null);
    setChallenge(null);
    setRetryCount(0);
  }, []);

  const getStepProgress = useCallback(() => {
    switch (currentStep) {
      case 'idle': return 0;
      case 'initiating': return 15;
      case 'awaiting_hardware': return 30;
      case 'connecting': return 50;
      case 'signing': return 70;
      case 'broadcasting': return 90;
      case 'installed': return 100;
      default: return 0;
    }
  }, [currentStep]);

  return {
    // State
    custodyStatus,
    isLoading,
    currentStep,
    error,
    retryCount,
    challenge,
    
    // Actions
    initiateHardwareTransfer,
    connectHardwareWallet,
    signAndBroadcast,
    resetFlow,
    clearError,
    fetchCustodyStatus,
    
    // Helpers
    getStepProgress,
  };
}
