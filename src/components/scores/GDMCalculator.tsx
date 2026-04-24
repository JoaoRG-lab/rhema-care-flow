import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Save, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

// IADPSG criteria (adopted by FEBRASGO / ADA)
// TOTG 75g: jeium <92, 1h <180, 2h <153 mg/dL
// 1 altered = GDM diagnosis
const CUTOFFS = { fasting: 92, h1: 180, h2: 153 };

// 1st trimester screening (ADA): fasting ≥126 or HbA1c ≥6.5 = overt DM; fasting 92-125 = GDM
const RISK_FACTORS = [
  { key: 'bmi', label: 'IMC pré-gestacional ≥ 25 kg/m²' },
  { key: 'prev_gdm', label: 'DMG em gestação anterior' },
  { key: 'macrosomia', label: 'Filho anterior com peso > 4 kg' },
  { key: 'family', label: 'Familiar de 1° grau com DM2' },
  { key: 'pcos', label: 'SOP (Síndrome dos Ovários Policísticos)' },
  { key: 'age', label: 'Idade ≥ 35 anos' },
  { key: 'htn', label: 'Hipertensão arterial crônica' },
  { key: 'prev_loss', label: 'Perda fetal prévia inexplicada' },
];

export function GDMCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [tab, setTab] = useState<'totg' | 'risk'>('totg');
  const [fasting, setFasting] = useState('');
  const [h1, setH1] = useState('');
  const [h2, setH2] = useState('');
  const [hba1c, setHba1c] = useState('');
  const [risks, setRisks] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<{ diagnosis: string; color: string; detail: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (k: string) => setRisks(v => ({ ...v, [k]: !v[k] }));

  const calcTOTG = () => {
    const f = parseFloat(fasting), h1v = parseFloat(h1), h2v = parseFloat(h2);
    const hba = parseFloat(hba1c);
    if (isNaN(f) && isNaN(h1v) && isNaN(h2v)) { toast.error('Informe ao menos um valor da TOTG'); return; }

    // Overt DM in 1st trim
    if (!isNaN(f) && f >= 126) {
      setResult({ diagnosis: 'Diabetes Mellitus Pré-existente', color: 'text-destructive', detail: 'Glicemia de jejum ≥ 126 mg/dL — não é DMG, é DM pré-gestacional.' });
      return;
    }
    if (!isNaN(hba) && hba >= 6.5) {
      setResult({ diagnosis: 'Diabetes Mellitus Pré-existente', color: 'text-destructive', detail: 'HbA1c ≥ 6,5% — rastreio 1° trimestre positivo para DM pré-gestacional.' });
      return;
    }

    const altered: string[] = [];
    if (!isNaN(f) && f >= CUTOFFS.fasting) altered.push(`Jejum ${f} mg/dL (≥ ${CUTOFFS.fasting})`);
    if (!isNaN(h1v) && h1v >= CUTOFFS.h1) altered.push(`1h ${h1v} mg/dL (≥ ${CUTOFFS.h1})`);
    if (!isNaN(h2v) && h2v >= CUTOFFS.h2) altered.push(`2h ${h2v} mg/dL (≥ ${CUTOFFS.h2})`);

    if (altered.length >= 1) {
      setResult({
        diagnosis: 'Diabetes Mellitus Gestacional (DMG)',
        color: 'text-warning',
        detail: `Critério(s) alterado(s): ${altered.join(' · ')}. Iniciar dieta + monitorização glicêmica. Se inadequado em 2 semanas → insulinoterapia.`,
      });
    } else {
      setResult({ diagnosis: 'TOTG Normal — Sem DMG', color: 'text-success', detail: 'Todos os valores dentro dos critérios IADPSG/FEBRASGO. Repetir rastreio se surgirem fatores de risco.' });
    }
  };

  const calcRisk = () => {
    const count = Object.values(risks).filter(Boolean).length;
    if (count === 0) { toast.error('Selecione ao menos um fator de risco'); return; }
    const high = count >= 2 || risks['prev_gdm'] || risks['bmi'];
    setResult({
      diagnosis: high ? 'Alto Risco — TOTG precoce indicada (1° trimestre)' : 'Risco Moderado — TOTG entre 24–28 semanas',
      color: high ? 'text-warning' : 'text-primary',
      detail: high
        ? `${count} fator(es) de risco. Solicitar glicemia de jejum + HbA1c no 1° trimestre. Se normais, repetir TOTG 75g entre 24–28s.`
        : `${count} fator(es) de risco. Solicitar TOTG 75g entre 24 e 28 semanas conforme protocolo padrão.`,
    });
  };

  const performSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      await supabase.from('score_entries').insert({
        user_id: user.id, score_type: 'GDM',
        data_json: { fasting, h1, h2, hba1c, risks, tab } as any,
        calculated_score: result.diagnosis.includes('DMG') ? 1 : result.diagnosis.includes('pré-existente') ? 2 : 0,
      });
      toast.success('Avaliação DMG salva');
    } catch { toast.error('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diabetes Mellitus Gestacional</CardTitle>
        <CardDescription>Critérios IADPSG / FEBRASGO / ADA — TOTG 75g e rastreio de risco</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert><Info className="h-4 w-4" /><AlertDescription>TOTG 75g: jejum de 8–14h. Coletas em jejum, 1h e 2h após 75g de glicose anidra.</AlertDescription></Alert>

        <div className="flex gap-2">
          <Button type="button" size="sm" variant={tab === 'totg' ? 'default' : 'outline'} onClick={() => setTab('totg')}>TOTG 75g</Button>
          <Button type="button" size="sm" variant={tab === 'risk' ? 'default' : 'outline'} onClick={() => setTab('risk')}>Fatores de Risco</Button>
        </div>

        {tab === 'totg' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[['fasting', 'Jejum (mg/dL)', fasting, setFasting, `< ${CUTOFFS.fasting}`],
                ['h1', '1h pós-carga (mg/dL)', h1, setH1, `< ${CUTOFFS.h1}`],
                ['h2', '2h pós-carga (mg/dL)', h2, setH2, `< ${CUTOFFS.h2}`],
                ['hba1c', 'HbA1c (%) — 1° trim', hba1c, setHba1c, '< 6,5%'],
              ].map(([id, label, val, setter, hint]) => (
                <div key={id as string} className="space-y-1">
                  <Label className="text-xs">{label as string}</Label>
                  <Input type="number" step="0.1" placeholder={hint as string} value={val as string}
                    onChange={e => (setter as (v: string) => void)(e.target.value)} />
                  <p className="text-[10px] text-muted-foreground">Normal: {hint as string}</p>
                </div>
              ))}
            </div>
            <Button onClick={calcTOTG} className="w-full gap-2"><Calculator className="h-4 w-4" />Interpretar TOTG</Button>
          </div>
        )}

        {tab === 'risk' && (
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-1.5">
              {RISK_FACTORS.map(f => (
                <button key={f.key} type="button"
                  className={`text-left p-2.5 rounded-lg border text-sm transition-colors ${risks[f.key] ? 'border-warning/60 bg-warning/5' : 'border-border hover:bg-muted/50'}`}
                  onClick={() => toggle(f.key)}>
                  <div className="flex items-center gap-2">
                    <div className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center ${risks[f.key] ? 'bg-warning border-warning' : 'border-input'}`}>
                      {risks[f.key] && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    {f.label}
                  </div>
                </button>
              ))}
            </div>
            <Button onClick={calcRisk} className="w-full gap-2"><Calculator className="h-4 w-4" />Avaliar Risco</Button>
          </div>
        )}

        {result && (
          <div className={`rounded-lg border p-4 space-y-2 ${result.color.includes('destructive') ? 'border-destructive/50 bg-destructive/5' : result.color.includes('warning') ? 'border-warning/50 bg-warning/5' : 'border-success/50 bg-success/5'}`}>
            <div className="flex items-center gap-2">
              {result.color.includes('success') ? <CheckCircle className={`h-5 w-5 ${result.color}`} /> : <AlertTriangle className={`h-5 w-5 ${result.color}`} />}
              <p className={`font-bold ${result.color}`}>{result.diagnosis}</p>
            </div>
            <p className="text-sm text-muted-foreground">{result.detail}</p>
            <Button variant="outline" size="sm" className="w-full mt-2 gap-2"
              onClick={() => { if (!requireAuth(performSave)) return; }} disabled={isSaving}>
              <Save className="h-4 w-4" />{isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </CardContent>
      <LoginPromptDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLogin={goToLogin} onSignup={goToSignup} />
    </Card>
  );
}
