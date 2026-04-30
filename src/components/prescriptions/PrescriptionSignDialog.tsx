/**
 * PrescriptionSignDialog
 * Modal for digitally signing a prescription.
 * Steps: 1) Identify (name + CRM + PIN) → 2) Draw signature → 3) Confirm
 */
import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignatureCanvas } from './SignatureCanvas';
import { PenLine, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { useVerificationStatus } from '@/hooks/useVerificationStatus';
import { cn } from '@/lib/utils';

interface PrescriptionSignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSign: (dataUrl: string, name: string, crm: string) => Promise<boolean>;
  prescriptionId: string;
}

type Step = 'identity' | 'signature' | 'done';

export function PrescriptionSignDialog({
  open, onOpenChange, onSign, prescriptionId,
}: PrescriptionSignDialogProps) {
  const { fullName } = useVerificationStatus();

  const [step, setStep] = useState<Step>('identity');
  const [name, setName] = useState(fullName ?? '');
  const [crm, setCrm] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setStep('identity');
    setName(fullName ?? '');
    setCrm('');
    setPin('');
    setPinConfirm('');
    setSignatureDataUrl(null);
    setError('');
    setSigning(false);
  };

  // Fully reset every local field whenever the dialog closes so a previous
  // session's name/CRM/PIN/signature/step/error/signing flag cannot leak
  // into the next prescription. We reset on close (rather than only on
  // open) so the UI also clears immediately as the closing animation runs,
  // and so a parent that keeps this component mounted across opens still
  // sees a clean slate on the next open.
  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    // On open: seed `name` from the verification profile once it resolves,
    // but only if the user hasn't already typed something this session.
    setName(prev => prev.trim() ? prev : (fullName ?? ''));
    // We deliberately key on `open` and `fullName` only; `prescriptionId`
    // change while open should NOT clobber an in-progress signature.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fullName]);


  const handleIdentityNext = () => {
    if (!name.trim()) { setError('Informe seu nome completo.'); return; }
    if (!crm.trim()) { setError('Informe seu CRM.'); return; }
    if (pin.length < 4) { setError('PIN deve ter pelo menos 4 dígitos.'); return; }
    if (pin !== pinConfirm) { setError('PINs não coincidem.'); return; }
    setError('');
    setStep('signature');
  };

  const handleConfirm = async () => {
    if (!signatureDataUrl) { setError('Assine o documento antes de confirmar.'); return; }
    setSigning(true);
    const ok = await onSign(signatureDataUrl, name.trim(), crm.trim());
    setSigning(false);
    if (ok) setStep('done');
    else setError('Falha ao assinar. Tente novamente.');
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-primary" />
            Assinar Prescrição
          </DialogTitle>
          <DialogDescription>
            Sua assinatura digital identifica e autentica esta prescrição.
          </DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 my-1">
          {(['identity', 'signature', 'done'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold shrink-0 transition-colors',
                step === s ? 'bg-primary text-primary-foreground'
                  : (['identity', 'signature', 'done'].indexOf(step) > i)
                    ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
              )}>
                {i + 1}
              </div>
              {i < 2 && <div className={cn('flex-1 h-0.5 rounded', step !== 'identity' && i === 0 ? 'bg-primary' : step === 'done' && i === 1 ? 'bg-primary' : 'bg-muted')} />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Identity ── */}
        {step === 'identity' && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome completo do responsável</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Dr. João da Silva" />
            </div>
            <div className="space-y-1.5">
              <Label>CRM</Label>
              <Input value={crm} onChange={e => setCrm(e.target.value)} placeholder="CRM/SP 123456" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>PIN de assinatura</Label>
                <Input
                  type="password" inputMode="numeric" maxLength={8}
                  value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Confirmar PIN</Label>
                <Input
                  type="password" inputMode="numeric" maxLength={8}
                  value={pinConfirm} onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              O PIN é usado localmente para confirmar a intenção de assinatura. Não é armazenado em texto puro.
            </p>
          </div>
        )}

        {/* ── Step 2: Signature ── */}
        {step === 'signature' && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Desenhe sua assinatura abaixo. Ela será incorporada ao PDF da prescrição.
            </p>
            <SignatureCanvas onCapture={setSignatureDataUrl} />
            {signatureDataUrl && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Assinatura capturada
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">Prescrição assinada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Assinado por {name} (CRM: {crm}). O hash SHA-256 foi registrado para verificação.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'identity' && (
            <>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleIdentityNext} className="gap-2">
                Próximo
              </Button>
            </>
          )}
          {step === 'signature' && (
            <>
              <Button variant="outline" onClick={() => { setStep('identity'); setError(''); }}>Voltar</Button>
              <Button onClick={handleConfirm} disabled={!signatureDataUrl || signing} className="gap-2">
                {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Assinar e Salvar
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={handleClose} className="w-full">Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
