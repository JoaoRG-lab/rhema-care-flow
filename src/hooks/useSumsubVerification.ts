import { useState, useCallback } from 'react';
import { invokeEdgeFn } from '@/lib/invokeEdgeFn';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SumsubToken {
  token: string;
  userId: string;
}

interface UseSumsubVerificationReturn {
  loading: boolean;
  error: string | null;
  getAccessToken: (levelName?: string) => Promise<SumsubToken | null>;
  launchVerification: (levelName?: string) => Promise<void>;
}

export function useSumsubVerification(): UseSumsubVerificationReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAccessToken = useCallback(async (levelName = 'basic-kyc-level'): Promise<SumsubToken | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to verify your identity');
      }

      const { data, error } = await invokeEdgeFn<SumsubToken>('sumsub-token', { levelName });

      if (error) {
        throw new Error(error);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification initialization failed';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const launchVerification = useCallback(async (levelName = 'basic-kyc-level') => {
    const tokenData = await getAccessToken(levelName);
    if (!tokenData) return;

    // Load Sumsub WebSDK dynamically
    const script = document.createElement('script');
    script.src = 'https://static.sumsub.com/idensic/static/sns-websdk-builder.js';
    script.async = true;
    
    script.onload = () => {
      // @ts-expect-error - Sumsub SDK loaded globally
      const snsWebSdkInstance = window.snsWebSdk
        .init(tokenData.token, () => getAccessToken(levelName).then(t => t?.token || ''))
        .withConf({
          lang: 'en',
          theme: 'light',
        })
        .withOptions({
          addViewportTag: false,
          adaptIframeHeight: true,
        })
        .on('idCheck.onStepCompleted', (payload: any) => {
          console.log('Step completed:', payload);
        })
        .on('idCheck.onError', (error: any) => {
          console.error('Verification error:', error);
          toast.error('Verification encountered an error. Please try again.');
        })
        .on('idCheck.applicantStatus', (status: any) => {
          console.log('Applicant status:', status);
          if (status.reviewStatus === 'completed') {
            if (status.reviewResult?.reviewAnswer === 'GREEN') {
              toast.success('Identity verification completed successfully!');
            } else {
              toast.info('Verification submitted. We will review your documents.');
            }
          }
        })
        .build();

      snsWebSdkInstance.launch('#sumsub-websdk-container');
    };

    script.onerror = () => {
      toast.error('Failed to load verification service. Please try again.');
    };

    document.body.appendChild(script);
  }, [getAccessToken]);

  return {
    loading,
    error,
    getAccessToken,
    launchVerification,
  };
}
