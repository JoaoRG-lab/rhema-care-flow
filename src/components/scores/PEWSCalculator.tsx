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

const DOMAINS: { key: string; label: string; options: { value: number; label: string }[] }[] = [
  {
    key: 'behavior',
    label: 'Behavior',
    options: [
      { value: 0, label: 'Playing / appropriate' },
      { value: 1, label: 'Sleeping' },
      { value: 2, label: 'Irritable' },
      { value: 3, label: 'Lethargic / confused / reduced response to pain' },
    ],
  },
  {
    key: 'cardiovascular',
    label: 'Cardiovascular',
    options: [
      { value: 0, label: 'Pink, cap refill 1–2 s' },
      { value: 1, label: 'Pale, cap refill 3 s' },
      { value: 2, label: 'Grey, cap refill 4 s, HR ≥20 above normal' },
      { value: 3, label: 'Grey/mottled, cap refill ≥5 s, HR ≥30 above normal or bradycardia' },
    ],
  },
  {
    key: 'respiratory',
    label: 'Respiratory',
    options: [
      { value: 0, label: 'Within normal range, no retractions' },
      { value: 1, label: 'RR >10 above normal, accessory muscles, FiO₂ ≥30% or 3 L/min' },
      { value: 2, label: 'RR >20 above normal, retractions, FiO₂ ≥40% or 6 L/min' },
      { value: 3, label: 'RR ≥5 below normal with retractions/grunting, FiO₂ ≥50% or 8 L/min' },
    ],
  },
];

export function PEWSCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [values, setValues] = useState<Record<string, number>>({});
  const [nebulizer, setNebulizer] = useState(false);
  const [persistentVomit, setPersistentVomit] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const calculate = () => {
    if (Object.keys(values).length < 3) {
      toast.error('Please rate all 3 domains');
      return;
    }
    const base = Object.values(values).reduce((a, b) => a + b, 0);
    const extras = (nebulizer ? 2 : 0) + (persistentVomit ? 2 : 0);
    setResult(base + extras);
  };

  const interpret = (s: number) => {
    if (s <= 2) return { text: 'Low risk — routine monitoring', color: 'text-success', escalate: false };
    if (s <= 4) return { text: 'Medium risk — increase monitoring, notify nurse-in-charge', color: 'text-warning', escalate: false };
    return { text: 'High risk — call rapid response / medical review', color: 'text-destructive', escalate: true };
  };

  const performSave = async () => {
    if (!user || result === null) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('score_entries').insert({
        user_id: user.id,
        score_type: 'PEWS',
        data_json: { ...values, nebulizer, persistentVomit } as any,
        calculated_score: result,
      });
      if (error) throw error;
      toast.success('PEWS saved');
    } catch (e) {
      toast.error('Failed to save score');
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
        <CardTitle>Pediatric Early Warning Score</CardTitle>
        <CardDescription>Detects deterioration in hospitalized children</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {DOMAINS.map((d) => (
              <div key={d.key}>
                <Label>{d.label}</Label>
                <div className="grid gap-1.5 mt-1.5">
                  {d.options.map((o) => (
                    <Button
                      key={o.value}
                      type="button"
                      variant={values[d.key] === o.value ? 'default' : 'outline'}
                      size="sm"
                      className="justify-start h-auto py-2 text-left whitespace-normal"
                      onClick={() => setValues((v) => ({ ...v, [d.key]: o.value }))}
                    >
                      <span className="font-mono mr-2 text-xs shrink-0">{o.value}</span>
                      <span className="font-normal">{o.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}

            <div className="space-y-2 pt-2 border-t">
              <Label>Modifiers (+2 each)</Label>
              <Button
                type="button"
                variant={nebulizer ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setNebulizer((v) => !v)}
              >
                Nebulizer ¼-hourly or persistent vomiting after surgery
              </Button>
              <Button
                type="button"
                variant={persistentVomit ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => setPersistentVomit((v) => !v)}
              >
                Persistent vomiting
              </Button>
            </div>

            <Button onClick={calculate} className="w-full gap-2">
              <Calculator className="h-4 w-4" />
              Calculate PEWS
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6">
            {result !== null ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">PEWS Total</p>
                <p className="text-6xl font-bold">{result}</p>
                <p className={`text-lg font-medium mt-2 text-center ${interpret(result).color}`}>
                  {interpret(result).text}
                </p>
                {interpret(result).escalate && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Escalate to rapid response team.</AlertDescription>
                  </Alert>
                )}
                <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={saveScore} disabled={isSaving}>
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Score'}
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm text-center">
                Score each domain, add modifiers, then calculate
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <LoginPromptDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        onLogin={goToLogin}
        onSignup={goToSignup}
      />
    </Card>
  );
}
