 import { AppLayout } from '@/components/layout/AppLayout';
 import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
 import { useAuth } from '@/contexts/AuthContext';
 import { Settings as SettingsIcon, Shield } from 'lucide-react';
 
 export default function Settings() {
   const { user } = useAuth();
 
   return (
     <AppLayout>
       <div className="p-6 lg:p-8">
         <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
           <SettingsIcon className="h-6 w-6 text-primary" />
           Settings
         </h1>
         <div className="max-w-2xl space-y-6">
           <Card>
             <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
             <CardContent>
               <p className="text-sm text-muted-foreground">Email: {user?.email}</p>
             </CardContent>
           </Card>
           <Card>
             <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />Privacy Notice</CardTitle></CardHeader>
             <CardContent>
               <p className="text-sm text-muted-foreground">
                 RheumaFlow is an organizational tool, not a medical record system. Do not store patient identifiers such as names, CPF, phone numbers, or addresses.
               </p>
             </CardContent>
           </Card>
         </div>
       </div>
     </AppLayout>
   );
 }