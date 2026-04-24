import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calculator, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

function calcHolliday(weight: number): { daily: number; hourly: number; breakdown: string } {
  let daily = 0;
  let breakdown = '';
  if (weight <= 10) {
    daily = weight * 100;
    breakdown = `${weight} kg × 100 mL/kg = ${daily} mL/dia`;
  } else if (weight <= 20) {
    daily = 1000 + (weight - 10) * 50;
    breakdown = `1000 + (${weight - 10} kg × 50) = ${daily} mL/dia`;
  } else {
    daily = 1500 + (weight - 20) * 20;
    breakdown = `1500 + (${weight - 20} kg × 20) = ${daily} mL/dia`;
  }
  return { daily, hourly: Math.round(daily / 24), breakdown };
}

export function HollidaySegarCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [weight, setWeight] = useState('');
  const [result, setResult] = useState<{ daily: number; hourly: number; breakdown: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const calculate = () => {
    const w = parseFloat(weight);
    if (!w || w <= 0 || w > 150) { toast.error('Informe um peso válido (0–150 kg)'); return; }
    setResult(calcHolliday(w));
  };

  const performSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      await supabase.from('score_entries').insert({ user_id: user.id, score_type: 'HOLLIDAY-SEGAR', data_json: { weight: parseFloat(weight) } as any, calculated_score: result.daily });
      toast.success('Holliday-Segar salvo');
    } catch { toast.error('Erro ao salvar'); } finally { setIsSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Holliday-Segar</CardTitle>
        <CardDescription>Cálculo das necessidades hídricas de manutenção pediátrica</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 max-w-xs">
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input id="weight" type="number" min="0.5" max="150" step="0.1" placeholder="Ex: 15" value={weight}
            onChange={e => setWeight(e.target.value)} onKeyDown={e => e.key === 'Enter' && calculate()} />
        </div>
        <Button onClick={calculate} className="gap-2"><Calculator className="h-4 w-4" />Calcular</Button>

        {result && (
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-card rounded-lg p-4 border">
                <p className="text-3xl font-bold text-primary">{result.daily}</p>
                <p className="text-sm text-muted-foreground mt-1">mL / dia</p>
              </div>
              <div className="bg-card rounded-lg p-4 border">
                <p className="text-3xl font-bold text-primary">{result.hourly}</p>
                <p className="text-sm text-muted-foreground mt-1">mL / hora</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">{result.breakdown}</p>
            <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
              <p className="font-medium">Regra 4-2-1:</p>
              <p>• Primeiros 10 kg → 100 mL/kg/dia (4 mL/kg/h)</p>
              <p>• 10–20 kg → + 50 mL/kg/dia (2 mL/kg/h)</p>
              <p>• {'>'} 20 kg → + 20 mL/kg/dia (1 mL/kg/h)</p>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => { if (!requireAuth(performSave)) return; }} disabled={isSaving}>
              <Save className="h-4 w-4" />{isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </CardContent>
      <LoginPromptDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} onLogin={goToLogin} onSignup={goToSignup} />
    </Card>
  );
}
