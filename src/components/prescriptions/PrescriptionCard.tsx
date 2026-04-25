/**
 * PrescriptionCard
 * Displays a single prescription with status badge, items summary, and action buttons.
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PrescriptionSignDialog } from './PrescriptionSignDialog';
import { generatePrescriptionPdf } from '@/lib/prescriptionPdfExport';
import type { Prescription } from '@/hooks/usePrescriptions';
import {
  PenLine, Download, MoreVertical, XCircle, ShieldCheck,
  ChevronDown, ChevronUp, Pill, CheckCircle2, Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  draft:      { label: 'Rascunho',    variant: 'outline',     icon: Clock,         color: 'text-muted-foreground' },
  signed:     { label: 'Assinada',    variant: 'default',     icon: ShieldCheck,   color: 'text-primary' },
  dispensed:  { label: 'Dispensada',  variant: 'secondary',   icon: CheckCircle2,  color: 'text-green-600' },
  cancelled:  { label: 'Cancelada',   variant: 'destructive', icon: XCircle,       color: 'text-destructive' },
} as const;

interface PrescriptionCardProps {
  rx: Prescription;
  patientCode: string;
  onSign: (id: string, dataUrl: string, name: string, crm: string) => Promise<boolean>;
  onCancel: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function PrescriptionCard({ rx, patientCode, onSign, onCancel, onDelete }: PrescriptionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const cfg = STATUS_CONFIG[rx.status];
  const Icon = cfg.icon;

  return (
    <>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="p-0">
          {/* Header row */}
          <div className="flex items-start justify-between px-4 py-3 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10', cfg.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">
                    {rx.items?.[0]?.drug ?? 'Prescrição'}
                    {rx.items?.length > 1 && <span className="text-muted-foreground ml-1">+{rx.items.length - 1}</span>}
                  </span>
                  <Badge variant={cfg.variant as any} className="text-xs py-0 h-5">
                    {cfg.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(rx.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {rx.cid10 && <> · CID-10: {rx.cid10}</>}
                </p>
                {rx.status === 'signed' && rx.signed_by_name && (
                  <p className="text-xs text-primary mt-0.5">
                    Assinado por {rx.signed_by_name} ({rx.signed_by_crm})
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(v => !v)}>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {rx.status === 'draft' && (
                    <DropdownMenuItem onClick={() => setSignOpen(true)} className="gap-2">
                      <PenLine className="h-4 w-4" /> Assinar
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => generatePrescriptionPdf(rx, patientCode)} className="gap-2">
                    <Download className="h-4 w-4" /> Baixar PDF
                  </DropdownMenuItem>
                  {rx.status !== 'cancelled' && (
                    <DropdownMenuItem onClick={() => onCancel(rx.id)} className="gap-2 text-destructive focus:text-destructive">
                      <XCircle className="h-4 w-4" /> Cancelar
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onDelete(rx.id)} className="gap-2 text-destructive focus:text-destructive">
                    <XCircle className="h-4 w-4" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Expanded: items list */}
          {expanded && (
            <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-2">
              {(rx.items ?? []).map((item, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-0.5">
                    <Pill className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="font-medium">{item.drug}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {[item.dose, item.route, item.frequency, item.duration].filter(Boolean).join(' · ')}
                    </span>
                    {item.instructions && (
                      <p className="text-xs text-muted-foreground mt-0.5">↳ {item.instructions}</p>
                    )}
                  </div>
                </div>
              ))}
              {rx.notes && (
                <div className="border-t border-border pt-2 mt-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Obs:</span> {rx.notes}
                </div>
              )}
              {/* Quick sign button for drafts */}
              {rx.status === 'draft' && (
                <div className="pt-2">
                  <Button size="sm" className="gap-2 w-full" onClick={() => setSignOpen(true)}>
                    <PenLine className="h-3.5 w-3.5" /> Assinar esta prescrição
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <PrescriptionSignDialog
        open={signOpen}
        onOpenChange={setSignOpen}
        prescriptionId={rx.id}
        onSign={async (dataUrl, name, crm) => onSign(rx.id, dataUrl, name, crm)}
      />
    </>
  );
}
