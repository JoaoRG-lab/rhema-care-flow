import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useMemedPrescription, type MemedPatient } from '@/hooks/useMemedPrescription';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MemedPrescriptionPanelProps {
  /** De-identified patient label (patient_code). Never a real name. */
  patientCode?: string;
  patientCardId?: string;
  collapsed?: boolean;
}

export function MemedPrescriptionPanel({ patientCode, patientCardId, collapsed }: MemedPrescriptionPanelProps) {
  const { user } = useAuth();
  const { ready, loading, setDoctorToken, setPatient, showPrescription } = useMemedPrescription();
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenSet, setTokenSet] = useState(false);
  const [memedToken, setMemedToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [crm, setCrm] = useState('');

  // Busca CRM do profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('crm')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data && (data as { crm?: string }).crm) setCrm((data as { crm?: string }).crm ?? '');
      });
  }, [user]);

  const handleSetToken = async () => {
    if (!memedToken.trim()) {
      toast.error('Insira o token Memed fornecido pela sua conta de médico');
      return;
    }
    setTokenLoading(true);
    try {
      setDoctorToken(memedToken.trim());
      // Configura paciente se tiver dados
      if (patientCode) {
        const patient: MemedPatient = {
          nome: patientCode,
          idExterno: patientCardId,
        };
        setPatient(patient);
      }
      setTokenSet(true);
      setShowTokenInput(false);
      toast.success('Memed configurado — pode prescrever com assinatura A1/A3');
    } catch {
      toast.error('Erro ao configurar Memed');
    } finally {
      setTokenLoading(false);
    }
  };

  const handleOpenMemed = () => {
    if (!tokenSet) {
      setShowTokenInput(true);
      toast.info('Configure seu token Memed antes de prescrever');
      return;
    }
    showPrescription();
  };

  if (collapsed) {
    return (
      <button
        onClick={handleOpenMemed}
        className="w-full flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors text-xs text-muted-foreground"
        title="Abrir Memed — Prescrição Digital"
      >
        <FileText className="h-5 w-5 text-blue-500" />
        <span>Memed</span>
      </button>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          Prescrição Digital — Memed
          <Badge variant="outline" className="ml-auto text-xs border-blue-300 text-blue-700 dark:text-blue-300">
            <ShieldCheck className="h-3 w-3 mr-1" />
            A1 / A3
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status de carregamento do SDK */}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Carregando módulo Memed…
          </div>
        )}

        {!loading && ready && (
          <>
            {/* Status */}
            <div className="flex items-center gap-2 text-xs">
              {tokenSet ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-green-700 dark:text-green-400">Memed ativo — assinatura disponível</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-amber-700 dark:text-amber-400">Token Memed necessário</span>
                </>
              )}
            </div>

            {/* Formulário de token */}
            {showTokenInput && !tokenSet && (
              <div className="space-y-2 p-3 bg-white dark:bg-muted/30 rounded-lg border">
                <p className="text-xs text-muted-foreground">
                  Insira seu <strong>token de médico Memed</strong>. Obtenha em:{' '}
                  <a
                    href="https://memed.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600"
                  >
                    memed.com.br
                  </a>
                </p>
                {crm && (
                  <div className="text-xs text-muted-foreground">CRM detectado: <strong>{crm}</strong></div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="memed-token" className="text-xs">Token Memed</Label>
                  <Input
                    id="memed-token"
                    placeholder="Seu token de médico Memed…"
                    value={memedToken}
                    onChange={e => setMemedToken(e.target.value)}
                    type="password"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleSetToken} disabled={tokenLoading}>
                    {tokenLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Confirmar
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowTokenInput(false)}>
                    Cancelar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/40 rounded p-2">
                  <ShieldCheck className="h-3 w-3 inline mr-1 text-blue-500" />
                  Assinatura digital A1/A3 é gerenciada diretamente pelo módulo Memed. Certifique-se que seu certificado está instalado.
                </p>
              </div>
            )}

            {/* Paciente configurado */}
            {patientCode && tokenSet && (
              <div className="text-xs text-muted-foreground bg-white dark:bg-muted/30 rounded p-2 border">
                Paciente: <strong>{patientCode}</strong>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleOpenMemed}
                disabled={loading}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                {tokenSet ? 'Abrir Prescrição Memed' : 'Configurar Memed'}
              </Button>
            </div>
          </>
        )}

        {!loading && !ready && (
          <div className="text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5" />
            Falha ao carregar Memed SDK. Verifique sua conexão.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
