 import { useEffect, useState } from 'react';
 import { Link } from 'react-router-dom';
 import { AppLayout } from '@/components/layout/AppLayout';
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { useAuth } from '@/contexts/AuthContext';
 import { supabase } from '@/integrations/supabase/client';
 import { Settings as SettingsIcon, Shield, BadgeCheck, ExternalLink, FileText } from 'lucide-react';
 import { VerifiedBadge, VerificationStatusBadge } from '@/components/ui/VerifiedBadge';
 import type { VerificationTier } from '@/components/ui/VerifiedBadge';
 
 export default function Settings() {
   const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<{
    status: 'pending' | 'under_review' | 'approved' | 'rejected' | null;
    tier: VerificationTier;
  }>({ status: null, tier: null });

  useEffect(() => {
    const fetchVerificationStatus = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('verification_requests')
        .select('status, tier')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setVerificationStatus({
          status: data.status as any,
          tier: data.tier as VerificationTier,
        });
      }
    };
    
    fetchVerificationStatus();
  }, [user]);
 
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

          {/* Verification Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BadgeCheck className="h-4 w-4" />
                Contributor Verification
              </CardTitle>
              <CardDescription>
                Become a verified contributor to add clinical insights and review scores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {verificationStatus.status ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <VerificationStatusBadge status={verificationStatus.status} />
                  </div>
                  {verificationStatus.tier && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Tier:</span>
                      <VerifiedBadge tier={verificationStatus.tier} />
                    </div>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/verification-request">
                      View Request Details
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You haven't submitted a verification request yet. Verified contributors can:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Add clinical insights and recommendations</li>
                    <li>Review and validate disease activity scores</li>
                    <li>Edit clinical guidelines and protocols</li>
                  </ul>
                  <div className="flex gap-2 pt-2">
                    <Button asChild>
                      <Link to="/verification-request">
                        <BadgeCheck className="h-4 w-4 mr-2" />
                        Apply for Verification
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a href="/docs/VERIFICATION.md" target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
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