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
  /**
   * Fires whenever the composer transitions between "clean" (matches the
   * pristine empty state) and "dirty" (has user-typed values). The host
   * uses this to gate the close action with an unsaved-changes prompt.
   */
  onDirtyChange?: (dirty: boolean) => void;
}

/** True when the user has typed anything that would be lost on close. */
function isComposerDirty(items: RowItem[], cid10: string, notes: string) {
  if (cid10.trim() || notes.trim()) return true;
  return items.some(it =>
    it.drug.trim() || it.dose.trim() || it.instructions.trim(),
  );
}

type RowErrors = { drug?: string; dose?: string; frequency?: string };

function ItemRow({
  item, index, onChange, onRemove, isOnly, errors, showErrors,
}: {
  item: RowItem; index: number;
  onChange: (field: keyof PrescriptionItem, value: string) => void;
  onRemove: () => void; isOnly: boolean;
  errors: RowErrors; showErrors: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showSugg, setShowSugg] = useState(false);
  const filtered = DRUG_SUGGESTIONS.filter(d =>
    item.drug && d.toLowerCase().includes(item.drug.toLowerCase()) && d !== item.drug,
  );

  // Only surface field errors after the user has attempted to save at least
  // once (`showErrors`), so a freshly added empty row doesn't immediately
  // light up red.
  const err = showErrors ? errors : {};
  const hasAnyErr = !!(err.drug || err.dose || err.frequency);

  return (
    <div className={cn(
      'rounded-xl border bg-card transition-colors',
      hasAnyErr ? 'border-destructive/60' : 'border-border',
    )}>
      {/* Item header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
            hasAnyErr ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
          )}>
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
              aria-invalid={!!err.drug}
              className={cn('mt-1', err.drug && 'border-destructive focus-visible:ring-destructive')}
            />
            {err.drug && <p className="mt-1 text-xs text-destructive">{err.drug}</p>}
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
              <Label className="text-xs">Dose *</Label>
              <Input
                value={item.dose}
                onChange={e => onChange('dose', e.target.value)}
                placeholder="ex: 7,5 mg"
                aria-invalid={!!err.dose}
                className={cn('mt-1', err.dose && 'border-destructive focus-visible:ring-destructive')}
              />
              {err.dose && <p className="mt-1 text-xs text-destructive">{err.dose}</p>}
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
              <Label className="text-xs">Frequência *</Label>
              <select
                value={item.frequency}
                onChange={e => onChange('frequency', e.target.value)}
                aria-invalid={!!err.frequency}
                className={cn(
                  'mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring',
                  err.frequency ? 'border-destructive focus:ring-destructive' : 'border-input',
                )}>
                <option value="">Selecione…</option>
                {FREQ_OPTIONS.map(f => <option key={f}>{f}</option>)}
              </select>
              {err.frequency && <p className="mt-1 text-xs text-destructive">{err.frequency}</p>}
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

/** Strip the internal `_id` so callers receive the clean payload shape. */
const stripId = (rows: RowItem[]): PrescriptionItem[] =>
  rows.map(({ _id, ...rest }) => rest);


// Per-row validation rules. Drug, dose and frequency are mandatory because
// without them a prescription cannot be safely dispensed. Returns a map of
// row `_id` → { field: message }.
function validateItems(items: RowItem[]): Record<string, RowErrors> {
  const out: Record<string, RowErrors> = {};
  items.forEach((it) => {
    const e: RowErrors = {};
    if (!it.drug.trim())      e.drug = 'Informe o medicamento.';
    if (!it.dose.trim())      e.dose = 'Informe a dose.';
    if (!it.frequency.trim()) e.frequency = 'Selecione a frequência.';
    if (e.drug || e.dose || e.frequency) out[it._id] = e;
  });
  return out;
}


// ── Autosave (localStorage) ──────────────────────────────────────────────────
// Persist the composer's working state per patient so meds, dose, frequency,
// CID-10 and notes survive accidental dialog closes, refreshes, or tab
// switches. Cleared on successful save/sign.
const AUTOSAVE_PREFIX = 'rx-composer-draft:';
const AUTOSAVE_VERSION = 1;
const autosaveKey = (patientCode: string) => `${AUTOSAVE_PREFIX}${patientCode}`;

type AutosavePayload = {
  v: number;
  items: RowItem[];
  cid10: string;
  notes: string;
  savedAt: number;
};

function readAutosave(patientCode: string): AutosavePayload | null {
  try {
    const raw = localStorage.getItem(autosaveKey(patientCode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AutosavePayload;
    if (parsed?.v !== AUTOSAVE_VERSION || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeAutosave(patientCode: string, payload: Omit<AutosavePayload, 'v' | 'savedAt'>) {
  try {
    localStorage.setItem(
      autosaveKey(patientCode),
      JSON.stringify({ v: AUTOSAVE_VERSION, savedAt: Date.now(), ...payload }),
    );
  } catch {
    /* quota / private mode — silently ignore */
  }
}

function clearAutosave(patientCode: string) {
  try { localStorage.removeItem(autosaveKey(patientCode)); } catch { /* noop */ }
}


export function PrescriptionComposer({
  patientCode, onSaveDraft, onSaveAndSign, saving = false, onDirtyChange,
}: PrescriptionComposerProps) {
  // Restore any in-progress draft for this patient on first render so users
  // never lose typed meds/frequencies when the dialog is reopened.
  const [items, setItems] = useState<RowItem[]>(() => {
    const restored = readAutosave(patientCode);
    return restored && restored.items.length > 0 ? restored.items : [emptyItem()];
  });
  const [cid10, setCid10] = useState(() => readAutosave(patientCode)?.cid10 ?? '');
  const [notes, setNotes] = useState(() => readAutosave(patientCode)?.notes ?? '');
  const [restoredAt] = useState<number | null>(() => readAutosave(patientCode)?.savedAt ?? null);
  // Errors are only displayed after the first save attempt so users aren't
  // confronted with red fields on a brand-new empty form.
  const [showErrors, setShowErrors] = useState(false);

  // Notify the host every time the dirty state flips, so it can decide
  // whether to show an unsaved-changes confirmation on close.
  const dirty = isComposerDirty(items, cid10, notes);
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  // Debounced autosave: writes the working draft whenever the user edits
  // anything. Empty/pristine forms clear the slot to avoid stale leftovers.
  useEffect(() => {
    const t = setTimeout(() => {
      if (dirty) {
        writeAutosave(patientCode, { items, cid10, notes });
      } else {
        clearAutosave(patientCode);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [items, cid10, notes, dirty, patientCode]);

  const resetForm = () => {
    setItems([emptyItem()]);
    setCid10('');
    setNotes('');
    setShowErrors(false);
    clearAutosave(patientCode);
  };

  const addItem = () => setItems(v => [...v, emptyItem()]);

  const removeItem = (id: string) =>
    setItems(v => v.filter(item => item._id !== id));

  const updateItem = (id: string, field: keyof PrescriptionItem, value: string) =>
    setItems(v => v.map(item => item._id === id ? { ...item, [field]: value } : item));

  const errorsByRow = validateItems(items);
  const errorCount = Object.keys(errorsByRow).length;
  const isValid = errorCount === 0;

  const handleSaveDraft = async () => {
    if (!isValid) { setShowErrors(true); return; }
    const payload = stripId(items);
    await onSaveDraft(payload, notes, cid10);
    resetForm();
  };

  const handleSaveAndSign = async () => {
    if (!isValid) { setShowErrors(true); return; }
    const payload = stripId(items);
    await onSaveAndSign(payload, notes, cid10);
    resetForm();
  };

  const discardDraft = () => {
    clearAutosave(patientCode);
    setItems([emptyItem()]);
    setCid10('');
    setNotes('');
    setShowErrors(false);
  };

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
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1.5" disabled={saving}>
              <Plus className="h-3.5 w-3.5" /> Adicionar item
            </Button>
          </div>
          <ScrollArea className="max-h-[420px] pr-1">
            <div className="space-y-3">
              {items.map((item, i) => (
                <ItemRow
                  key={item._id}
                  item={item}
                  index={i}
                  onChange={(f, v) => updateItem(item._id, f, v)}
                  onRemove={() => removeItem(item._id)}
                  isOnly={items.length === 1}
                  errors={errorsByRow[item._id] ?? {}}
                  showErrors={showErrors}
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

        {/* Form-level error summary, visible only after a save attempt. */}
        {showErrors && !isValid && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            Verifique {errorCount === 1 ? 'o medicamento destacado' : `os ${errorCount} medicamentos destacados`}: medicamento, dose e frequência são obrigatórios.
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button
            type="button" variant="outline" className="gap-2 flex-1"
            disabled={saving}
            onClick={handleSaveDraft}
          >
            <Save className="h-4 w-4" />
            Salvar Rascunho
          </Button>
          <Button
            type="button" className="gap-2 flex-1 bg-gradient-to-r from-primary to-teal-500 hover:opacity-90"
            disabled={saving}
            onClick={handleSaveAndSign}
          >
            <PenLine className="h-4 w-4" />
            Salvar e Assinar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

