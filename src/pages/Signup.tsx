import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { UHSLogo } from '@/components/brand/UHSLogo';
import { TrustBadge } from '@/components/brand/TrustBadges';
import { Loader2, Shield, Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { safeRedirect, buildRedirectQuery } from '@/lib/safeRedirect';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Validated: only same-origin root-relative paths are accepted; anything
  // suspicious falls back to /dashboard to prevent open-redirect attacks.
  const redirectTo = safeRedirect(searchParams.get('redirect'));
  const loginHref = `/login${buildRedirectQuery(redirectTo)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Conta criada! Escolha seu perfil para continuar.');
      navigate('/onboarding', { replace: true });
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
      }
      // If successful, the page will redirect
    } catch (err) {
      toast.error('Failed to sign in with Google');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex hero-pattern">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[hsl(170_25%_12%)] to-[hsl(168_30%_18%)] text-white p-12 flex-col justify-between">
        <Link to="/">
          <UHSLogo size="lg" />
        </Link>
        
        <div className="space-y-6 max-w-md">
          <h2 className="text-3xl font-bold leading-tight">
            Join the Universal Health Operating System
          </h2>
          <p className="text-white/70 text-lg">
            Clinical excellence meets absolute data sovereignty. Your practice, your terms.
          </p>
          
          <div className="space-y-3 text-white/80">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-[hsl(168_55%_50%)]" />
              <span>No patient identifiers stored</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-[hsl(168_55%_50%)]" />
              <span>Blockchain-verified audit trail</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-[hsl(168_55%_50%)]" />
              <span>AI-powered clinical insights</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-white/50 text-sm">
          <Lock className="h-4 w-4" />
          <span>End-to-end encrypted • HIPAA aligned • GDPR ready</span>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="lg:hidden inline-block mb-6">
              <UHSLogo size="md" />
            </Link>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-muted-foreground mt-2">Start your journey with UHS Health OS</p>
          </div>

          {/* Google Sign Up */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4 h-11 rounded-xl"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Jane Smith"
                className="mt-1 h-11 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@clinic.com"
                required
                className="mt-1 h-11 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="mt-1 h-11 rounded-xl"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-[hsl(165_60%_48%)] hover:opacity-90" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to={loginHref} className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>

          {/* Privacy notice */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex justify-center mb-3">
              <TrustBadge variant="privacy" size="sm" />
            </div>
            <p className="text-center text-xs text-muted-foreground px-4">
              By signing up, you acknowledge this is an organizational tool, not a medical record system. 
              Patient identifiers are never stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
