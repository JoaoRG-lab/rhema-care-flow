import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calculator, Save, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

export function AmniotiFluidCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [q4, setQ4] = useState('');
  const [deepest, setDeepest] = useState('');
  const [result, setResult] = useState<{ ila: number; deepV: number; classification: string; color: string; detail: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const calculate = () => {
    const q = [q1, q2, q3, q4].map(parseFloat);
    const d = parseFloat(deepest);
    if (q.some(isNaN) && isNaN(d)) { toast.error('Informe os 4 quadrantes (ILA) ou o maior bolsão'); return; }
    const ila = q.every(v => !isNaN(v)) ? q.reduce((a, b) => a + b, 0) : NaN;
    const deepV = !isNaN(d) ? d : NaN;

    // Classify by ILA
    let classification = '', color = '', detail = '';
    if (!isNaN(ila)) {
      if (ila < 5) { classification = 'Oligoâmnio'; color = 'text-destructive'; detail = 'ILA < 5 cm. Avaliação fetal urgente — perfil biofísico, Doppler. Considerar parto conforme IG.'; }
      else if (ila <= 8) { classification = 'Líquido amniótico reduzido (borderline)'; color = 'text-warning'; detail = 'ILA 5–8 cm. Monitorização seriada. Hidratação materna. Doppler umbilical.'; }
      else if (ila <= 24) { classification = 'Volume normal'; color = 'text-success'; detail = 'ILA 8–24 cm. Dentro da normalidade.'; }
      else { classification = 'Polidrâmnio'; color = 'text-warning'; detail = 'ILA > 24 cm. Investigar: malformações fetais, DMG, gestação múltipla, hidropsia. Amniorredução se sintomático.'; }
    } else if (!isNaN(deepV)) {
      if (deepV < 2) { classification = 'Oligoâmnio (bolsão único)'; color = 'text-destructive'; detail = 'Maior bolsão < 2 cm. Avaliação fetal urgente.'; }
      else if (deepV <= 8) { classification = 'Volume normal (bolsão único)'; color = 'text-success'; detail = 'Maior bolsão 2–8 cm. Normal.'; }
      else { classification = 'Polidrâmnio (bolsão único)'; color = 'text-warning'; detail = 'Maior bolsão > 8 cm. Investigar causa.'; }
    }
    setResult({ ila: isNaN(ila) ? -1 : ila, deepV: isNaN(deepV) ? -1 : deepV, classification, color, detail });
  };

  const performSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      await supabase.from('score_entries').insert({
        user_id: user.id, score_type: 'AMNIOTIC-FLUID',
        data_json: { q1, q2, q3, q4, deepest } as any,
        calculated_score: result.ila >= 0 ? result.ila : result.deepV,
      });
      toast.success('ILA salvo');
    } catch { toast.error('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Índice de Líquido Amniótico (ILA)</CardTitle>
        <CardDescription>Método dos 4 quadrantes (Phelan) ou maior bolsão único — cm</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert><Info className="h-4 w-4" /><AlertDescription>Preencha os 4 quadrantes para o ILA completo, ou apenas o maior bolsão. Ambos são aceitos clinicamente.</AlertDescription></Alert>

        <div>
          <p className="text-sm font-semibold mb-2">Método dos 4 quadrantes (cm)</p>
          <div className="grid grid-cols-2 gap-3">
            {[['q1','QSD (quadrante sup. direito)', q1, setQ1],
              ['q2','QSE (quadrante sup. esquerdo)', q2, setQ2],
              ['q3','QID (quadrante inf. direito)', q3, setQ3],
              ['q4','QIE (quadrante inf. esquerdo)', q4, setQ4],
            ].map(([id, label, val, setter]) => (
              <div key={id as string} className="space-y-1">
                <Label className="text-xs">{label as string}</Label>
                <Input type="number" step="0.1" min={0} max={30} placeholder="cm" value={val as string}
                  onChange={e => (setter as (v: string) => void)(e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 border-t" />
          <span className="text-xs text-muted-foreground px-2">ou</span>
          <div className="flex-1 border-t" />
        </div>

        <div className="space-y-1.5">
          <Label>Maior bolsão único (cm)</Label>
          <Input type="number" step="0.1" min={0} max={30} placeholder="cm" value={deepest} onChange={e => setDeepest(e.target.value)} />
        </div>

        <Button onClick={calculate} className="w-full gap-2"><Calculator className="h-4 w-4" />Calcular ILA</Button>

        {result && (
          <div className={`rounded-lg border p-4 space-y-2 ${result.color.includes('destructive') ? 'border-destructive/50 bg-destructive/5' : result.color.includes('warning') ? 'border-warning/50 bg-warning/5' : 'border-success/50 bg-success/5'}`}>
            {result.ila >= 0 && (
              <div className="text-center mb-2">
                <p className="text-sm text-muted-foreground">ILA</p>
                <p className={`text-4xl font-bold ${result.color}`}>{result.ila.toFixed(1)} cm</p>
              </div>
            )}
            {result.deepV >= 0 && (
              <div className="text-center mb-2">
                <p className="text-sm text-muted-foreground">Maior bolsão</p>
                <p className={`text-4xl font-bold ${result.color}`}>{result.deepV.toFixed(1)} cm</p>
              </div>
            )}
            <p className={`font-bold text-center ${result.color}`}>{result.classification}</p>
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
