import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calculator, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

const CRITERIA: { key: string; label: string; options: { value: number; label: string }[] }[] = [
  {
    key: 'dilation',
    label: 'Dilatação (cm)',
    options: [
      { value: 0, label: 'Fechado' },
      { value: 1, label: '1–2 cm' },
      { value: 2, label: '3–4 cm' },
      { value: 3, label: '≥ 5 cm' },
    ],
  },
  {
    key: 'effacement',
    label: 'Apagamento (%)',
    options: [
      { value: 0, label: '0–30%' },
      { value: 1, label: '40–50%' },
      { value: 2, label: '60–70%' },
      { value: 3, label: '≥ 80%' },
    ],
  },
  {
    key: 'station',
    label: 'Altura da apresentação (De Lee)',
    options: [
      { value: 0, label: '−3' },
      { value: 1, label: '−2' },
      { value: 2, label: '−1 / 0' },
      { value: 3, label: '+1 / +2' },
    ],
  },
  {
    key: 'consistency',
    label: 'Consistência do colo',
    options: [
      { value: 0, label: 'Firme' },
      { value: 1, label: 'Médio' },
      { value: 2, label: 'Amolecido' },
    ],
  },
  {
    key: 'position',
    label: 'Posição do colo',
    options: [
      { value: 0, label: 'Posterior' },
      { value: 1, label: 'Médio' },
      { value: 2, label: 'Anterior' },
    ],
  },
];

export function BishopScoreCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [values, setValues] = useState<Record<string, number>>({});
  const [result, setResult] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const calculate = () => {
    if (Object.keys(values).length < 5) {
      toast.error('Preencha todos os 5 critérios');
      return;
    }
    setResult(Object.values(values).reduce((a, b) => a + b, 0));
  };

  const interpret = (s: number) => {
    if (s >= 8) return { text: 'Colo favorável — alta chance de parto vaginal', color: 'text-success' };
    if (s >= 6) return { text: 'Intermediário — considerar indução', color: 'text-warning' };
    return { text: 'Colo desfavorável (≤ 5) — preparo cervical recomendado', color: 'text-destructive' };
  };

  const performSave = async () => {
    if (!user || result === null) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('score_entries').insert({
        user_id: user.id,
        score_type: 'Bishop',
        data_json: values as any,
        calculated_score: result,
      });
      if (error) throw error;
      toast.success('Bishop score salvo');
    } catch {
      toast.error('Falha ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const saveScore = () => {
    if (result === null) return;
    requireAuth(performSave);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bishop Score</CardTitle>
        <CardDescription>
          Avaliação da maturidade cervical para indução do trabalho de parto (Bishop EH, 1964).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {CRITERIA.map((c) => (
              <div key={c.key}>
                <Label>{c.label}</Label>
                <div className="grid gap-1.5 mt-1.5">
                  {c.options.map((o) => (
                    <Button
                      key={o.value}
                      type="button"
                      variant={values[c.key] === o.value ? 'default' : 'outline'}
                      size="sm"
                      className="justify-start h-auto py-2 text-left"
                      onClick={() => setValues((v) => ({ ...v, [c.key]: o.value }))}
                    >
                      <span className="font-mono mr-2 text-xs">{o.value}</span>
                      <span className="font-normal">{o.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            <Button onClick={calculate} className="w-full gap-2">
              <Calculator className="h-4 w-4" /> Calcular Bishop
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6">
            {result !== null ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">Bishop Score</p>
                <p className="text-6xl font-bold">{result}/13</p>
                <p className={`text-base font-medium mt-2 text-center ${interpret(result).color}`}>
                  {interpret(result).text}
                </p>
                <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={saveScore} disabled={isSaving}>
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm text-center">
                Avalie os 5 critérios e toque em Calcular
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <LoginPromptDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLogin={goToLogin} onSignup={goToSignup} />
    </Card>
  );
}
