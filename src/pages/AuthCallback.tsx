import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Stethoscope } from "lucide-react";

const REDIRECT_KEY = 'uhs_post_login_redirect';

/**
 * Resolve the post-login destination, preferring (in order):
 *   1. the `redirect` query param on the callback URL
 *   2. the value persisted in sessionStorage before initiating OAuth
 *   3. the safe default `/dashboard`
 *
 * Only same-origin, root-relative paths are accepted to prevent open-redirects.
 */
function resolveRedirect(searchParams: URLSearchParams): string {
  const fromQuery = searchParams.get('redirect');
  let fromStorage: string | null = null;
  try {
    fromStorage = sessionStorage.getItem(REDIRECT_KEY);
  } catch {
    /* ignore */
  }
  const candidate = fromQuery || fromStorage || '/dashboard';
  // Whitelist: must be a root-relative path, not a protocol-qualified URL.
  if (!candidate.startsWith('/') || candidate.startsWith('//')) {
    return '/dashboard';
  }
  return candidate;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const finish = (target: string) => {
      if (cancelled) return;
      try {
        sessionStorage.removeItem(REDIRECT_KEY);
      } catch {
        /* ignore */
      }
      navigate(target, { replace: true });
    };

    const run = async () => {
      try {
        const target = resolveRedirect(searchParams);

        // 1) Subscribe FIRST so we never miss the SIGNED_IN event that
        //    Supabase emits after exchanging the OAuth tokens in the URL hash.
        const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
          if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
            finish(target);
          }
        });
        unsub = () => sub.subscription.unsubscribe();

        // 2) Probe current session — handles the case where the session is
        //    already established before the listener attached.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (session) {
          finish(target);
          return;
        }

        // 3) Safety net: if no session materializes within 8s, bounce to login
        //    while preserving the intended redirect.
        timeoutId = setTimeout(() => {
          if (cancelled) return;
          const loginHref =
            target && target !== '/dashboard'
              ? `/login?redirect=${encodeURIComponent(target)}`
              : '/login';
          navigate(loginHref, { replace: true });
        }, 8000);
      } catch (err) {
        console.error("Auth callback error:", err);
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Authentication failed");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      }
    };

    run();

    return () => {
      cancelled = true;
      if (unsub) unsub();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Stethoscope className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-semibold text-foreground">RheumaFlow</span>
          </div>
          <div className="text-destructive text-lg font-medium">Authentication Error</div>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Stethoscope className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-semibold text-foreground">RheumaFlow</span>
        </div>
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <h2 className="text-xl font-semibold text-foreground">Completing sign in...</h2>
        <p className="text-muted-foreground">Please wait while we verify your credentials</p>
      </div>
    </div>
  );
}
