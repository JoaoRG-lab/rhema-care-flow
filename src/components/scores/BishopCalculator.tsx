import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

const CRITERIA = [
  { key: 'dilation', label: 'Dilatação cervical', options: [
    { value: 0, label: 'Fechado' }, { value: 1, label: '1–2 cm' },
    { value: 2, label: '3–4 cm' }, { value: 3, label: '≥ 5 cm' },
  ]},
  { key: 'effacement', label: 'Apagamento do colo', options: [
    { value: 0, label: '0–30%' }, { value: 1, label: '40–50%' },
    { value: 2, label: '60–70%' }, { value: 3, label: '≥ 80%' },
  ]},
  { key: 'station', label: 'Altura da apresentação', options: [
    { value: 0, label: '-3' }, { value: 1, label: '-2' },
    { value: 2, label: '-1 / 0' }, { value: 3, label: '+1 / +2' },
  ]},
  { key: 'consistency', label: 'Consistência do colo', options: [
    { value: 0, label: 'Firme' }, { value: 1, label: 'Médio' }, { value: 2, label: 'Amolecido' },
  ]},
  { key: 'position', label: 'Posição do colo', options: [
    { value: 0, label: 'Posterior' }, { value: 1, label: 'Médio' }, { value: 2, label: 'Anterior' },
  ]},
];

export function BishopCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [values, setValues] = useState<Record<string, number>>({});
  const [result, setResult] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const calculate = () => {
    if (Object.keys(values).length < 5) { toast.error('Avalie todos os 5 critérios'); return; }
    setResult(Object.values(values).reduce((a, b) => a + b, 0));
  };

  const interpret = (s: number) => {
    if (s <= 5) return { text: 'Colo desfavorável — maturação indicada', color: 'text-destructive', badge: 'Desfavorável' };
    if (s <= 8) return { text: 'Colo intermediário — avaliar indução', color: 'text-warning', badge: 'Intermediário' };
    return { text: 'Colo favorável — indução com sucesso esperado', color: 'text-success', badge: 'Favorável' };
  };

  const performSave = async () => {
    if (!user || result === null) return;
    setIsSaving(true);
    try {
      await supabase.from('score_entries').insert({ user_id: user.id, score_type: 'BISHOP', data_json: values as any, calculated_score: result });
      toast.success('Bishop Score salvo');
    } catch { toast.error('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bishop Score</CardTitle>
        <CardDescription>Avaliação do colo uterino para indução do trabalho de parto (0–13)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {CRITERIA.map(c => (
              <div key={c.key}>
                <p className="text-sm font-medium mb-1.5">{c.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.options.map(o => (
                    <Button key={o.value} type="button" size="sm"
                      variant={values[c.key] === o.value ? 'default' : 'outline'}
                      className="h-auto py-1.5 text-xs"
                      onClick={() => setValues(v => ({ ...v, [c.key]: o.value }))}>
                      <span className="font-mono mr-1">{o.value}</span>{o.label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={calculate} className="w-full gap-2"><Calculator className="h-4 w-4" />Calcular Bishop</Button>
          </div>
          <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6">
            {result !== null ? <>
              <p className="text-sm text-muted-foreground mb-2">Pontuação</p>
              <p className="text-6xl font-bold">{result}<span className="text-2xl text-muted-foreground">/13</span></p>
              <p className={`text-lg font-semibold mt-2 ${interpret(result).color}`}>{interpret(result).badge}</p>
              <p className={`text-sm mt-1 text-center ${interpret(result).color}`}>{interpret(result).text}</p>
              <div className="mt-4 text-xs text-muted-foreground space-y-1 w-full border-t pt-3">
                <p>≤ 5 → maturação cervical (misoprostol / dinoprostona)</p>
                <p>6–8 → considerar indução com ocitocina</p>
                <p>≥ 9 → indução com alta taxa de sucesso</p>
              </div>
              <Button variant="outline" size="sm" className="mt-4 gap-2 w-full"
                onClick={() => { if (!requireAuth(performSave)) return; }} disabled={isSaving}>
                <Save className="h-4 w-4" />{isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </> : <p className="text-muted-foreground text-sm text-center">Avalie cada critério e calcule</p>}
          </div>
        </div>
      </CardContent>
      <LoginPromptDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLogin={goToLogin} onSignup={goToSignup} />
    </Card>
  );
}
