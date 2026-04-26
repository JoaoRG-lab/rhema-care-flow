import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useMemedPrescription, type MemedPatient } from '@/hooks/useMemedPrescription';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MemedPrescriptionPanelProps {
  /** Código de identificação do paciente (patient_code — nunca nome real). */
  patientCode?: string;
  patientCardId?: string;
  collapsed?: boolean;
}

export function MemedPrescriptionPanel({
  patientCode,
  patientCardId,
  collapsed,
}: MemedPrescriptionPanelProps) {
  const { user } = useAuth();
  const {
    ready,
    loading,
    error,
    tokenAuto,
    setPatient,
    showPrescription,
    setDoctorTokenManual,
  } = useMemedPrescription();

  const [crm, setCrm] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [patientConfigured, setPatientConfigured] = useState(false);

  // Busca CRM do perfil
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('crm')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data && (data as { crm?: string }).crm) {
          setCrm((data as { crm?: string }).crm ?? '');
        }
      });
  }, [user]);

  // Quando o módulo estiver pronto e o token automático disponível, configura o paciente
  useEffect(() => {
    if (ready && tokenAuto && patientCode && !patientConfigured) {
      const patient: MemedPatient = {
        nome: patientCode,
        idExterno: patientCardId,
      };
      setPatient(patient);
      setPatientConfigured(true);
    }
  }, [ready, tokenAuto, patientCode, patientCardId, patientConfigured, setPatient]);

  const handleConfirmManualToken = () => {
    if (!manualToken.trim()) {
      toast.error('Insira o token Memed');
      return;
    }
    setDoctorTokenManual(manualToken.trim());
    if (patientCode) {
      setPatient({ nome: patientCode, idExterno: patientCardId });
      setPatientConfigured(true);
    }
    setShowManualInput(false);
    toast.success('Token Memed configurado');
  };

  const handleOpenMemed = () => {
    if (!ready) {
      toast.warning('Módulo Memed ainda carregando…');
      return;
    }
    if (!tokenAuto) {
      setShowManualInput(true);
      return;
    }
    showPrescription();
  };

  // ── Modo colapsado ────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <button
        onClick={handleOpenMemed}
        className="w-full flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors text-xs text-muted-foreground"
        title="Prescrição Digital — Memed"
      >
        <FileText className="h-5 w-5 text-blue-500" />
        <span>Memed</span>
      </button>
    );
  }

  // ── Modo expandido ─────────────────────────────────────────────────────────
  return (
    <Card className="border-blue-200 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          Prescrição Digital — Memed
          <Badge
            variant="outline"
            className="ml-auto text-xs border-blue-300 text-blue-700 dark:text-blue-300"
          >
            <ShieldCheck className="h-3 w-3 mr-1" />
            A1 / A3
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Carregando SDK */}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Conectando ao Memed…
          </div>
        )}

        {/* Erro ao carregar */}
        {!loading && error && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}

        {/* SDK carregado */}
        {!loading && ready && (
          <>
            {/* Status */}
            <div className="flex items-center gap-2 text-xs">
              {tokenAuto ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-green-700 dark:text-green-400">
                    Memed ativo
                    {crm && (
                      <span className="text-muted-foreground ml-1">· CRM {crm}</span>
                    )}
                  </span>
                  <Sparkles className="h-3 w-3 text-blue-400 ml-auto" />
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-amber-700 dark:text-amber-400">
                    Token Memed necessário
                  </span>
                </>
              )}
            </div>

            {/* Paciente configurado */}
            {patientCode && tokenAuto && (
              <div className="text-xs text-muted-foreground bg-white dark:bg-muted/30 rounded p-2 border">
                Paciente: <strong>{patientCode}</strong>
              </div>
            )}

            {/* Fallback — input manual de token */}
            {showManualInput && !tokenAuto && (
              <div className="space-y-2 p-3 bg-white dark:bg-muted/30 rounded-lg border">
                <p className="text-xs text-muted-foreground">
                  Seu perfil ainda não tem CRM cadastrado. Insira seu{' '}
                  <strong>token de médico Memed</strong> manualmente — obtenha em{' '}
                  <a
                    href="https://memed.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600"
                  >
                    memed.com.br
                  </a>
                  .
                </p>
                <div className="space-y-1">
                  <Label htmlFor="memed-token-manual" className="text-xs">
                    Token Memed
                  </Label>
                  <Input
                    id="memed-token-manual"
                    placeholder="Cole seu token aqui…"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    type="password"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-xs"
                    onClick={handleConfirmManualToken}
                  >
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => setShowManualInput(false)}
                  >
                    Cancelar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/40 rounded p-2">
                  <ShieldCheck className="h-3 w-3 inline mr-1 text-blue-500" />
                  Adicione seu CRM no perfil para autenticação automática futura.
                </p>
              </div>
            )}

            {/* Botão principal */}
            <Button
              size="sm"
              className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleOpenMemed}
              disabled={loading}
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              {tokenAuto ? 'Abrir Prescrição Memed' : 'Configurar Memed'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
