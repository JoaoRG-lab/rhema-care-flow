/**
 * PrescriptionComposer
 * Full-featured prescription editor.
 * – Dynamic drug items (add/remove)
 * – CID-10 field, notes, and draft/sign flow
 */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus, Trash2, ClipboardPlus, Save, PenLine, ChevronDown, ChevronUp, FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PrescriptionItem } from '@/hooks/usePrescriptions';

// ── Common drug suggestions ───────────────────────────────────────────────────
const DRUG_SUGGESTIONS = [
  'Metotrexato', 'Prednisona', 'Hidroxicloroquina', 'Sulfassalazina', 'Leflunomida',
  'Adalimumabe', 'Etanercepte', 'Rituximabe', 'Tocilizumabe', 'Baricitinibe',
  'Ibuprofeno', 'Naproxeno', 'Celecoxibe', 'Dipirona', 'Paracetamol',
  'Amoxicilina', 'Azitromicina', 'Omeprazol', 'Pantoprazol', 'Ácido Fólico',
];

const ROUTE_OPTIONS = ['Oral', 'IV', 'IM', 'SC', 'Tópico', 'Inalatório', 'Sublingual'];
const FREQ_OPTIONS  = ['1x ao dia', '2x ao dia', '3x ao dia', '4x ao dia', 'Em dias alternados', '1x por semana', 'Dose única'];
const DUR_OPTIONS   = ['7 dias', '14 dias', '30 dias', '60 dias', '90 dias', 'Uso contínuo', 'Conforme necessário'];

/**
 * Internal row representation. Each row carries a stable client-side `_id`
 * so React can track it across add/remove without leaking child state
 * (collapse flag, suggestion popover, focus) into the wrong row — that was
 * the root cause of fields appearing to revert or duplicate after edits.
 */
type RowItem = PrescriptionItem & { _id: string };

const newId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `row_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const emptyItem = (): RowItem => ({
  _id: newId(),
  drug: '', dose: '', route: 'Oral', frequency: '1x ao dia', duration: '30 dias', instructions: '',
});


interface PrescriptionComposerProps {
  patientCode: string;
  onSaveDraft: (items: PrescriptionItem[], notes: string, cid10: string) => Promise<void>;
  onSaveAndSign: (items: PrescriptionItem[], notes: string, cid10: string) => Promise<void>;
  saving?: boolean;
}

function ItemRow({
  item, index, onChange, onRemove, isOnly,
}: {
  item: PrescriptionItem; index: number;
  onChange: (field: keyof PrescriptionItem, value: string) => void;
  onRemove: () => void; isOnly: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showSugg, setShowSugg] = useState(false);
  const filtered = DRUG_SUGGESTIONS.filter(d =>
    item.drug && d.toLowerCase().includes(item.drug.toLowerCase()) && d !== item.drug,
  );

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Item header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {index + 1}
          </div>
          <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
            {item.drug || <span className="text-muted-foreground italic">Medicamento {index + 1}</span>}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(v => !v)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {!isOnly && (
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {/* Drug name */}
          <div className="relative">
            <Label className="text-xs">Medicamento *</Label>
            <Input
              value={item.drug}
              onChange={e => { onChange('drug', e.target.value); setShowSugg(true); }}
              onBlur={() => setTimeout(() => setShowSugg(false), 150)}
              onFocus={() => setShowSugg(true)}
              placeholder="Nome do medicamento ou princípio ativo"
              className="mt-1"
            />
            {showSugg && filtered.length > 0 && (
              <div className="absolute z-20 top-full mt-1 left-0 right-0 rounded-lg border bg-popover shadow-md max-h-36 overflow-y-auto">
                {filtered.slice(0, 6).map(d => (
                  <button key={d} className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                    onMouseDown={() => { onChange('drug', d); setShowSugg(false); }}>
                    <FlaskConical className="inline h-3 w-3 mr-2 text-primary" />{d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dose + Route */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Dose</Label>
              <Input value={item.dose} onChange={e => onChange('dose', e.target.value)} placeholder="ex: 7,5 mg" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Via</Label>
              <select value={item.route} onChange={e => onChange('route', e.target.value)}
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                {ROUTE_OPTIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Frequency + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Frequência</Label>
              <select value={item.frequency} onChange={e => onChange('frequency', e.target.value)}
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                {FREQ_OPTIONS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Duração</Label>
              <select value={item.duration} onChange={e => onChange('duration', e.target.value)}
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                {DUR_OPTIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <Label className="text-xs">Instruções especiais</Label>
            <Input value={item.instructions} onChange={e => onChange('instructions', e.target.value)}
              placeholder="ex: tomar em jejum, após as refeições…" className="mt-1" />
          </div>
        </div>
      )}
    </div>
  );
}

export function PrescriptionComposer({
  patientCode, onSaveDraft, onSaveAndSign, saving = false,
}: PrescriptionComposerProps) {
  const [items, setItems] = useState<PrescriptionItem[]>([emptyItem()]);
  const [cid10, setCid10] = useState('');
  const [notes, setNotes] = useState('');

  const addItem = () => setItems(v => [...v, emptyItem()]);
  const removeItem = (i: number) => setItems(v => v.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof PrescriptionItem, value: string) =>
    setItems(v => v.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const hasItems = items.some(it => it.drug.trim());

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardPlus className="h-5 w-5 text-primary" />
          Nova Prescrição — {patientCode}
        </CardTitle>
        <CardDescription>
          Adicione os medicamentos, defina posologia e assine digitalmente ao finalizar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* CID-10 */}
        <div>
          <Label className="text-xs font-medium">CID-10 (diagnóstico)</Label>
          <Input value={cid10} onChange={e => setCid10(e.target.value.toUpperCase())}
            placeholder="ex: M05.3 – Artrite Reumatoide" className="mt-1" maxLength={10} />
        </div>

        <Separator />

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Medicamentos</Label>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Adicionar item
            </Button>
          </div>
          <ScrollArea className="max-h-[420px] pr-1">
            <div className="space-y-3">
              {items.map((item, i) => (
                <ItemRow
                  key={i} item={item} index={i}
                  onChange={(f, v) => updateItem(i, f, v)}
                  onRemove={() => removeItem(i)}
                  isOnly={items.length === 1}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Notes */}
        <div>
          <Label className="text-xs font-medium">Observações gerais</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Retorno em 30 dias, evitar exposição solar, monitorar hemograma…"
            className="mt-1 min-h-[72px] resize-none" />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button
            type="button" variant="outline" className="gap-2 flex-1"
            disabled={!hasItems || saving}
            onClick={() => onSaveDraft(items, notes, cid10)}
          >
            <Save className="h-4 w-4" />
            Salvar Rascunho
          </Button>
          <Button
            type="button" className="gap-2 flex-1 bg-gradient-to-r from-primary to-teal-500 hover:opacity-90"
            disabled={!hasItems || saving}
            onClick={() => onSaveAndSign(items, notes, cid10)}
          >
            <PenLine className="h-4 w-4" />
            Salvar e Assinar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
