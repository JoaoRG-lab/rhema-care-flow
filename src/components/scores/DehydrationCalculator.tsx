import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calculator, Save, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

const CRITERIA = [
  { key: 'appearance', label: 'Aspecto geral', options: [{ value: 0, label: 'Normal' }, { value: 1, label: 'Sedento, agitado ou letárgico' }, { value: 2, label: 'Sonolento, fláccido, sem consciência' }] },
  { key: 'eyes', label: 'Olhos', options: [{ value: 0, label: 'Normais' }, { value: 1, label: 'Levemente encovados' }, { value: 2, label: 'Muito encovados e secos' }] },
  { key: 'tears', label: 'Lágrimas', options: [{ value: 0, label: 'Presentes' }, { value: 1, label: 'Diminuídas' }, { value: 2, label: 'Ausentes' }] },
  { key: 'mouth', label: 'Boca e língua', options: [{ value: 0, label: 'Úmidas' }, { value: 1, label: 'Pegajosas' }, { value: 2, label: 'Secas' }] },
  { key: 'thirst', label: 'Sede', options: [{ value: 0, label: 'Normal / sem sede' }, { value: 1, label: 'Sedento / bebe com avidez' }, { value: 2, label: 'Bebe mal ou não consegue beber' }] },
  { key: 'skinFold', label: 'Turgor cutâneo (prega)', options: [{ value: 0, label: 'Normal (retorna imediato)' }, { value: 1, label: 'Retorno lento (< 2 s)' }, { value: 2, label: 'Retorno muito lento (> 2 s)' }] },
];

export function DehydrationCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [values, setValues] = useState<Record<string, number>>({});
  const [result, setResult] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const calculate = () => {
    if (Object.keys(values).length < 6) { toast.error('Avalie todos os 6 critérios'); return; }
    setResult(Object.values(values).reduce((a, b) => a + b, 0));
  };

  const interpret = (s: number) => {
    if (s <= 2) return { text: 'Sem desidratação (Plano A — TRO domiciliar)', color: 'text-success', plan: 'A' };
    if (s <= 6) return { text: 'Desidratação leve-moderada (Plano B — TRO supervisionada)', color: 'text-warning', plan: 'B' };
    return { text: 'Desidratação grave (Plano C — hidratação IV imediata)', color: 'text-destructive', plan: 'C' };
  };

  const performSave = async () => {
    if (!user || result === null) return;
    setIsSaving(true);
    try {
      await supabase.from('score_entries').insert({ user_id: user.id, score_type: 'DEHYDRATION', data_json: values as any, calculated_score: result });
      toast.success('Score salvo');
    } catch { toast.error('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avaliação de Desidratação</CardTitle>
        <CardDescription>Escala de Gorelick modificada / OMS — Planos A, B e C</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {CRITERIA.map((c) => (
              <div key={c.key}>
                <Label>{c.label}</Label>
                <div className="grid gap-1.5 mt-1.5">
                  {c.options.map((o) => (
                    <Button key={o.value} type="button" variant={values[c.key] === o.value ? 'default' : 'outline'} size="sm"
                      className="justify-start h-auto py-2 text-left whitespace-normal"
                      onClick={() => setValues(v => ({ ...v, [c.key]: o.value }))}>
                      <span className="font-mono mr-2 text-xs shrink-0">{o.value}</span>
                      <span className="font-normal">{o.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={calculate} className="w-full gap-2"><Calculator className="h-4 w-4" />Calcular</Button>
          </div>
          <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6">
            {result !== null ? (
              <>
                <p className="text-sm text-muted-foreground mb-1">Pontuação</p>
                <p className="text-6xl font-bold">{result}<span className="text-2xl text-muted-foreground">/12</span></p>
                <div className={`text-4xl font-bold mt-3 ${interpret(result).color}`}>Plano {interpret(result).plan}</div>
                <p className={`text-sm mt-1 text-center ${interpret(result).color}`}>{interpret(result).text}</p>
                {result >= 7 && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Acesso venoso / intraósseo urgente.</AlertDescription>
                  </Alert>
                )}
                <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => { if (!requireAuth(performSave)) return; }} disabled={isSaving}>
                  <Save className="h-4 w-4" />{isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            ) : <p className="text-muted-foreground text-sm text-center">Avalie cada critério e calcule</p>}
          </div>
        </div>
      </CardContent>
      <LoginPromptDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLogin={goToLogin} onSignup={goToSignup} />
    </Card>
  );
}
