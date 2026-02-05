 import { useState } from 'react';
 import { Link, useNavigate } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { useAuth } from '@/contexts/AuthContext';
 import { Stethoscope, Loader2 } from 'lucide-react';
 import { toast } from 'sonner';
 
 export default function Signup() {
   const [fullName, setFullName] = useState('');
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [loading, setLoading] = useState(false);
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
             {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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