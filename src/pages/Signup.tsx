 import { useState } from 'react';
 import { Link, useNavigate } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Separator } from '@/components/ui/separator';
 import { useAuth } from '@/contexts/AuthContext';
 import { Stethoscope, Loader2 } from 'lucide-react';
 import { toast } from 'sonner';
 import { lovable } from '@/integrations/lovable';
 
 export default function Signup() {
   const [fullName, setFullName] = useState('');
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [loading, setLoading] = useState(false);
   const [googleLoading, setGoogleLoading] = useState(false);
   const { signUp } = useAuth();
   const navigate = useNavigate();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
 
     const { error } = await signUp(email, password, fullName);
 
     if (error) {
       toast.error(error.message);
       setLoading(false);
     } else {
       toast.success('Account created! Please check your email to verify.');
       navigate('/login');
     }
   };

   const handleGoogleSignIn = async () => {
     setGoogleLoading(true);
     try {
       const { error } = await lovable.auth.signInWithOAuth("google", {
         redirect_uri: window.location.origin,
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
     <div className="min-h-screen bg-background flex items-center justify-center px-6">
       <div className="w-full max-w-md">
         <div className="text-center mb-8">
           <Link to="/" className="inline-flex items-center gap-3 mb-6">
             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
               <Stethoscope className="h-6 w-6 text-primary-foreground" />
             </div>
             <span className="font-semibold text-2xl">RheumaFlow</span>
           </Link>
           <h1 className="text-2xl font-bold">Create your account</h1>
           <p className="text-muted-foreground mt-2">Start streamlining your practice</p>
         </div>

         {/* Google Sign Up */}
         <Button
           type="button"
           variant="outline"
           className="w-full mb-4"
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
               className="mt-1"
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
               className="mt-1"
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
               className="mt-1"
             />
           </div>
           <Button type="submit" className="w-full" disabled={loading}>
             {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
             Create Account
           </Button>
         </form>
 
         <p className="text-center text-sm text-muted-foreground mt-6">
           Already have an account?{' '}
           <Link to="/login" className="text-primary hover:underline font-medium">
             Sign in
           </Link>
         </p>
 
         <p className="text-center text-xs text-muted-foreground mt-8 px-4">
           By signing up, you acknowledge this is an organizational tool, not a medical record system. 
           Do not store patient identifiers.
         </p>
       </div>
     </div>
   );
 }