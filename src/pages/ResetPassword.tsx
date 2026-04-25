import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock, Clock, CheckCircle2, AlertCircle, HelpCircle, Mail } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';

type LinkStatus = 'validating' | 'ready' | 'expired';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>('validating');
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Detect explicit error in URL hash (e.g. otp_expired, access_denied)
    const hash = window.location.hash || '';
    if (/error=|error_code=/.test(hash)) {
      setLinkStatus('expired');
      return;
    }

    let resolved = false;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        resolved = true;
        setLinkStatus('ready');
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        resolved = true;
        setLinkStatus('ready');
      }
    });

    // If no session has been established within 5s, treat the link as expired/invalid.
    const timeout = setTimeout(() => {
      if (!resolved) setLinkStatus((s) => (s === 'validating' ? 'expired' : s));
    }, 5000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      if (/expired|invalid|jwt/i.test(error.message)) {
        setLinkStatus('expired');
      }
      toast.error(error.message);
    } else {
      toast.success('Password updated. Please sign in.');
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Set a new password
          </CardTitle>
          <CardDescription>
            {linkStatus === 'ready'
              ? 'Enter a new password for your account.'
              : linkStatus === 'expired'
              ? 'Your reset link is no longer valid.'
              : 'Validating your reset link…'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {linkStatus === 'validating' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Validating link</AlertTitle>
              <AlertDescription>
                Checking your reset link. This usually takes a moment.
              </AlertDescription>
            </Alert>
          )}

          {linkStatus === 'ready' && (
            <Alert className="border-primary/30">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertTitle>Link verificado</AlertTitle>
              <AlertDescription>
                You can now choose a new password.
              </AlertDescription>
            </Alert>
          )}

          {linkStatus === 'expired' && (
            <Alert variant="destructive">
              <Clock className="h-4 w-4" />
              <AlertTitle>Link expired or invalid</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  Reset links expire for security. Request a new one to continue.
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/forgot-password">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Request a new reset email
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {linkStatus !== 'expired' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1 h-11 rounded-xl"
                  disabled={linkStatus !== 'ready'}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1 h-11 rounded-xl"
                  disabled={linkStatus !== 'ready'}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-xl"
                disabled={loading || linkStatus !== 'ready'}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Update password
              </Button>
            </form>
          )}

          {/* Help section — common causes + one-click route to request a fresh email */}
          <div className="pt-2 border-t">
            <Accordion type="single" collapsible>
              <AccordionItem value="help" className="border-none">
                <AccordionTrigger className="text-sm hover:no-underline py-2">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <HelpCircle className="h-4 w-4" />
                    Why isn't my reset link working?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-3">
                  <ul className="list-disc list-inside space-y-1.5">
                    <li>
                      <span className="font-medium text-foreground">Link expired.</span>{' '}
                      Reset links are valid for ~1 hour for your security.
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Already used.</span>{' '}
                      Each link works only once — opening it twice invalidates it.
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Opened in a different browser.</span>{' '}
                      Some email clients pre-fetch links, consuming the token.
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Newer email requested.</span>{' '}
                      Sending a new reset email invalidates earlier ones.
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Copy-paste truncation.</span>{' '}
                      Make sure the full URL was pasted, including everything after <code>#</code>.
                    </li>
                  </ul>
                  <Button asChild size="sm" className="w-full">
                    <Link to="/forgot-password">
                      <Mail className="h-4 w-4 mr-2" />
                      Send me a new reset email
                    </Link>
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
