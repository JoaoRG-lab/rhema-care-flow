import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import { Settings as SettingsIcon, Shield, BadgeCheck, FileText, Globe, Stethoscope, Coins, ChevronRight, Users, HeartPulse } from 'lucide-react';
import { useAccountType } from '@/contexts/AccountTypeContext';
import { toast } from 'sonner';
import { VerifiedBadge, VerificationStatusBadge } from '@/components/ui/VerifiedBadge';
import { LanguageSelector } from '@/components/ui/language-selector';
import { SpecialtyQuickSwitcher } from '@/components/layout/SpecialtyQuickSwitcher';

export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { status: verificationStatusValue, tier, loading } = useVerificationStatus();
  const { setAccountType, isClinician, isPatient } = useAccountType();

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

          {/* Credits & AI Balance */}
          <Card className="hover:border-primary/40 transition-colors">
            <Link to="/settings/credits" className="block">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Coins className="h-4 w-4 text-primary" />
                    Créditos & Saldo de IA
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Saldo do gateway de IA, limites do plano e status de cobrança
                  </CardDescription>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
            </Link>
          </Card>

          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {t('settings.language')}
              </CardTitle>
              <CardDescription>
                Selecione o idioma preferido para a interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LanguageSelector variant="full" />
            </CardContent>
          </Card>


          {/* Account Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Tipo de Conta
              </CardTitle>
              <CardDescription>Alterne entre perfil de Profissional de Saúde e Paciente.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={async () => { await setAccountType('clinician'); toast.success('Perfil: Profissional de Saúde'); }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${isClinician ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/30'}`}>
                  <Stethoscope className={`h-6 w-6 ${isClinician ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${isClinician ? 'text-primary' : 'text-muted-foreground'}`}>Profissional</span>
                  {isClinician && <span className="text-xs text-primary">Ativo</span>}
                </button>
                <button onClick={async () => { await setAccountType('patient'); toast.success('Perfil: Paciente'); }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${isPatient ? 'border-[hsl(335_65%_55%)] bg-[hsl(335_65%_55%)]/5' : 'border-border hover:bg-accent/30'}`}>
                  <HeartPulse className={`h-6 w-6 ${isPatient ? 'text-[hsl(335_65%_55%)]' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${isPatient ? 'text-[hsl(335_65%_55%)]' : 'text-muted-foreground'}`}>Paciente</span>
                  {isPatient && <span className="text-xs text-[hsl(335_65%_55%)]">Ativo</span>}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Specialty Switcher */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Especialidade
              </CardTitle>
              <CardDescription>
                Alterne instantaneamente entre seus espaços de trabalho de especialidade médica
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
                Verificação de Colaborador
              </CardTitle>
              <CardDescription>
                Torne-se um colaborador verificado para adicionar insights clínicos e revisar pontuações
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
                      <span className="text-sm text-muted-foreground">Nível:</span>
                      <VerifiedBadge tier={tier} />
                    </div>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/verification-request">
                      Ver Detalhes da Solicitação
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Você ainda não enviou uma solicitação de verificação. Colaboradores verificados podem:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Adicionar insights e recomendações clínicas</li>
                    <li>Revisar e validar pontuações de atividade de doença</li>
                    <li>Editar diretrizes e protocolos clínicos</li>
                  </ul>
                  <div className="flex gap-2 pt-2">
                    <Button asChild>
                      <Link to="/verification-request">
                        <BadgeCheck className="h-4 w-4 mr-2" />
                        Solicitar Verificação
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
                O RheumaFlow é uma ferramenta organizacional, não um sistema de prontuário médico. Não armazene identificadores de pacientes como nomes, CPF, telefones ou endereços.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}