 import { Link } from 'react-router-dom';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Progress } from '@/components/ui/progress';
 import {
   BadgeCheck,
   ShieldCheck,
   Users,
   Calculator,
   Lock,
   ArrowRight,
   Sparkles,
   X,
 } from 'lucide-react';
 import { useState } from 'react';
 
 interface VerificationPromptProps {
   status: 'pending' | 'under_review' | 'approved' | 'rejected' | null;
 }
 
 const BENEFITS = [
   { icon: Calculator, label: 'Full calculator access' },
   { icon: Users, label: 'Patient management' },
   { icon: ShieldCheck, label: 'Verified badge' },
   { icon: Sparkles, label: 'Priority support' },
 ];
 
 export function VerificationPrompt({ status }: VerificationPromptProps) {
   const [dismissed, setDismissed] = useState(false);
 
   // Don't show if already approved or dismissed
   if (status === 'approved' || dismissed) {
     return null;
   }
 
   // Show different content based on status
   if (status === 'pending' || status === 'under_review') {
     return (
       <Card className="border-warning/50 bg-warning/5">
         <CardContent className="py-4">
           <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                 <BadgeCheck className="h-5 w-5 text-warning" />
               </div>
               <div>
                 <p className="font-medium text-foreground">
                   {status === 'pending' ? 'Verification Pending' : 'Under Review'}
                 </p>
                 <p className="text-sm text-muted-foreground">
                   {status === 'pending' 
                     ? 'Your application is in the queue. We\'ll review it soon.'
                     : 'Our team is reviewing your credentials. You\'ll be notified once complete.'}
                 </p>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <Progress value={status === 'pending' ? 33 : 66} className="w-24 h-2" />
               <span className="text-xs text-muted-foreground whitespace-nowrap">
                 {status === 'pending' ? 'Step 1/3' : 'Step 2/3'}
               </span>
             </div>
           </div>
         </CardContent>
       </Card>
     );
   }
 
   if (status === 'rejected') {
     return (
       <Card className="border-destructive/50 bg-destructive/5">
         <CardContent className="py-4">
           <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                 <X className="h-5 w-5 text-destructive" />
               </div>
               <div>
                 <p className="font-medium text-foreground">Verification Not Approved</p>
                 <p className="text-sm text-muted-foreground">
                   Your previous application wasn't approved. You can submit a new request with updated information.
                 </p>
               </div>
             </div>
             <Link to="/verification-request">
               <Button variant="outline" size="sm">
                 Reapply
               </Button>
             </Link>
           </div>
         </CardContent>
       </Card>
     );
   }
 
   // Not started - show full prompt
   return (
     <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 overflow-hidden">
       <CardContent className="py-0">
         <div className="flex flex-col md:flex-row md:items-center gap-6 py-6">
           {/* Left: Icon and Message */}
           <div className="flex items-start gap-4 flex-1">
             <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
               <Lock className="h-6 w-6 text-primary" />
             </div>
             <div className="space-y-1">
               <h3 className="font-semibold text-lg text-foreground">
                 Complete Your Verification
               </h3>
               <p className="text-sm text-muted-foreground max-w-md">
                 Verify your credentials to unlock all features and join our community of verified healthcare professionals.
               </p>
             </div>
           </div>
 
           {/* Center: Benefits */}
           <div className="flex flex-wrap gap-3 md:gap-4">
             {BENEFITS.map((benefit) => {
               const Icon = benefit.icon;
               return (
                 <div
                   key={benefit.label}
                   className="flex items-center gap-2 text-sm text-muted-foreground"
                 >
                   <Icon className="h-4 w-4 text-primary" />
                   <span>{benefit.label}</span>
                 </div>
               );
             })}
           </div>
 
           {/* Right: CTA */}
           <div className="flex items-center gap-2 shrink-0">
             <Link to="/verification-request">
               <Button className="gap-2">
                 <BadgeCheck className="h-4 w-4" />
                 Get Verified
                 <ArrowRight className="h-4 w-4" />
               </Button>
             </Link>
             <Button
               variant="ghost"
               size="icon"
               className="text-muted-foreground hover:text-foreground"
               onClick={() => setDismissed(true)}
             >
               <X className="h-4 w-4" />
             </Button>
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }