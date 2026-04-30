/**
 * PrescriptionList
 * Full prescription tab panel for PatientDetail.
 * Includes PrescriptionComposer + list of PrescriptionCards.
 */
import { useEffect, useState } from 'react';
import { PrescriptionComposer } from './PrescriptionComposer';
import { PrescriptionCard } from './PrescriptionCard';
import { PrescriptionSignDialog } from './PrescriptionSignDialog';
import { usePrescriptions } from '@/hooks/usePrescriptions';
import type { PrescriptionItem } from '@/hooks/usePrescriptions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ClipboardPlus, ChevronDown, ChevronUp, ClipboardList, ShieldAlert, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrescriptionListProps {
  patientId: string;
  patientCode: string;
}

export function PrescriptionList({ patientId, patientCode }: PrescriptionListProps) {
  const {
    prescriptions, loading,
    lastError, clearLastError,
    fetchPrescriptions,
    createPrescription,
    signPrescription,
    cancelPrescription,
    deletePrescription,
  } = usePrescriptions(patientId);

  const [composerOpen, setComposerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingSign, setPendingSign] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<{ rxId: string; message: string } | null>(null);

  useEffect(() => { fetchPrescriptions(); }, [fetchPrescriptions]);

  const handlePdfError = (rxId: string, message: string) => {
    setPdfError({ rxId, message });
  };

  const banner = pdfError
    ? { stage: 'pdf', message: pdfError.message, onDismiss: () => setPdfError(null) }
    : lastError
    ? { stage: lastError.stage, message: lastError.message, onDismiss: clearLastError }
    : null;

  // Save as draft. Only close the composer on a successful insert — otherwise
  // the user keeps their input and sees the toast error from the hook.
  const handleSaveDraft = async (items: PrescriptionItem[], notes: string, cid10: string) => {
    setSaving(true);
    try {
      const rx = await createPrescription({ patient_id: patientId, items, notes, cid10, status: 'draft' });
      if (rx) setComposerOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // Save + open sign dialog immediately on success.
  const handleSaveAndSign = async (items: PrescriptionItem[], notes: string, cid10: string) => {
    setSaving(true);
    try {
      const rx = await createPrescription({ patient_id: patientId, items, notes, cid10, status: 'draft' });
      if (rx) {
        setComposerOpen(false);
        setPendingSign(rx.id);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSign = async (id: string, dataUrl: string, name: string, crm: string) => {
    return signPrescription(id, dataUrl, { name, crm });
  };

  const draft    = prescriptions.filter(r => r.status === 'draft');
  const active   = prescriptions.filter(r => r.status === 'signed' || r.status === 'dispensed');
  const archived = prescriptions.filter(r => r.status === 'cancelled');

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <span className="font-semibold">Prescrições</span>
          {prescriptions.length > 0 && (
            <Badge variant="secondary" className="text-xs">{prescriptions.length}</Badge>
          )}
          {draft.length > 0 && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
              {draft.length} rascunho{draft.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <Button size="sm" onClick={() => setComposerOpen(v => !v)} className="gap-2">
          <ClipboardPlus className="h-4 w-4" />
          {composerOpen ? 'Fechar editor' : 'Nova prescrição'}
        </Button>
      </div>

      {/* Error banner — surfaces last hook error or PDF generation failure */}
      {banner && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-destructive">
              Falha em prescrição ({banner.stage})
            </p>
            <p className="text-destructive/90 break-words">{banner.message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Detalhes completos no console do navegador (filtre por <code>[Rx:</code>).
            </p>
          </div>
          <button
            onClick={banner.onDismiss}
            className="text-destructive/70 hover:text-destructive shrink-0"
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Composer */}
      {composerOpen && (
        <PrescriptionComposer
          patientCode={patientCode}
          onSaveDraft={handleSaveDraft}
          onSaveAndSign={handleSaveAndSign}
          saving={saving}
        />
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map(n => <Skeleton key={n} className="h-20 w-full rounded-xl" />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && prescriptions.length === 0 && !composerOpen && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="font-medium text-muted-foreground">Nenhuma prescrição</p>
            <p className="text-xs text-muted-foreground mt-1">Clique em "Nova prescrição" para começar.</p>
          </div>
        </div>
      )}

      {/* Draft prescriptions */}
      {!loading && draft.length > 0 && (
        <Section title="Rascunhos" icon={<ShieldAlert className="h-4 w-4 text-amber-500" />} defaultOpen count={draft.length}>
          {draft.map(rx => (
            <PrescriptionCard key={rx.id} rx={rx} patientCode={patientCode}
              onSign={handleSign} onCancel={cancelPrescription} onDelete={deletePrescription}
              onPdfError={handlePdfError} />
          ))}
        </Section>
      )}

      {/* Active prescriptions */}
      {!loading && active.length > 0 && (
        <Section title="Prescrições Assinadas" icon={<ClipboardList className="h-4 w-4 text-primary" />} defaultOpen count={active.length}>
          {active.map(rx => (
            <PrescriptionCard key={rx.id} rx={rx} patientCode={patientCode}
              onSign={handleSign} onCancel={cancelPrescription} onDelete={deletePrescription}
              onPdfError={handlePdfError} />
          ))}
        </Section>
      )}

      {/* Archived */}
      {!loading && archived.length > 0 && (
        <Section title="Canceladas" icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />} defaultOpen={false} count={archived.length}>
          {archived.map(rx => (
            <PrescriptionCard key={rx.id} rx={rx} patientCode={patientCode}
              onSign={handleSign} onCancel={cancelPrescription} onDelete={deletePrescription}
              onPdfError={handlePdfError} />
          ))}
        </Section>
      )}
      {pendingSign && (
        <PrescriptionSignDialog
          open={!!pendingSign}
          onOpenChange={v => { if (!v) setPendingSign(null); }}
          prescriptionId={pendingSign}
          onSign={async (dataUrl, name, crm) => {
            const ok = await signPrescription(pendingSign, dataUrl, { name, crm });
            if (ok) setPendingSign(null);
            return ok;
          }}
        />
      )}
    </div>
  );
}

// ── Section collapsible ───────────────────────────────────────────────────────
function Section({ title, icon, children, defaultOpen, count }: {
  title: string; icon: React.ReactNode;
  children: React.ReactNode; defaultOpen: boolean; count: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-2">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-foreground w-full text-left hover:opacity-80 transition-opacity">
        {icon}
        {title}
        <Badge variant="secondary" className="text-xs h-4 px-1.5">{count}</Badge>
        <span className="ml-auto">{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
}
