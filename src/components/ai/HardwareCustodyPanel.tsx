import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  HardDrive,
  Key,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Lock,
  Fingerprint,
  Usb,
  Wallet,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

interface CustodyStatus {
  installation_status: string;
  hardware_type: string | null;
  hardware_pubkey: string | null;
  transfer_completed_at: string | null;
  derivation_path: string;
  last_auth_at: string | null;
}

type InstallationStep = 'idle' | 'initiating' | 'awaiting_hardware' | 'connecting' | 'signing' | 'installed';

export function HardwareCustodyPanel() {
  const [custodyStatus, setCustodyStatus] = useState<CustodyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<InstallationStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);

  const fetchCustodyStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('hardware-custody-auth', {
        body: { action: 'get_custody_status' },
      });

      if (error) throw error;
      setCustodyStatus(data.custody);
      
      if (data.custody?.installation_status === 'active') {
        setCurrentStep('installed');
      } else if (data.custody?.installation_status === 'hardware_connected') {
        setCurrentStep('signing');
      } else if (data.custody?.installation_status === 'awaiting_hardware') {
        setCurrentStep('awaiting_hardware');
      }
    } catch (err: any) {
      console.error('Failed to fetch custody status:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustodyStatus();
  }, [fetchCustodyStatus]);

  const initiateHardwareTransfer = async () => {
    setCurrentStep('initiating');
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('hardware-custody-auth', {
        body: { action: 'initiate_hardware_transfer' },
      });

      if (error) throw error;

      setCurrentStep('awaiting_hardware');
      toast.success('Hardware transfer initiated. Connect your hardware wallet.');
    } catch (err: any) {
      setError(err.message);
      setCurrentStep('idle');
      toast.error(err.message);
    }
  };

  const connectHardwareWallet = async () => {
    setCurrentStep('connecting');
    setError(null);

    try {
      // Check for Solana wallet (Phantom, Ledger, etc.)
      const solana = (window as any).solana;
      
      if (!solana) {
        throw new Error('No Solana wallet detected. Please connect a hardware wallet (Ledger via Phantom, or Solflare).');
      }

      // Request connection
      const response = await solana.connect();
      const publicKey = response.publicKey.toString();

      // Detect hardware type
      let hardwareType = 'software_wallet';
      if (solana.isLedger) hardwareType = 'ledger';
      else if (solana.isPhantom) hardwareType = 'phantom';
      else if (solana.isSolflare) hardwareType = 'solflare';

      // Register the hardware wallet
      const { data, error } = await supabase.functions.invoke('hardware-custody-auth', {
        body: {
          action: 'register_hardware_wallet',
          hardware_pubkey: publicKey,
          hardware_type: hardwareType,
        },
      });

      if (error) throw error;

      // Generate challenge for signing
      const newChallenge = `UHS_ULTIMATE_USER_INSTALLATION_${Date.now()}_${crypto.randomUUID()}`;
      setChallenge(newChallenge);
      setCurrentStep('signing');
      
      toast.success(`${hardwareType.toUpperCase()} wallet connected. Sign to complete installation.`);
      fetchCustodyStatus();
    } catch (err: any) {
      setError(err.message);
      setCurrentStep('awaiting_hardware');
      toast.error(err.message);
    }
  };

  const completeInstallation = async () => {
    if (!challenge) {
      setError('No challenge available. Please reconnect wallet.');
      return;
    }

    setError(null);

    try {
      const solana = (window as any).solana;
      
      if (!solana?.isConnected) {
        throw new Error('Wallet not connected. Please reconnect.');
      }

      let signatureHex: string;
      const publicKey = solana.publicKey;

      // Try signMessage first (works for most wallets)
      try {
        const message = new TextEncoder().encode(challenge);
        const { signature } = await solana.signMessage(message, 'utf8');
        signatureHex = Array.from(signature as Uint8Array)
          .map((b: number) => b.toString(16).padStart(2, '0'))
          .join('');
      } catch (signMessageError: any) {
        // If signMessage fails (Ledger), fall back to transaction signing
        console.log('signMessage failed, trying transaction signing:', signMessageError.message);
        
        if (signMessageError.message?.includes('0x6a81') || signMessageError.message?.includes('UNKNOWN_ERROR')) {
          toast.info('Using transaction signing for Ledger...');
          
          // Create a minimal self-transfer transaction as proof of ownership
          // This is a zero-value transfer that Ledger can sign
          const transaction = new Transaction();
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: publicKey,
              lamports: 0,
            })
          );
          
          // Set a recent blockhash (we use a placeholder since we won't actually send this)
          transaction.recentBlockhash = 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N';
          transaction.feePayer = publicKey;
          
          // Sign the transaction with Ledger
          const signedTx = await solana.signTransaction(transaction);
          
          // Extract signature from the signed transaction
          const txSignature = signedTx.signature;
          if (!txSignature) {
            throw new Error('Failed to get signature from Ledger transaction');
          }
          
          signatureHex = Array.from(txSignature as Uint8Array)
            .map((b: number) => b.toString(16).padStart(2, '0'))
            .join('');
        } else {
          throw signMessageError;
        }
      }

      // Complete installation
      const { data, error } = await supabase.functions.invoke('hardware-custody-auth', {
        body: {
          action: 'complete_installation',
          signature: signatureHex,
          challenge: challenge,
        },
      });

      if (error) throw error;

      setCurrentStep('installed');
      toast.success('🎉 Ultimate User token permanently installed on hardware wallet!');
      fetchCustodyStatus();
    } catch (err: any) {
      console.error('Installation error:', err);
      
      // Provide helpful error messages
      if (err.message?.includes('0x6a81')) {
        setError('Ledger signing failed. Please ensure the Solana app is open and try again.');
      } else if (err.message?.includes('User rejected')) {
        setError('Signing was cancelled. Please try again when ready.');
      } else {
        setError(err.message);
      }
      toast.error(err.message);
    }
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case 'idle': return 0;
      case 'initiating': return 20;
      case 'awaiting_hardware': return 40;
      case 'connecting': return 60;
      case 'signing': return 80;
      case 'installed': return 100;
      default: return 0;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

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
      {currentStep !== 'installed' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Installation Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={getStepProgress()} className="h-2" />
            <div className="grid grid-cols-5 gap-2 text-xs text-center">
              <div className={cn(getStepProgress() >= 0 && 'text-primary font-medium')}>
                Initialize
              </div>
              <div className={cn(getStepProgress() >= 20 && 'text-primary font-medium')}>
                Await Hardware
              </div>
              <div className={cn(getStepProgress() >= 40 && 'text-primary font-medium')}>
                Connect
              </div>
              <div className={cn(getStepProgress() >= 60 && 'text-primary font-medium')}>
                Sign
              </div>
              <div className={cn(getStepProgress() >= 100 && 'text-success font-medium')}>
                Complete
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Installation Steps */}
      {currentStep === 'idle' && (
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
              onClick={initiateHardwareTransfer}
              className="gap-2 bg-warning text-warning-foreground hover:bg-warning/90"
            >
              <Zap className="h-4 w-4" />
              Begin Hardware Installation
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 'awaiting_hardware' && (
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
            <Button onClick={connectHardwareWallet} className="gap-2">
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 'signing' && (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Fingerprint className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Sign to Install Token</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your hardware wallet is connected. Sign the installation message
                to permanently bind the Ultimate User token to this device.
              </p>
            </div>
            {custodyStatus && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Hardware: {custodyStatus.hardware_type}</p>
                <p>Public Key: {custodyStatus.hardware_pubkey}</p>
              </div>
            )}
            
            {/* Ledger-specific instructions */}
            <Alert className="text-left bg-amber-500/10 border-amber-500/30">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-600">Ledger Users: Enable Blind Signing</AlertTitle>
              <AlertDescription className="text-sm space-y-2">
                <p>Before signing, ensure these settings on your Ledger:</p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Open the <strong>Solana app</strong> on your Ledger</li>
                  <li>Go to <strong>Settings → Blind Signing → Enabled</strong></li>
                  <li>Return to the main Solana app screen</li>
                  <li>Then click "Sign & Complete" below</li>
                </ol>
              </AlertDescription>
            </Alert>

            <Alert variant="destructive" className="text-left">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>⚠️ Final Warning</AlertTitle>
              <AlertDescription>
                After signing, this hardware wallet will be the ONLY way to access
                Ultimate User privileges. There is NO recovery if you lose the device.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={completeInstallation}
              className="gap-2 bg-warning text-warning-foreground hover:bg-warning/90"
            >
              <Lock className="h-4 w-4" />
              Sign & Complete Installation
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 'installed' && custodyStatus && (
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
                <p className="font-mono text-sm">{custodyStatus.hardware_pubkey}</p>
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
      )}
    </div>
  );
}
