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
    key: 'wheeze',
    label: 'Sibilância',
    options: [
      { value: 0, label: 'Ausente' },
      { value: 1, label: 'Final da expiração (estetoscópio)' },
      { value: 2, label: 'Toda expiração (estetoscópio)' },
      { value: 3, label: 'Inspiração e expiração (sem estetoscópio)' },
    ],
  },
  {
    key: 'retraction',
    label: 'Retração (intercostal / supraesternal)',
    options: [
      { value: 0, label: 'Ausente' },
      { value: 1, label: 'Leve' },
      { value: 2, label: 'Moderada' },
      { value: 3, label: 'Grave' },
    ],
  },
  {
    key: 'airEntry',
    label: 'Entrada de ar',
    options: [
      { value: 0, label: 'Normal' },
      { value: 1, label: 'Reduzida mas simétrica' },
      { value: 2, label: 'Muito reduzida' },
      { value: 3, label: 'Ausente / mínima ("tórax silencioso")' },
    ],
  },
  {
    key: 'cyanosis',
    label: 'Cianose',
    options: [
      { value: 0, label: 'Ausente' },
      { value: 1, label: 'Em ar ambiente' },
      { value: 2, label: 'Com FiO₂ 40%' },
    ],
  },
  {
    key: 'consciousness',
    label: 'Estado de consciência',
    options: [
      { value: 0, label: 'Normal / alerta' },
      { value: 1, label: 'Agitado' },
      { value: 2, label: 'Deprimido / sonolento' },
    ],
  },
];

export function WoodDownesCalculator() {
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
    if (s <= 2) return { text: 'Crise leve', color: 'text-success', badge: 'Leve' };
    if (s <= 5) return { text: 'Crise moderada — observação / broncodilatador', color: 'text-warning', badge: 'Moderada' };
    if (s <= 8) return { text: 'Crise grave — considerar hospitalização', color: 'text-orange-500', badge: 'Grave' };
    return { text: 'Crise muito grave / insuficiência respiratória', color: 'text-destructive', badge: 'Muito Grave' };
  };

  const performSave = async () => {
    if (!user || result === null) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('score_entries').insert({
        user_id: user.id,
        score_type: 'WOOD-DOWNES',
        data_json: values as any,
        calculated_score: result,
      });
      if (error) throw error;
      toast.success('Wood-Downes salvo');
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
        <CardTitle>Wood-Downes Modificado</CardTitle>
        <CardDescription>Gravidade do broncoespasmo / crise asmática em crianças (0–14)</CardDescription>
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
              Calcular Wood-Downes
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6">
            {result !== null ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">Pontuação</p>
                <p className="text-6xl font-bold">{result}<span className="text-2xl text-muted-foreground">/14</span></p>
                <p className={`text-base font-semibold mt-2 ${interpret(result).color}`}>{interpret(result).badge}</p>
                <p className={`text-sm mt-1 text-center ${interpret(result).color}`}>{interpret(result).text}</p>
                {result >= 9 && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Considerar UTI / ventilação.</AlertDescription>
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
