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
  {
    key: 'thoracoAbdominal',
    label: 'Movimento torácico-abdominal',
    options: [
      { value: 0, label: 'Sincronizado' },
      { value: 1, label: 'Atraso ou mínima assimetria' },
      { value: 2, label: 'Respiração paradoxal (balancim)' },
    ],
  },
  {
    key: 'intercostalRetraction',
    label: 'Retração intercostal',
    options: [
      { value: 0, label: 'Ausente' },
      { value: 1, label: 'Discreta' },
      { value: 2, label: 'Acentuada' },
    ],
  },
  {
    key: 'xiphoidRetraction',
    label: 'Retração xifóidea',
    options: [
      { value: 0, label: 'Ausente' },
      { value: 1, label: 'Discreta' },
      { value: 2, label: 'Acentuada' },
    ],
  },
  {
    key: 'nasalFlaring',
    label: 'Dilatação nasal',
    options: [
      { value: 0, label: 'Ausente' },
      { value: 1, label: 'Mínima' },
      { value: 2, label: 'Acentuada' },
    ],
  },
  {
    key: 'expiratory',
    label: 'Gemido expiratório',
    options: [
      { value: 0, label: 'Ausente' },
      { value: 1, label: 'Audível com estetoscópio' },
      { value: 2, label: 'Audível sem estetoscópio' },
    ],
  },
];

export function SilvermanCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [values, setValues] = useState<Record<string, number>>({});
  const [result, setResult] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const calculate = () => {
    if (Object.keys(values).length < 5) {
      toast.error('Avalie todos os 5 critérios');
      return;
    }
    setResult(Object.values(values).reduce((a, b) => a + b, 0));
  };

  const interpret = (s: number) => {
    if (s === 0) return { text: 'Sem desconforto respiratório', color: 'text-success' };
    if (s <= 3) return { text: 'Desconforto respiratório leve', color: 'text-warning' };
    if (s <= 6) return { text: 'Desconforto respiratório moderado', color: 'text-orange-500' };
    return { text: 'Desconforto respiratório grave — suporte imediato', color: 'text-destructive' };
  };

  const performSave = async () => {
    if (!user || result === null) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('score_entries').insert({
        user_id: user.id,
        score_type: 'SILVERMAN',
        data_json: values as any,
        calculated_score: result,
      });
      if (error) throw error;
      toast.success('Silverman-Andersen salvo');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const saveScore = () => {
    if (result === null) return;
    if (!requireAuth(performSave)) return;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Silverman-Andersen</CardTitle>
        <CardDescription>Avaliação do desconforto respiratório neonatal (0–10)</CardDescription>
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
                      className="justify-start h-auto py-2 text-left whitespace-normal"
                      onClick={() => setValues((v) => ({ ...v, [c.key]: o.value }))}
                    >
                      <span className="font-mono mr-2 text-xs shrink-0">{o.value}</span>
                      <span className="font-normal">{o.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={calculate} className="w-full gap-2">
              <Calculator className="h-4 w-4" />
              Calcular Silverman-Andersen
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6">
            {result !== null ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">Pontuação Total</p>
                <p className="text-6xl font-bold">{result}</p>
                <p className={`text-base font-medium mt-3 text-center ${interpret(result).color}`}>
                  {interpret(result).text}
                </p>
                {result >= 7 && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Suporte ventilatório imediato.</AlertDescription>
                  </Alert>
                )}
                <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={saveScore} disabled={isSaving}>
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm text-center">Avalie cada critério e calcule</p>
            )}
          </div>
        </div>
      </CardContent>
      <LoginPromptDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLogin={goToLogin} onSignup={goToSignup} />
    </Card>
  );
}
