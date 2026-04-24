import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calculator, Save, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

const WHEEZE_OPTIONS = [
  { value: 0, label: 'Ausente' },
  { value: 1, label: 'Final da expiração (estetoscópio)' },
  { value: 2, label: 'Toda expiração (estetoscópio)' },
  { value: 3, label: 'Inspiratório + expiratório sem estetoscópio' },
];

const RETRACTION_OPTIONS = [
  { value: 0, label: 'Ausente' },
  { value: 1, label: 'Intercostal leve' },
  { value: 2, label: 'Intercostal + supraesternal moderada' },
  { value: 3, label: 'Supraesternal + intercostal grave' },
];

function rrScore(rr: number, age: number): number {
  if (age < 6) {
    if (rr <= 30) return 0;
    if (rr <= 45) return 1;
    if (rr <= 60) return 2;
    return 3;
  } else {
    if (rr <= 20) return 0;
    if (rr <= 30) return 1;
    if (rr <= 40) return 2;
    return 3;
  }
}

export function PulmonaryScoreCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [rr, setRr] = useState('');
  const [age, setAge] = useState('');
  const [wheeze, setWheeze] = useState<number | null>(null);
  const [retraction, setRetraction] = useState<number | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const calculate = () => {
    const rrVal = parseInt(rr);
    const ageVal = parseFloat(age);
    if (!rrVal || !ageVal || wheeze === null || retraction === null) { toast.error('Preencha todos os campos'); return; }
    const total = rrScore(rrVal, ageVal) + wheeze + retraction;
    setResult(total);
  };

  const interpret = (s: number) => {
    if (s <= 3) return { text: 'Crise leve', color: 'text-success' };
    if (s <= 6) return { text: 'Crise moderada', color: 'text-warning' };
    return { text: 'Crise grave', color: 'text-destructive' };
  };

  const performSave = async () => {
    if (!user || result === null) return;
    setIsSaving(true);
    try {
      await supabase.from('score_entries').insert({ user_id: user.id, score_type: 'PULMONARY-SCORE', data_json: { rr, age, wheeze, retraction } as any, calculated_score: result });
      toast.success('Pulmonary Score salvo');
    } catch { toast.error('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pulmonary Score</CardTitle>
        <CardDescription>Gravidade da crise asmática pediátrica — escore de 0 a 9</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rrps">FR (irpm)</Label>
                <Input id="rrps" type="number" placeholder="Ex: 35" value={rr} onChange={e => setRr(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ageps">Idade (anos)</Label>
                <Input id="ageps" type="number" step="0.5" placeholder="Ex: 4" value={age} onChange={e => setAge(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Sibilância</Label>
              <div className="grid gap-1.5 mt-1.5">
                {WHEEZE_OPTIONS.map(o => (
                  <Button key={o.value} type="button" variant={wheeze === o.value ? 'default' : 'outline'} size="sm"
                    className="justify-start h-auto py-2 text-left whitespace-normal"
                    onClick={() => setWheeze(o.value)}>
                    <span className="font-mono mr-2 text-xs shrink-0">{o.value}</span>
                    <span className="font-normal">{o.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Retração</Label>
              <div className="grid gap-1.5 mt-1.5">
                {RETRACTION_OPTIONS.map(o => (
                  <Button key={o.value} type="button" variant={retraction === o.value ? 'default' : 'outline'} size="sm"
                    className="justify-start h-auto py-2 text-left whitespace-normal"
                    onClick={() => setRetraction(o.value)}>
                    <span className="font-mono mr-2 text-xs shrink-0">{o.value}</span>
                    <span className="font-normal">{o.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={calculate} className="w-full gap-2"><Calculator className="h-4 w-4" />Calcular</Button>
          </div>

          <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6">
            {result !== null ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">Pulmonary Score</p>
                <p className="text-6xl font-bold">{result}<span className="text-2xl text-muted-foreground">/9</span></p>
                <p className={`text-lg font-semibold mt-2 ${interpret(result).color}`}>{interpret(result).text}</p>
                {result >= 7 && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Considerar suporte ventilatório / UTI.</AlertDescription>
                  </Alert>
                )}
                <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => { if (!requireAuth(performSave)) return; }} disabled={isSaving}>
                  <Save className="h-4 w-4" />{isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
              </>
            ) : <p className="text-muted-foreground text-sm text-center">Preencha os dados e calcule</p>}
          </div>
        </div>
      </CardContent>
      <LoginPromptDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLogin={goToLogin} onSignup={goToSignup} />
    </Card>
  );
}
