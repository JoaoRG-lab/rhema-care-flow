/**
 * PrescriptionDebugPanel
 * Troubleshooting panel that exposes the exact data being rendered for a
 * prescription: med tags, dose, frequency, route, duration, instructions,
 * notes, CID-10, signature metadata, and the full raw row as JSON.
 *
 * Also logs the *source* of the state (where the data came from — DB row
 * via `usePrescriptions`, composer in-memory draft, etc.) through the
 * structured rxLog channel so it shows up in the [Rx:*] console filter.
 *
 * Visibility: gated behind `?debug=1` query param OR
 * `localStorage.rxDebug === '1'`, so end-users never see it.
 */
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bug, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import type { Prescription } from '@/hooks/usePrescriptions';
import { rxLog } from '@/lib/prescriptionLogger';
import { toast } from 'sonner';

interface PrescriptionDebugPanelProps {
  rx: Prescription;
  /** Where this prescription state came from. Logged on mount + shown in UI. */
  source: 'db-row' | 'composer-draft' | 'unknown';
  /** Optional extra context (e.g. patientCode) merged into the log envelope. */
  context?: Record<string, unknown>;
}

export function isPrescriptionDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === '1') return true;
    return window.localStorage.getItem('rxDebug') === '1';
  } catch {
    return false;
  }
}

export function PrescriptionDebugPanel({ rx, source, context }: PrescriptionDebugPanelProps) {
  const [open, setOpen] = useState(false);

  // Log source + a compact fingerprint of the state on mount and whenever
  // the rx identity changes. Full raw payload is left out of the log to
  // keep the console readable; users can copy it via the panel button.
  useEffect(() => {
    rxLog.info('fetch:success', {
      debug: true,
      source,
      rxId: rx.id,
      status: rx.status,
      itemCount: Array.isArray(rx.items) ? rx.items.length : 0,
      cid10: rx.cid10 || null,
      signed: rx.status === 'signed',
      hasSignature: !!rx.signature_data_url,
      ...context,
    });
  }, [rx.id, rx.status, rx.updated_at, source, context]);

  const fingerprint = useMemo(
    () => ({
      id: rx.id,
      source,
      status: rx.status,
      updated_at: rx.updated_at,
      itemCount: Array.isArray(rx.items) ? rx.items.length : 0,
    }),
    [rx, source],
  );

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(rx, null, 2));
      toast.success('JSON da prescrição copiado');
    } catch {
      toast.error('Falha ao copiar JSON');
    }
  };

  return (
    <div className="border-t border-dashed border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20 px-4 py-2 text-xs">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-amber-700 dark:text-amber-300 font-mono"
      >
        <Bug className="h-3.5 w-3.5" />
        <span className="font-semibold">DEBUG</span>
        <span className="text-muted-foreground">
          source=<b>{source}</b> · status=<b>{rx.status}</b> · items=<b>{fingerprint.itemCount}</b>
        </span>
        <span className="ml-auto">
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3 font-mono">
          {/* Med tags */}
          <Section label="Medicamentos (tags)">
            {Array.isArray(rx.items) && rx.items.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {rx.items.map((it, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="border-amber-400/60 bg-background text-[11px] font-mono"
                    title={it.instructions || undefined}
                  >
                    #{i} {it.drug || '∅'}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-destructive">items vazio / null</span>
            )}
          </Section>

          {/* Per-item table */}
          <Section label="Detalhe por item">
            <div className="overflow-x-auto rounded border border-amber-400/40">
              <table className="w-full text-[11px]">
                <thead className="bg-amber-100/50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100">
                  <tr>
                    <Th>#</Th><Th>drug</Th><Th>dose</Th><Th>route</Th>
                    <Th>frequency</Th><Th>duration</Th><Th>instructions</Th>
                  </tr>
                </thead>
                <tbody>
                  {(rx.items ?? []).map((it, i) => (
                    <tr key={i} className="odd:bg-background/40">
                      <Td>{i}</Td>
                      <Td>{it.drug || <Empty />}</Td>
                      <Td>{it.dose || <Empty />}</Td>
                      <Td>{it.route || <Empty />}</Td>
                      <Td>{it.frequency || <Empty />}</Td>
                      <Td>{it.duration || <Empty />}</Td>
                      <Td className="max-w-[200px] truncate">{it.instructions || <Empty />}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Meta */}
          <Section label="Metadados">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              <Meta k="id" v={rx.id} />
              <Meta k="patient_id" v={rx.patient_id} />
              <Meta k="user_id" v={rx.user_id} />
              <Meta k="status" v={rx.status} />
              <Meta k="cid10" v={rx.cid10} />
              <Meta k="created_at" v={rx.created_at} />
              <Meta k="updated_at" v={rx.updated_at} />
              <Meta k="signed_at" v={rx.signed_at} />
              <Meta k="signed_by_name" v={rx.signed_by_name} />
              <Meta k="signed_by_crm" v={rx.signed_by_crm} />
              <Meta k="signature_hash" v={rx.signature_hash} truncate />
              <Meta k="has signature_data_url" v={rx.signature_data_url ? 'yes' : 'no'} />
            </dl>
            {rx.notes && (
              <p className="mt-2 text-muted-foreground">
                <span className="font-semibold">notes:</span> {rx.notes}
              </p>
            )}
          </Section>

          {/* Raw JSON */}
          <Section label="Raw row (JSON)">
            <pre className="overflow-x-auto rounded border border-amber-400/40 bg-background p-2 text-[10px] leading-relaxed max-h-60">
              {JSON.stringify(rx, null, 2)}
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 h-7 gap-1.5 text-[11px]"
              onClick={handleCopyJson}
            >
              <Copy className="h-3 w-3" /> Copiar JSON
            </Button>
          </Section>
        </div>
      )}
    </div>
  );
}

// ── small presentational helpers ────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-amber-700/80 dark:text-amber-300/80 mb-1">
        {label}
      </p>
      {children}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-2 py-1 font-semibold">{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-2 py-1 align-top ${className ?? ''}`}>{children}</td>;
}

function Empty() {
  return <span className="text-muted-foreground/60">∅</span>;
}

function Meta({ k, v, truncate }: { k: string; v: unknown; truncate?: boolean }) {
  const display =
    v === null || v === undefined || v === ''
      ? '∅'
      : typeof v === 'string'
      ? truncate && v.length > 20
        ? v.slice(0, 12) + '…' + v.slice(-6)
        : v
      : String(v);
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="truncate" title={typeof v === 'string' ? v : undefined}>
        {display}
      </dd>
    </>
  );
}
