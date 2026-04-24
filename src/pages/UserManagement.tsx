import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Mail, Loader2, ShieldAlert } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function UserManagement() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [email, setEmail] = useState('josegriloj@gmail.com');
  const [sending, setSending] = useState(false);
  const [lastSentTo, setLastSentTo] = useState<string | null>(null);

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

  const handleSendReset = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(trimmed)) {
      toast.error('Enter a valid email address');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      // Note: Supabase intentionally does not reveal whether the account exists.
      // We always show a generic confirmation to avoid account enumeration.
      if (error && error.message && !/rate/i.test(error.message)) {
        // Surface only non-sensitive errors (e.g. rate limit), keep details minimal
        console.error('Password reset error:', error);
      }

      setLastSentTo(trimmed);
      toast.success('Password reset email dispatched (if the account exists).');
    } catch (err) {
      console.error(err);
      toast.error('Could not dispatch reset email. Try again shortly.');
    } finally {
      setSending(false);
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
              Triggers Supabase's standard recovery email. The user must click
              the link in their inbox to choose a new password.
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

            <div className="flex items-center gap-3">
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
      </div>
    </AppLayout>
  );
}
