import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calculator, Save, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

// FMF 1st-trimester PE risk — simplified clinical model
// Ref: Poon LC et al. Ultrasound Obstet Gynecol 2019

const RISK_ITEMS = [
  { key: 'prev_pe', label: 'Pré-eclâmpsia em gestação anterior', weight: 8 },
  { key: 'chronic_htn', label: 'Hipertensão arterial crônica', weight: 6 },
  { key: 'dm1', label: 'Diabetes mellitus tipo 1 ou 2 pré-gestacional', weight: 4 },
  { key: 'lúpus_aps', label: 'Lúpus eritematoso sistêmico / SAF', weight: 4 },
  { key: 'nullipara', label: 'Nulípara (primeiro parto)', weight: 2 },
  { key: 'multiple', label: 'Gestação múltipla', weight: 3 },
  { key: 'ivf', label: 'Fertilização in vitro (FIV)', weight: 2 },
  { key: 'bmi_30', label: 'IMC ≥ 30 kg/m²', weight: 2 },
  { key: 'age_40', label: 'Idade materna ≥ 40 anos', weight: 2 },
  { key: 'family_pe', label: 'História familiar de pré-eclâmpsia (1° grau)', weight: 2 },
  { key: 'interpregnancy', label: 'Intervalo intergestacional > 10 anos', weight: 2 },
];

export function PEEarlyRiskCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [map, setMap] = useState(''); // mean arterial pressure
  const [uterine, setUterine] = useState(''); // uterine artery PI
  const [plgf, setPlgf] = useState(''); // PlGF MoM
  const [result, setResult] = useState<{ risk: string; color: string; aspirin: boolean; detail: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (k: string) => setChecks(v => ({ ...v, [k]: !v[k] }));

  const calculate = () => {
    const score = RISK_ITEMS.reduce((acc, f) => acc + (checks[f.key] ? f.weight : 0), 0);
    const mapV = parseFloat(map), piV = parseFloat(uterine), plgfV = parseFloat(plgf);

    // Biomarker flags
    const mapHigh = !isNaN(mapV) && mapV >= 90;
    const piHigh = !isNaN(piV) && piV >= 1.4; // 95th percentile 11–13w
    const plgfLow = !isNaN(plgfV) && plgfV < 0.4; // <10th percentile

    const biomarkerFlags = [mapHigh, piHigh, plgfLow].filter(Boolean).length;

    const highRisk = score >= 8 || biomarkerFlags >= 2 || (score >= 4 && biomarkerFlags >= 1);
    const intermediate = !highRisk && (score >= 4 || biomarkerFlags >= 1);

    const risk = highRisk ? 'Alto Risco' : intermediate ? 'Risco Intermediário' : 'Baixo Risco';
    const color = highRisk ? 'text-destructive' : intermediate ? 'text-warning' : 'text-success';
    const aspirin = highRisk || intermediate;
    const detail = highRisk
      ? 'AAS 150 mg/noite a partir de 11–14s até 36s. Considerar monitorização com Doppler e PlGF seriados.'
      : intermediate
      ? 'Considerar AAS 100–150 mg/noite. Repetir rastreio com marcadores biofísicos.'
      : 'Baixo risco. Pré-natal habitual. Monitorizar PA em todas as consultas.';

    setResult({ risk, color, aspirin, detail });
  };

  const performSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      await supabase.from('score_entries').insert({
        user_id: user.id, score_type: 'PE-EARLY-RISK',
        data_json: { checks, map, uterine, plgf } as any,
        calculated_score: result.risk === 'Alto Risco' ? 3 : result.risk === 'Risco Intermediário' ? 2 : 1,
      });
      toast.success('Triagem PE 1° trim salva');
    } catch { toast.error('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Triagem de Pré-eclâmpsia — 1° Trimestre</CardTitle>
        <CardDescription>Modelo FMF combinado: fatores maternos + biofísicos + bioquímicos (11–13+6 semanas)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert><Info className="h-4 w-4" /><AlertDescription>Triagem entre 11–13+6 semanas. Marcadores biofísicos/bioquímicos opcionais mas aumentam a acurácia.</AlertDescription></Alert>

        <div>
          <p className="text-sm font-semibold mb-2">Fatores de risco maternos</p>
          <div className="grid md:grid-cols-2 gap-1.5">
            {RISK_ITEMS.map(f => (
              <button key={f.key} type="button"
                className={`text-left p-2.5 rounded-lg border text-xs transition-colors ${checks[f.key] ? 'border-warning/60 bg-warning/5' : 'border-border hover:bg-muted/50'}`}
                onClick={() => toggle(f.key)}>
                <div className="flex items-center gap-2">
                  <div className={`h-3.5 w-3.5 rounded border shrink-0 flex items-center justify-center ${checks[f.key] ? 'bg-warning border-warning' : 'border-input'}`}>
                    {checks[f.key] && <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                  </div>
                  <span>{f.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Marcadores biofísicos/bioquímicos (opcional)</p>
          <div className="grid grid-cols-3 gap-3">
            {[['map','PAM (mmHg)', '≥ 90 = alto', map, setMap],
              ['uterine','IP artérias uterinas','≥ 1,4 = alto', uterine, setUterine],
              ['plgf','PlGF MoM','< 0,4 = baixo', plgf, setPlgf],
            ].map(([id, label, hint, val, setter]) => (
              <div key={id as string} className="space-y-1">
                <Label className="text-xs">{label as string}</Label>
                <Input type="number" step="0.01" placeholder={hint as string} value={val as string}
                  onChange={e => (setter as (v: string) => void)(e.target.value)} />
                <p className="text-[10px] text-muted-foreground">{hint as string}</p>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={calculate} className="w-full gap-2"><Calculator className="h-4 w-4" />Calcular Risco</Button>

        {result && (
          <div className={`rounded-lg border p-4 space-y-2 ${result.color.includes('destructive') ? 'border-destructive/50 bg-destructive/5' : result.color.includes('warning') ? 'border-warning/50 bg-warning/5' : 'border-success/50 bg-success/5'}`}>
            <div className="flex items-center gap-2">
              {result.color.includes('success') ? <CheckCircle className={`h-5 w-5 ${result.color}`} /> : <AlertTriangle className={`h-5 w-5 ${result.color}`} />}
              <p className={`font-bold text-lg ${result.color}`}>{result.risk}</p>
              {result.aspirin && <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">AAS indicado</span>}
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
