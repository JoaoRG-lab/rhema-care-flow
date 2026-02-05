 import { useState, useEffect, useRef } from 'react';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Timer, Play, Pause, RotateCcw } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { toast } from 'sonner';
 
 export default function Focus() {
   const { user } = useAuth();
   const [minutes, setMinutes] = useState(25);
   const [seconds, setSeconds] = useState(0);
   const [isActive, setIsActive] = useState(false);
   const [totalMinutes, setTotalMinutes] = useState(25);
   const intervalRef = useRef<NodeJS.Timeout | null>(null);
 
   useEffect(() => {
     if (isActive) {
       intervalRef.current = setInterval(() => {
         if (seconds === 0) {
           if (minutes === 0) {
             setIsActive(false);
             saveSession();
             toast.success('Focus session complete!');
           } else {
             setMinutes(m => m - 1);
             setSeconds(59);
           }
         } else {
           setSeconds(s => s - 1);
         }
       }, 1000);
     }
     return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
   }, [isActive, minutes, seconds]);
 
   const saveSession = async () => {
     if (!user) return;
     await supabase.from('focus_sessions').insert({
       user_id: user.id,
       duration_minutes: totalMinutes,
     });
   };
 
   const reset = () => {
     setIsActive(false);
     setMinutes(totalMinutes);
     setSeconds(0);
   };
 
   const setDuration = (mins: number) => {
     setTotalMinutes(mins);
     setMinutes(mins);
     setSeconds(0);
     setIsActive(false);
   };
 
   return (
     <AppLayout>
       <div className="p-6 lg:p-8 flex items-center justify-center min-h-[80vh]">
         <Card className="w-full max-w-md">
           <CardHeader className="text-center">
             <CardTitle className="flex items-center justify-center gap-2">
               <Timer className="h-6 w-6 text-primary" />
               Focus Timer
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
             <div className="text-center">
               <p className="text-7xl font-mono font-bold text-foreground">
                 {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
               </p>
             </div>
             <div className="flex justify-center gap-2">
               {[15, 25, 45, 60].map((m) => (
                 <Button key={m} variant={totalMinutes === m ? 'default' : 'outline'} size="sm" onClick={() => setDuration(m)}>
                   {m}m
                 </Button>
               ))}
             </div>
             <div className="flex justify-center gap-4">
               <Button size="lg" onClick={() => setIsActive(!isActive)} className="gap-2">
                 {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                 {isActive ? 'Pause' : 'Start'}
               </Button>
               <Button size="lg" variant="outline" onClick={reset}>
                 <RotateCcw className="h-5 w-5" />
               </Button>
             </div>
           </CardContent>
         </Card>
       </div>
     </AppLayout>
   );
 }