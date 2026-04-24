import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calculator, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

const SEVERITY_FEATURES = [
  { key: 'bp_severe', label: 'PAS ≥ 160 ou PAD ≥ 110 mmHg (em 2 ocasiões, 4h apart)', description: 'Critério de gravidade ACOG' },
  { key: 'thrombocytopenia', label: 'Plaquetas < 100.000/mm³', description: 'Trombocitopenia' },
  { key: 'renal', label: 'Cr > 1,1 mg/dL ou duplicação da Cr basal', description: 'Disfunção renal' },
  { key: 'hepatic_pain', label: 'Dor em HD / epigástrica intensa sem outra causa', description: 'Disfunção hepática sintomática' },
  { key: 'hepatic_alt', label: 'TGO ou TGP > 2× LSN', description: 'Elevação de transaminases' },
  { key: 'pulmonary_edema', label: 'Edema pulmonar', description: 'Critério de gravidade' },
  { key: 'neuro', label: 'Cefaleia intensa ou distúrbio visual novo', description: 'Sintomas neurológicos' },
];

export function PreeclampsiaCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();

  const [pas, setPas] = useState('');
  const [pad, setPad] = useState('');
  const [proteinuria, setProteinuria] = useState<'absent' | 'present' | 'severe' | null>(null);
  const [igWeeks, setIgWeeks] = useState('');
  const [severity, setSeverity] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<{
    hasPE: boolean; withSeverity: boolean; hellp: boolean; classification: string; color: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (key: string) => setSeverity(v => ({ ...v, [key]: !v[key] }));

  const calculate = () => {
    const pasVal = parseInt(pas), padVal = parseInt(pad), igVal = parseInt(igWeeks);
    if (!pasVal || !padVal || !proteinuria || !igVal) { toast.error('Preencha PA, proteinúria e IG'); return; }

    const hypertension = pasVal >= 140 || padVal >= 90;
    const severeHtn = pasVal >= 160 || padVal >= 110;
    const hasPE = igVal >= 20 && hypertension && (proteinuria === 'present' || proteinuria === 'severe');
    const severityCount = Object.values(severity).filter(Boolean).length;
    const withSeverity = hasPE && (severityCount > 0 || proteinuria === 'severe' || severeHtn);
    const hellp = hasPE && severity['thrombocytopenia'] && severity['hepatic_alt'];

    let classification = '', color = '';
    if (!hypertension) { classification = 'Sem hipertensão gestacional'; color = 'text-success'; }
    else if (!hasPE && igVal >= 20) { classification = 'Hipertensão Gestacional'; color = 'text-warning'; }
    else if (hellp) { classification = 'Síndrome HELLP'; color = 'text-destructive'; }
    else if (withSeverity) { classification = 'Pré-eclâmpsia com Critérios de Gravidade'; color = 'text-destructive'; }
    else if (hasPE) { classification = 'Pré-eclâmpsia sem Critérios de Gravidade'; color = 'text-warning'; }
    else { classification = 'Avaliar evolução'; color = 'text-muted-foreground'; }

    setResult({ hasPE, withSeverity, hellp, classification, color });
  };

  const performSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      await supabase.from('score_entries').insert({
        user_id: user.id, score_type: 'PREECLAMPSIA',
        data_json: { pas, pad, proteinuria, igWeeks, severity } as any,
        calculated_score: result.hellp ? 3 : result.withSeverity ? 2 : result.hasPE ? 1 : 0,
      });
      toast.success('Avaliação salva');
    } catch { toast.error('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pré-eclâmpsia — Critérios ACOG</CardTitle>
        <CardDescription>Classificação e critérios de gravidade (ACOG 2019 / FEBRASGO 2022)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Dados clínicos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label>PAS (mmHg)</Label>
            <Input type="number" placeholder="120" value={pas} onChange={e => setPas(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>PAD (mmHg)</Label>
            <Input type="number" placeholder="80" value={pad} onChange={e => setPad(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>IG (semanas)</Label>
            <Input type="number" min={0} max={42} placeholder="32" value={igWeeks} onChange={e => setIgWeeks(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Proteinúria</Label>
            <div className="flex flex-col gap-1">
              {[['absent','Ausente'],['present','≥ 300 mg/24h'],['severe','≥ 5 g/24h']].map(([v,l]) => (
                <Button key={v} type="button" size="sm" variant={proteinuria === v ? 'default' : 'outline'}
                  className="h-auto py-1 text-xs justify-start"
                  onClick={() => setProteinuria(v as any)}>{l}</Button>
              ))}
            </div>
          </div>
        </div>

        {/* Critérios de gravidade */}
        <div>
          <p className="text-sm font-semibold mb-2">Critérios de Gravidade (ACOG)</p>
          <div className="space-y-1.5">
            {SEVERITY_FEATURES.map(f => (
              <button key={f.key} type="button"
                className={`w-full text-left p-2.5 rounded-lg border text-sm transition-colors ${severity[f.key] ? 'border-destructive/60 bg-destructive/5' : 'border-border hover:bg-muted/50'}`}
                onClick={() => toggle(f.key)}>
                <div className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center ${severity[f.key] ? 'bg-destructive border-destructive' : 'border-input'}`}>
                    {severity[f.key] && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                  </div>
                  <span className="font-medium">{f.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={calculate} className="w-full gap-2"><Calculator className="h-4 w-4" />Classificar</Button>

        {result && (
          <div className={`rounded-lg border p-4 ${result.hellp ? 'border-destructive/50 bg-destructive/5' : result.withSeverity ? 'border-orange-500/50 bg-orange-500/5' : result.hasPE ? 'border-warning/50 bg-warning/5' : 'border-border'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.withSeverity || result.hellp
                ? <AlertTriangle className={`h-5 w-5 ${result.color}`} />
                : <CheckCircle className={`h-5 w-5 ${result.color}`} />}
              <p className={`font-bold text-lg ${result.color}`}>{result.classification}</p>
            </div>
            {result.hellp && (
              <Alert variant="destructive" className="mb-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Síndrome HELLP — estabilização + parto independente da IG.</AlertDescription>
              </Alert>
            )}
            {result.withSeverity && !result.hellp && (
              <p className="text-sm text-muted-foreground">Considerar internação, sulfato de magnésio (se IG ≥ 24s), anti-hipertensivo de ação rápida e avaliação para parto.</p>
            )}
            <Button variant="outline" size="sm" className="mt-3 w-full gap-2"
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
