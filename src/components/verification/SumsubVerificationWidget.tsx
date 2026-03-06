import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { invokeEdgeFn } from '@/lib/invokeEdgeFn';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SumsubVerificationWidgetProps {
  levelName?: string;
  onComplete?: (status: 'approved' | 'pending' | 'rejected') => void;
}

type VerificationStep = 'intro' | 'loading' | 'widget' | 'complete';

export function SumsubVerificationWidget({ 
  levelName = 'basic-kyc-level',
  onComplete 
}: SumsubVerificationWidgetProps) {
  const [step, setStep] = useState<VerificationStep>('intro');
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sdkInstanceRef = useRef<any>(null);

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const { data, error } = await invokeEdgeFn<any>('sumsub-token', { levelName });

      if (error) {
        throw new Error(error);
      }

      return data?.token || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize verification';
      setError(message);
      return null;
    }
  };

  const launchWidget = async () => {
    setStep('loading');
    setError(null);

    const token = await getAccessToken();
    if (!token) {
      setStep('intro');
      return;
    }

    // Load Sumsub WebSDK
    const existingScript = document.querySelector('script[src*="sns-websdk-builder"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://static.sumsub.com/idensic/static/sns-websdk-builder.js';
      script.async = true;
      script.onload = () => initializeSDK(token);
      script.onerror = () => {
        setError('Failed to load verification service');
        setStep('intro');
      };
      document.body.appendChild(script);
    } else {
      initializeSDK(token);
    }
  };

  const initializeSDK = (token: string) => {
    if (!containerRef.current) return;

    setStep('widget');

    // @ts-ignore - Sumsub SDK loaded globally
    const snsWebSdk = window.snsWebSdk;
    if (!snsWebSdk) {
      setError('Verification service not available');
      setStep('intro');
      return;
    }

    sdkInstanceRef.current = snsWebSdk
      .init(token, async () => {
        const newToken = await getAccessToken();
        return newToken || '';
      })
      .withConf({
        lang: 'en',
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      })
      .withOptions({
        addViewportTag: false,
        adaptIframeHeight: true,
      })
      .on('idCheck.onStepCompleted', (payload: any) => {
        console.log('Verification step completed:', payload);
      })
      .on('idCheck.onError', (error: any) => {
        console.error('Verification error:', error);
        toast.error('Verification encountered an error');
      })
      .on('idCheck.applicantStatus', (status: any) => {
        console.log('Applicant status update:', status);
        
        if (status.reviewStatus === 'completed' || status.reviewStatus === 'pending') {
          const reviewAnswer = status.reviewResult?.reviewAnswer;
          
          if (reviewAnswer === 'GREEN') {
            setStep('complete');
            toast.success('Identity verified successfully!');
            onComplete?.('approved');
          } else if (reviewAnswer === 'RED') {
            toast.error('Verification was not successful. Please try again with valid documents.');
            onComplete?.('rejected');
          } else {
            toast.info('Documents submitted for review');
            onComplete?.('pending');
          }
        }
      })
      .build();

    sdkInstanceRef.current.launch('#sumsub-container');
  };

  useEffect(() => {
    return () => {
      // Cleanup SDK instance
      if (sdkInstanceRef.current) {
        try {
          sdkInstanceRef.current.destroy?.();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  if (step === 'complete') {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-success">Verification Complete</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your identity has been verified. Your profile will be updated shortly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Identity Verification
        </CardTitle>
        <CardDescription>
          Verify your identity to unlock professional features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'intro' && (
          <>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You'll need a valid government-issued ID and to take a selfie. 
                The process takes about 2-3 minutes.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">What you'll need:</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Government-issued photo ID (passport, driver's license, or national ID)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Camera access for selfie verification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Good lighting for clear photos
                </li>
              </ul>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={launchWidget} className="w-full gap-2">
              <Shield className="h-4 w-4" />
              Start Verification
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Verification powered by Sumsub. Your data is encrypted and secure.
            </p>
          </>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Initializing verification...</p>
          </div>
        )}

        {step === 'widget' && (
          <div 
            id="sumsub-container" 
            ref={containerRef}
            className="min-h-[500px] rounded-lg overflow-hidden"
          />
        )}
      </CardContent>
    </Card>
  );
}
