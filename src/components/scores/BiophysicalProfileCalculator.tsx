import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, Save, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

// Manning Biophysical Profile — 5 parameters, 2 points each (max 10)
const PARAMETERS = [
  {
    key: 'nst',
    label: 'CTG — Cardiotocografia (NST)',
    options: [
      { value: 2, label: '2 — Reativo: ≥ 2 acelerações ≥ 15 bpm × 15s em 20 min' },
      { value: 0, label: '0 — Não reativo: sem critérios acima' },
    ],
  },
  {
    key: 'breathing',
    label: 'Movimentos Respiratórios Fetais',
    options: [
      { value: 2, label: '2 — ≥ 1 episódio de ≥ 30s em 30 min' },
      { value: 0, label: '0 — Ausentes ou < 30s' },
    ],
  },
  {
    key: 'movement',
    label: 'Movimentos Corpóreos Fetais',
    options: [
      { value: 2, label: '2 — ≥ 3 movimentos discretos em 30 min' },
      { value: 0, label: '0 — ≤ 2 movimentos' },
    ],
  },
  {
    key: 'tone',
    label: 'Tônus Fetal',
    options: [
      { value: 2, label: '2 — ≥ 1 extensão/flexão de membro ou abertura/fechamento de mão' },
      { value: 0, label: '0 — Extensão sem retorno à flexão' },
    ],
  },
  {
    key: 'afv',
    label: 'Volume de Líquido Amniótico (ILA / bolsão único)',
    options: [
      { value: 2, label: '2 — Bolsão ≥ 2 cm em 2 perpendiculares (ou ILA ≥ 5 cm)' },
      { value: 0, label: '0 — Oligoâmnio: bolsão < 2 cm' },
    ],
  },
];

export function BiophysicalProfileCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [values, setValues] = useState<Record<string, number>>({});
  const [result, setResult] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const calculate = () => {
    if (Object.keys(values).length < 5) { toast.error('Avalie todos os 5 parâmetros'); return; }
    setResult(Object.values(values).reduce((a, b) => a + b, 0));
  };

  const interpret = (s: number) => {
    if (s >= 8) return { text: 'Normal — asfixia improvável', color: 'text-success', action: 'Conduta obstétrica habitual. Repetir conforme indicação clínica.', urgent: false };
    if (s === 6) return { text: 'Suspeito — possível comprometimento fetal', color: 'text-warning', action: 'Repetir em 24h. Se < 34s considerar internação; se ≥ 34s avaliar parto.', urgent: false };
    if (s === 4) return { text: 'Comprometimento fetal provável', color: 'text-orange-500', action: 'Se ≥ 32s: parto. Se < 32s: repetir em 4–6h; se permanecer ≤ 4 → parto.', urgent: true };
    return { text: 'Asfixia fetal quase certa', color: 'text-destructive', action: 'Parto imediato independente da IG.', urgent: true };
  };

  const performSave = async () => {
    if (!user || result === null) return;
    setIsSaving(true);
    try {
      await supabase.from('score_entries').insert({
        user_id: user.id, score_type: 'BIOPHYSICAL-PROFILE',
        data_json: values as any, calculated_score: result,
      });
      toast.success('Perfil biofísico salvo');
    } catch { toast.error('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil Biofísico Fetal (Manning)</CardTitle>
        <CardDescription>Avaliação do bem-estar fetal por USG + CTG — pontuação 0–10</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {PARAMETERS.map(p => (
              <div key={p.key}>
                <p className="text-sm font-medium mb-1.5">{p.label}</p>
                <div className="space-y-1.5">
                  {p.options.map(o => (
                    <Button key={o.value} type="button" size="sm"
                      variant={values[p.key] === o.value ? 'default' : 'outline'}
                      className="w-full justify-start h-auto py-2 text-xs text-left whitespace-normal"
                      onClick={() => setValues(v => ({ ...v, [p.key]: o.value }))}>
                      <span className="font-mono mr-2 shrink-0">{o.value}</span>
                      <span className="font-normal">{o.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={calculate} className="w-full gap-2"><Calculator className="h-4 w-4" />Calcular PBF</Button>
          </div>

          <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6 gap-3">
            {result !== null ? (() => {
              const interp = interpret(result);
              return <>
                <p className="text-sm text-muted-foreground">Pontuação</p>
                <p className="text-6xl font-bold">{result}<span className="text-2xl text-muted-foreground">/10</span></p>
                <p className={`text-lg font-semibold text-center ${interp.color}`}>{interp.text}</p>
                {interp.urgent && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{interp.action}</AlertDescription>
                  </Alert>
                )}
                {!interp.urgent && <p className="text-sm text-muted-foreground text-center">{interp.action}</p>}
                <Button variant="outline" size="sm" className="w-full gap-2"
                  onClick={() => { if (!requireAuth(performSave)) return; }} disabled={isSaving}>
                  <Save className="h-4 w-4" />{isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </>;
            })() : <p className="text-muted-foreground text-sm text-center">Avalie cada parâmetro e calcule</p>}
          </div>
        </div>
      </CardContent>
      <LoginPromptDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLogin={goToLogin} onSignup={goToSignup} />
    </Card>
  );
}
