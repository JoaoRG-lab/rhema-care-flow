 import { useEffect, useState } from "react";
 import { useNavigate, useSearchParams } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
import { Loader2, Stethoscope } from "lucide-react";
 
 export default function AuthCallback() {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const [error, setError] = useState<string | null>(null);
 
   useEffect(() => {
     const handleCallback = async () => {
       try {
         const { data: { session }, error: sessionError } = await supabase.auth.getSession();
         
         if (sessionError) {
           throw sessionError;
         }

         const redirectTo = searchParams.get('redirect') || '/dashboard';

         if (session) {
           navigate(redirectTo, { replace: true });
         } else {
           navigate("/login", { replace: true });
         }
       } catch (err) {
         console.error("Auth callback error:", err);
         setError(err instanceof Error ? err.message : "Authentication failed");
         // Redirect to login after showing error briefly
         setTimeout(() => navigate("/login", { replace: true }), 2000);
       }
     };
 
     handleCallback();
   }, [navigate]);
 
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