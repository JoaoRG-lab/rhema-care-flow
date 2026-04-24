import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import { Settings as SettingsIcon, Shield, BadgeCheck, FileText, Globe, Stethoscope } from 'lucide-react';
import { VerifiedBadge, VerificationStatusBadge } from '@/components/ui/VerifiedBadge';
import { LanguageSelector } from '@/components/ui/language-selector';
import { SpecialtyQuickSwitcher } from '@/components/layout/SpecialtyQuickSwitcher';

export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { status: verificationStatusValue, tier, loading } = useVerificationStatus();

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <SettingsIcon className="h-6 w-6 text-primary" />
          {t('settings.title')}
        </h1>
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">{t('settings.profile')}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">Email: {user?.email}</p>
                {tier && <VerifiedBadge tier={tier} size="sm" />}
              </div>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {t('settings.language')}
              </CardTitle>
              <CardDescription>
                Select your preferred language for the interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LanguageSelector variant="full" />
            </CardContent>
          </Card>

          {/* Specialty Switcher */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Specialty
              </CardTitle>
              <CardDescription>
                Switch instantly between your active medical specialty workspaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SpecialtyQuickSwitcher />
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
              {verificationStatusValue ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <VerificationStatusBadge status={verificationStatusValue} />
                  </div>
                  {tier && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Tier:</span>
                      <VerifiedBadge tier={tier} />
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
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t('settings.security')}
              </CardTitle>
            </CardHeader>
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