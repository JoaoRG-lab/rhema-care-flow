import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Shield, Mail, Loader2, ShieldAlert, LogOut } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function UserManagement() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [email, setEmail] = useState('josegriloj@gmail.com');
  const [sending, setSending] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [lastSentTo, setLastSentTo] = useState<string | null>(null);
  const [lastRevokedFor, setLastRevokedFor] = useState<string | null>(null);

  if (roleLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateEmail = (raw: string): string | null => {
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
    return trimmed;
  };

  const hashEmail = async (value: string): Promise<string> => {
    const buf = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleSendReset = async () => {
    const target = validateEmail(email);
    if (!target) return toast.error('Enter a valid email address');

    setSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(target, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error && !/rate/i.test(error.message)) {
        console.error('Password reset error:', error);
      }

      // Audit log — admin identity + timestamp, hashed target email (no PII, no password)
      try {
        const { data: userData } = await supabase.auth.getUser();
        const adminId = userData.user?.id;
        if (adminId) {
          await supabase.from('audit_logs').insert({
            user_id: adminId,
            action: 'admin_password_reset_email_sent',
            resource_type: 'auth_user',
            metadata: {
              target_email_hash: await hashEmail(target),
              dispatched_at: new Date().toISOString(),
              dispatch_error: error ? 'rate_limited_or_failed' : null,
            },
          });
        }
      } catch (logErr) {
        console.error('Audit log insert failed:', logErr);
      }

      setLastSentTo(target);
      toast.success('Password reset email dispatched (if the account exists).');
    } catch (err) {
      console.error(err);
      toast.error('Could not dispatch reset email. Try again shortly.');
    } finally {
      setSending(false);
    }
  };

  const handleRevokeSessions = async () => {
    const target = validateEmail(email);
    if (!target) return toast.error('Enter a valid email address');

    setRevoking(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'admin-signout-all-sessions',
        { body: { email: target } }
      );
      if (error) {
        console.error(error);
        toast.error('Could not revoke sessions. Check your admin permissions.');
        return;
      }
      if (data?.success) {
        setLastRevokedFor(target);
        toast.success('All sessions revoked (if the account exists).');
      } else {
        toast.error('Unexpected response from server.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not revoke sessions. Try again shortly.');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-3xl py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">User Management</h1>
            <p className="text-sm text-muted-foreground">
              Admin-only tools. Actions are audit-logged.
            </p>
          </div>
        </div>

        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            For privacy and security, this screen never reveals whether an email
            corresponds to an existing account. Reset links are sent through the
            standard email flow and can only be used by the inbox owner.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send password reset email
            </CardTitle>
            <CardDescription>
              Triggers the standard recovery email. The user must click the link
              in their inbox to choose a new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">User email</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                autoComplete="off"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleSendReset} disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send password reset email
                  </>
                )}
              </Button>
              {lastSentTo && (
                <span className="text-sm text-muted-foreground">
                  Last dispatch: {lastSentTo}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-destructive" />
              Log out all sessions
            </CardTitle>
            <CardDescription>
              Revokes every active session and refresh token for the user.
              Recommended immediately after issuing a password reset to
              minimize account-takeover risk if the old credentials were
              compromised.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                This will sign the user out of every device. They'll need to
                log in again — and after a password reset, they'll only be
                able to log in once they've set their new password.
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap items-center gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={revoking}>
                    {revoking ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Revoking...
                      </>
                    ) : (
                      <>
                        <LogOut className="h-4 w-4 mr-2" />
                        Log out all sessions
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke all sessions?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will immediately sign <span className="font-medium">{email || 'this user'}</span>{' '}
                      out of every device and invalidate all refresh tokens.
                      This action cannot be undone and will be recorded in the
                      audit log.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRevokeSessions}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, revoke all sessions
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {lastRevokedFor && (
                <span className="text-sm text-muted-foreground">
                  Last revoke: {lastRevokedFor}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
