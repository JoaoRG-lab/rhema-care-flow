 import { useState } from 'react';
 import { Link, useNavigate } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { useAuth } from '@/contexts/AuthContext';
 import { Stethoscope, Loader2 } from 'lucide-react';
 import { toast } from 'sonner';
 
 export default function Login() {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [loading, setLoading] = useState(false);
   const { signIn } = useAuth();
   const navigate = useNavigate();
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
 
     const { error } = await signIn(email, password);
 
     if (error) {
       toast.error(error.message);
       setLoading(false);
     } else {
       toast.success('Welcome back!');
       navigate('/dashboard');
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
           <h1 className="text-2xl font-bold">Welcome back</h1>
           <p className="text-muted-foreground mt-2">Sign in to your account</p>
         </div>
 
         <form onSubmit={handleSubmit} className="space-y-4">
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
               className="mt-1"
             />
           </div>
           <Button type="submit" className="w-full" disabled={loading}>
             {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
             Sign In
           </Button>
         </form>
 
         <p className="text-center text-sm text-muted-foreground mt-6">
           Don't have an account?{' '}
           <Link to="/signup" className="text-primary hover:underline font-medium">
             Sign up
           </Link>
         </p>
       </div>
     </div>
   );
 }