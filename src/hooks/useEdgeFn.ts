import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EdgeFnError {
  message: string;
  status?: number;
  raw?: unknown;
}

interface UseEdgeFnOptions {
  /** Show toast on error (default: true) */
  showErrorToast?: boolean;
  /** Custom error message for toast */
  errorMessage?: string;
}

async function parseEdgeFnError(fnError: unknown): Promise<EdgeFnError> {
  if (fnError instanceof FunctionsHttpError) {
    try {
      const body = await fnError.context?.json();
      return {
        message: body?.error || body?.message || fnError.message,
        status: fnError.context?.status,
        raw: body,
      };
    } catch {
      return {
        message: fnError.message || 'Edge function returned an error',
        raw: fnError,
      };
    }
  }
  if (fnError instanceof FunctionsRelayError) {
    return { message: fnError.message || 'Network relay error', raw: fnError };
  }
  if (fnError instanceof Error) {
    return { message: fnError.message, raw: fnError };
  }
  return { message: 'An unexpected error occurred', raw: fnError };
}

/**
 * Centralized hook for invoking backend functions with consistent
 * error handling, loading state, and type safety.
 */
export function useEdgeFn<TResult = unknown, TBody = Record<string, unknown>>(
  functionName: string,
  options: UseEdgeFnOptions = {}
) {
  const { showErrorToast = true, errorMessage } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<EdgeFnError | null>(null);

  const invoke = useCallback(
    async (body?: TBody): Promise<{ data: TResult | null; error: EdgeFnError | null }> => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke(functionName, {
          body: body ?? {},
        });

        if (fnError) {
          const parsed = await parseEdgeFnError(fnError);
          setError(parsed);
          if (showErrorToast) {
            toast.error(errorMessage || parsed.message);
          }
          return { data: null, error: parsed };
        }

        return { data: data as TResult, error: null };
      } catch (err: unknown) {
        const parsed = await parseEdgeFnError(err);
        setError(parsed);
        if (showErrorToast) {
          toast.error(errorMessage || parsed.message);
        }
        return { data: null, error: parsed };
      } finally {
        setIsLoading(false);
      }
    },
    [functionName, showErrorToast, errorMessage]
  );

  const clearError = useCallback(() => setError(null), []);

  return { invoke, isLoading, error, clearError };
}
