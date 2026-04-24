import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calculator, Save, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

const RISK_FACTORS = [
  { key: 'prev_preterm', label: 'Parto prematuro espontâneo anterior (< 37s)', weight: 4 },
  { key: 'cx_surgery', label: 'Cirurgia cervical prévia (conização, LEEP)', weight: 2 },
  { key: 'uterine', label: 'Malformação uterina (útero bicorno, septo)', weight: 2 },
  { key: 'multiple', label: 'Gestação múltipla', weight: 3 },
  { key: 'infection', label: 'Infecção intra-uterina / corioamnionite', weight: 3 },
  { key: 'polyhydramnios', label: 'Polidrâmnio', weight: 2 },
  { key: 'bleeding', label: 'Sangramento vaginal no 2° trimestre', weight: 2 },
  { key: 'smoking', label: 'Tabagismo ativo na gestação', weight: 1 },
  { key: 'low_bmi', label: 'IMC < 18,5 kg/m² (desnutrição)', weight: 1 },
  { key: 'stress', label: 'Estresse psicossocial intenso', weight: 1 },
];

export function PretermRiskCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [cx, setCx] = useState(''); // cervical length mm
  const [ffn, setFfn] = useState<'positive' | 'negative' | null>(null);
  const [igWeeks, setIgWeeks] = useState('');
  const [result, setResult] = useState<{ risk: string; color: string; action: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (k: string) => setChecks(v => ({ ...v, [k]: !v[k] }));

  const calculate = () => {
    const cxMm = parseFloat(cx), ig = parseInt(igWeeks);
    if (!ig) { toast.error('Informe a IG atual'); return; }
    const riskScore = RISK_FACTORS.reduce((acc, f) => acc + (checks[f.key] ? f.weight : 0), 0);
    const shortCx = !isNaN(cxMm) && cxMm < 25;
    const positiveFfn = ffn === 'positive';

    const highRisk = riskScore >= 5 || (shortCx && positiveFfn) || (checks['prev_preterm'] && shortCx);
    const intermediate = !highRisk && (riskScore >= 2 || shortCx || positiveFfn);

    let risk, color, action;
    if (highRisk) {
      risk = 'Alto risco de parto prematuro';
      color = 'text-destructive';
      action = ig < 34
        ? 'Corticosteroide (betametasona 12mg/24h × 2 doses) + sulfato de Mg se < 32s + tocólise + internação.'
        : 'Monitorização estreita. Evitar esforços. Considerar internação.';
    } else if (intermediate) {
      risk = 'Risco intermediário';
      color = 'text-warning';
      action = 'Repetir colo uterino por US transvaginal em 2 semanas. Repouso relativo. Progesterona vaginal se CU < 25 mm (< 34s).';
    } else {
      risk = 'Baixo risco';
      color = 'text-success';
      action = 'Pré-natal habitual. Orientar sinais de alerta.';
    }
    setResult({ risk, color, action });
  };

  const performSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      await supabase.from('score_entries').insert({
        user_id: user.id, score_type: 'PRETERM-RISK',
        data_json: { checks, cx, ffn, igWeeks } as any,
        calculated_score: result.risk.includes('Alto') ? 3 : result.risk.includes('inter') ? 2 : 1,
      });
      toast.success('Risco PP salvo');
    } catch { toast.error('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risco de Parto Prematuro</CardTitle>
        <CardDescription>Avaliação clínica + colo uterino (USTV) + fFN — diretrizes FEBRASGO/ACOG</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>IG atual (semanas)</Label>
            <Input type="number" min={16} max={36} placeholder="Ex: 28" value={igWeeks} onChange={e => setIgWeeks(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Colo uterino — USTV (mm)</Label>
            <Input type="number" step="0.1" min={0} max={60} placeholder="Ex: 28" value={cx} onChange={e => setCx(e.target.value)} />
            <p className="text-[10px] text-muted-foreground">{"< 25 mm = curto"}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Fibronectina fetal (fFN)</Label>
            <div className="flex gap-2 mt-1">
              <Button type="button" size="sm" variant={ffn === 'negative' ? 'default' : 'outline'} onClick={() => setFfn('negative')}>Negativa</Button>
              <Button type="button" size="sm" variant={ffn === 'positive' ? 'default' : 'outline'} onClick={() => setFfn('positive')}>Positiva</Button>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Fatores de risco</p>
          <div className="grid md:grid-cols-2 gap-1.5">
            {RISK_FACTORS.map(f => (
              <button key={f.key} type="button"
                className={`text-left p-2.5 rounded-lg border text-xs transition-colors ${checks[f.key] ? 'border-warning/60 bg-warning/5' : 'border-border hover:bg-muted/50'}`}
                onClick={() => toggle(f.key)}>
                <div className="flex items-center gap-2">
                  <div className={`h-3.5 w-3.5 rounded border shrink-0 ${checks[f.key] ? 'bg-warning border-warning' : 'border-input'}`}>
                    {checks[f.key] && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                  </div>
                  {f.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={calculate} className="w-full gap-2"><Calculator className="h-4 w-4" />Avaliar Risco</Button>

        {result && (
          <div className={`rounded-lg border p-4 space-y-2 ${result.color.includes('destructive') ? 'border-destructive/50 bg-destructive/5' : result.color.includes('warning') ? 'border-warning/50 bg-warning/5' : 'border-success/50 bg-success/5'}`}>
            <p className={`font-bold text-lg ${result.color}`}>{result.risk}</p>
            <p className="text-sm text-muted-foreground">{result.action}</p>
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
