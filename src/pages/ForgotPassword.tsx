import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Mail,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Send,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type ResetStatus = 'idle' | 'requested' | 'sent' | 'expired' | 'error' | 'rate_limited';

// Default backoff window when the auth service rate-limits us. Supabase
// typically allows another attempt after ~60s.
const RATE_LIMIT_WAIT_S = 60;

const emailSchema = z
  .string()
  .trim()
  .min(1, { message: 'Email is required' })
  .max(255, { message: 'Email is too long' })
  .email({ message: 'Enter a valid email address' });

// Reset links typically expire after ~1 hour. We surface a "link expired"
// banner after this window so the user can resend without confusion.
const LINK_TTL_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_S = 30;
const STORAGE_KEY = 'uhs:forgot-password:state';

type PersistedState = {
  email: string;
  sentAt: number;
  cooldownUntil: number;
};

const loadPersisted = (): PersistedState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed?.email || !parsed?.sentAt) return null;
    // Drop if link already expired beyond TTL.
    if (Date.now() - parsed.sentAt >= LINK_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const persisted = typeof window !== 'undefined' ? loadPersisted() : null;
  const [email, setEmail] = useState(persisted?.email ?? '');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<ResetStatus>(persisted ? 'sent' : 'idle');
  const [sentAt, setSentAt] = useState<number | null>(persisted?.sentAt ?? null);
  const [cooldown, setCooldown] = useState(
    persisted ? Math.max(0, Math.ceil((persisted.cooldownUntil - Date.now()) / 1000)) : 0,
  );
  const [now, setNow] = useState(Date.now());

  // Tick every second so the "sent X min ago" + expiry banner update live.
  useEffect(() => {
    if (status !== 'sent') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status]);

  // Auto-flip to "expired" once the link TTL passes.
  useEffect(() => {
    if (status === 'sent' && sentAt && now - sentAt >= LINK_TTL_MS) {
      setStatus('expired');
    }
  }, [now, sentAt, status]);

  // Resend cooldown countdown.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Refs for keyboard-friendly focus transitions on status change.
  const statusRegionRef = useRef<HTMLDivElement>(null);
  const resendButtonRef = useRef<HTMLButtonElement>(null);

  // Move focus to the most relevant element when status changes so keyboard
  // and screen-reader users land on the new content immediately.
  useEffect(() => {
    if (status === 'sent' || status === 'expired') {
      // Defer to allow the alert + retry actions to render first.
      const id = window.setTimeout(() => {
        resendButtonRef.current?.focus();
      }, 50);
      return () => window.clearTimeout(id);
    }
    if (status === 'error') {
      statusRegionRef.current?.focus();
    }
  }, [status]);

  const sendReset = async (target: string) => {
    setStatus('requested');
    setErrorMsg(null);
    try {
      const { error } = await resetPassword(target);
      if (error) {
        if (/rate|too many/i.test(error.message)) {
          setStatus('error');
          setErrorMsg('Too many requests. Please wait a minute and try again.');
          return;
        }
        // Treat other errors as success to prevent account enumeration.
      }
      const sentTimestamp = Date.now();
      const cooldownUntil = sentTimestamp + RESEND_COOLDOWN_S * 1000;
      setSentAt(sentTimestamp);
      setStatus('sent');
      setCooldown(RESEND_COOLDOWN_S);
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ email: target, sentAt: sentTimestamp, cooldownUntil }),
        );
      } catch {
        // Storage unavailable — cooldown will reset on reload, acceptable fallback.
      }
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again shortly.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Invalid email');
      return;
    }
    await sendReset(parsed.data.toLowerCase());
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    await sendReset(email.trim().toLowerCase());
  };

  const minutesAgo = sentAt ? Math.floor((now - sentAt) / 60000) : 0;
  const minutesLeft = sentAt
    ? Math.max(0, Math.ceil((LINK_TTL_MS - (now - sentAt)) / 60000))
    : 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Forgot password
          </CardTitle>
          <CardDescription>
            Enter your account email and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/*
            Status banners — wrapped in a polite live region so screen readers
            announce transitions (requested → sent → expired/error) without
            stealing focus. Errors use assertive to interrupt.
          */}
          <div
            ref={statusRegionRef}
            tabIndex={-1}
            role="status"
            aria-live={status === 'error' ? 'assertive' : 'polite'}
            aria-atomic="true"
            className="outline-none"
          >
            {status === 'requested' && (
              <Alert>
                <Send className="h-4 w-4 animate-pulse" aria-hidden="true" />
                <AlertTitle>Sending request…</AlertTitle>
                <AlertDescription>
                  Contacting the authentication service.
                </AlertDescription>
              </Alert>
            )}

            {status === 'sent' && (
              <Alert className="border-primary/30">
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                <AlertTitle>Email sent</AlertTitle>
                <AlertDescription className="space-y-1">
                  <p>
                    If an account exists for <span className="font-medium">{email}</span>,
                    a reset link is on its way. Check your inbox and spam folder.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sent {minutesAgo === 0 ? 'just now' : `${minutesAgo} min ago`} ·
                    Link expires in ~{minutesLeft} min
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {status === 'expired' && (
              <Alert variant="destructive">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <AlertTitle>Link expired</AlertTitle>
                <AlertDescription>
                  Your previous reset link has expired. Send a new one to continue.
                </AlertDescription>
              </Alert>
            )}

            {status === 'error' && errorMsg && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertTitle>Couldn't send email</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Form / retry actions */}
          {status === 'sent' || status === 'expired' ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Didn't receive it? You can resend the link below.
              </p>
              <div className="flex gap-2">
                <Button
                  ref={resendButtonRef}
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend reset email'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatus('idle');
                    setSentAt(null);
                    setCooldown(0);
                    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
                  }}
                >
                  Use a different email
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldError) setFieldError(null);
                  }}
                  aria-invalid={!!fieldError}
                  aria-describedby={fieldError ? 'email-error' : undefined}
                  disabled={status === 'requested'}
                />
                {fieldError && (
                  <p id="email-error" className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {fieldError}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={status === 'requested'}>
                {status === 'requested' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>
            </form>
          )}

          <div className="pt-2">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
