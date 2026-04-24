import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Loader2, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const emailSchema = z
  .string()
  .trim()
  .min(1, { message: 'Email is required' })
  .max(255, { message: 'Email is too long' })
  .email({ message: 'Enter a valid email address' });

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldError(null);

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Invalid email');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await resetPassword(parsed.data.toLowerCase());
      if (error) {
        // Avoid leaking whether the account exists; only surface rate-limit-style errors.
        if (/rate|too many/i.test(error.message)) {
          setSubmitError('Too many requests. Please wait a minute and try again.');
        } else {
          // Still confirm success to prevent account enumeration
          setSuccess(true);
        }
      } else {
        setSuccess(true);
      }
    } catch {
      setSubmitError('Something went wrong. Please try again shortly.');
    } finally {
      setSubmitting(false);
    }
  };

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
          {success ? (
            <Alert className="border-primary/30">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription>
                If an account exists for <span className="font-medium">{email}</span>,
                a password reset link has been sent. Check your inbox (and spam folder).
                The link expires shortly for security.
              </AlertDescription>
            </Alert>
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
                  disabled={submitting}
                />
                {fieldError && (
                  <p id="email-error" className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {fieldError}
                  </p>
                )}
              </div>

              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
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
