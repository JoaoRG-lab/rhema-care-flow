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

// MFMU VBAC calculator — simplified Grobman score
// Ref: Grobman WA et al. Obstet Gynecol 2007
const BINARY = [
  { key: 'prior_vaginal', label: 'Parto vaginal anterior (qualquer)', points: 1 },
  { key: 'prior_vbac', label: 'PVPC anterior bem-sucedido', points: 1 },
  { key: 'nonrecurring', label: 'Causa não recorrente da cesárea anterior (ex.: gemelaridade, apresentação pélvica)', points: 1 },
  { key: 'no_gdm', label: 'Ausência de diabetes mellitus na gestação atual', points: 1 },
  { key: 'favorable_cx', label: 'Colo favorável na admissão (Bishop ≥ 6)', points: 1 },
  { key: 'spontaneous', label: 'Trabalho de parto espontâneo (sem indução)', points: 1 },
];

function successRate(score: number, age: number, bmi: number): number {
  // Simplified approximation of Grobman nomogram
  let base = 40 + score * 8;
  if (age > 35) base -= 5;
  if (bmi >= 30) base -= 5;
  if (bmi >= 40) base -= 5;
  return Math.min(95, Math.max(10, base));
}

export function VBACCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [age, setAge] = useState('');
  const [bmi, setBmi] = useState('');
  const [result, setResult] = useState<{ score: number; rate: number; recommendation: string; color: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggle = (k: string) => setChecks(v => ({ ...v, [k]: !v[k] }));

  const calculate = () => {
    const a = parseInt(age), b = parseFloat(bmi);
    if (!a || !b) { toast.error('Informe idade e IMC'); return; }
    const score = BINARY.reduce((acc, f) => acc + (checks[f.key] ? f.points : 0), 0);
    const rate = successRate(score, a, b);
    const recommendation = rate >= 70
      ? 'PVPC favorável — oferecer tentativa de parto vaginal'
      : rate >= 50
      ? 'PVPC possível — decisão compartilhada com a paciente'
      : 'Baixa chance de sucesso — discutir cesárea eletiva';
    const color = rate >= 70 ? 'text-success' : rate >= 50 ? 'text-warning' : 'text-destructive';
    setResult({ score, rate, recommendation, color });
  };

  const performSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      await supabase.from('score_entries').insert({
        user_id: user.id, score_type: 'VBAC',
        data_json: { checks, age, bmi } as any,
        calculated_score: result.rate,
      });
      toast.success('PVPC salvo');
    } catch { toast.error('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PVPC — Parto Vaginal Pós-Cesárea</CardTitle>
        <CardDescription>Estimativa de sucesso baseada no escore de Grobman (MFMU)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert><Info className="h-4 w-4" /><AlertDescription>Aplicável a gestantes com 1 cesárea prévia, incisão uterina transversal baixa, feto único, cefálico.</AlertDescription></Alert>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Idade materna (anos)</Label>
            <Input type="number" min={15} max={55} placeholder="Ex: 28" value={age} onChange={e => setAge(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>IMC pré-gestacional (kg/m²)</Label>
            <Input type="number" step="0.1" min={15} max={60} placeholder="Ex: 24.5" value={bmi} onChange={e => setBmi(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Fatores favoráveis</p>
          {BINARY.map(f => (
            <button key={f.key} type="button"
              className={`w-full text-left p-2.5 rounded-lg border text-sm transition-colors ${checks[f.key] ? 'border-primary/60 bg-primary/5' : 'border-border hover:bg-muted/50'}`}
              onClick={() => toggle(f.key)}>
              <div className="flex items-center gap-2">
                <div className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center ${checks[f.key] ? 'bg-primary border-primary' : 'border-input'}`}>
                  {checks[f.key] && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                </div>
                <span>{f.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">+{f.points}</span>
              </div>
            </button>
          ))}
        </div>

        <Button onClick={calculate} className="w-full gap-2"><Calculator className="h-4 w-4" />Calcular chance de PVPC</Button>

        {result && (
          <div className={`rounded-lg border p-5 text-center ${result.color.includes('success') ? 'border-success/50 bg-success/5' : result.color.includes('warning') ? 'border-warning/50 bg-warning/5' : 'border-destructive/50 bg-destructive/5'}`}>
            <p className="text-sm text-muted-foreground">Probabilidade de sucesso</p>
            <p className={`text-5xl font-bold mt-1 ${result.color}`}>{result.rate}%</p>
            <p className={`text-sm font-medium mt-2 ${result.color}`}>{result.recommendation}</p>
            <Button variant="outline" size="sm" className="mt-4 w-full gap-2"
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
