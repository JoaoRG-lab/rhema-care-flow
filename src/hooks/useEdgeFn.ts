import { useState, useCallback } from 'react';
import { invokeEdgeFn } from '@/lib/invokeEdgeFn';
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
        const { data, error: fnError, status } = await invokeEdgeFn<TResult>(
          functionName,
          (body ?? {}) as Record<string, unknown>
        );

        if (fnError) {
          const parsed: EdgeFnError = { message: fnError, status };
          setError(parsed);
          if (showErrorToast) {
            toast.error(errorMessage || parsed.message);
          }
          return { data: null, error: parsed };
        }

        return { data, error: null };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        const parsed: EdgeFnError = { message, raw: err };
        setError(parsed);
        if (showErrorToast) {
          toast.error(errorMessage || message);
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
