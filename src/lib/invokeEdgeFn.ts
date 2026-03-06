import { supabase } from '@/integrations/supabase/client';

export interface EdgeFnResult<T = unknown> {
  data: T | null;
  error: string | null;
  status?: number;
}

/**
 * Wrapper around supabase.functions.invoke that properly extracts
 * error messages from non-2xx responses instead of showing the generic
 * "Edge Function returned a non-2xx status code" message.
 */
export async function invokeEdgeFn<T = unknown>(
  functionName: string,
  body: Record<string, unknown> = {}
): Promise<EdgeFnResult<T>> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      }
    );

    let responseData: any;
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }

    if (!response.ok) {
      const errorMsg =
        responseData?.error ||
        responseData?.message ||
        `Function returned status ${response.status}`;
      return { data: null, error: errorMsg, status: response.status };
    }

    return { data: responseData as T, error: null, status: response.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { data: null, error: message };
  }
}
