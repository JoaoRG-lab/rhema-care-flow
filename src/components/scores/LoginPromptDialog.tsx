 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { LogIn, UserPlus } from 'lucide-react';
 
 interface LoginPromptDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onLogin: () => void;
   onSignup: () => void;
 }
 
 export function LoginPromptDialog({
   open,
   onOpenChange,
   onLogin,
   onSignup,
 }: LoginPromptDialogProps) {
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle>Sign in to save scores</DialogTitle>
           <DialogDescription>
             Create a free account to save your calculations and track disease activity over time.
           </DialogDescription>
         </DialogHeader>
         <DialogFooter className="flex-col sm:flex-row gap-2">
           <Button variant="outline" onClick={onLogin} className="gap-2">
             <LogIn className="h-4 w-4" />
             Log In
           </Button>
           <Button onClick={onSignup} className="gap-2">
             <UserPlus className="h-4 w-4" />
             Sign Up Free
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }