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
    key: 'appearance',
    label: 'Appearance (skin color)',
    options: [
      { value: 0, label: 'Blue / pale all over' },
      { value: 1, label: 'Body pink, extremities blue' },
      { value: 2, label: 'Completely pink' },
    ],
  },
  {
    key: 'pulse',
    label: 'Pulse (heart rate)',
    options: [
      { value: 0, label: 'Absent' },
      { value: 1, label: '< 100 bpm' },
      { value: 2, label: '≥ 100 bpm' },
    ],
  },
  {
    key: 'grimace',
    label: 'Grimace (reflex)',
    options: [
      { value: 0, label: 'No response' },
      { value: 1, label: 'Grimace' },
      { value: 2, label: 'Cry / cough / sneeze' },
    ],
  },
  {
    key: 'activity',
    label: 'Activity (muscle tone)',
    options: [
      { value: 0, label: 'Limp' },
      { value: 1, label: 'Some flexion' },
      { value: 2, label: 'Active motion' },
    ],
  },
  {
    key: 'respiration',
    label: 'Respiration',
    options: [
      { value: 0, label: 'Absent' },
      { value: 1, label: 'Slow / irregular' },
      { value: 2, label: 'Strong cry' },
    ],
  },
];

export function APGARCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [values, setValues] = useState<Record<string, number>>({});
  const [minute, setMinute] = useState<'1' | '5' | '10'>('1');
  const [result, setResult] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const calculate = () => {
    if (Object.keys(values).length < 5) {
      toast.error('Please rate all 5 criteria');
      return;
    }
    const total = Object.values(values).reduce((a, b) => a + b, 0);
    setResult(total);
  };

  const interpret = (s: number) => {
    if (s >= 7) return { text: 'Reassuring (7–10)', color: 'text-success' };
    if (s >= 4) return { text: 'Moderately depressed (4–6)', color: 'text-warning' };
    return { text: 'Severely depressed (0–3)', color: 'text-destructive' };
  };

  const performSave = async () => {
    if (!user || result === null) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('score_entries').insert({
        user_id: user.id,
        score_type: `APGAR-${minute}min`,
        data_json: { ...values, minute } as any,
        calculated_score: result,
      });
      if (error) throw error;
      toast.success(`APGAR (${minute} min) saved`);
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
        <CardTitle>APGAR Calculator</CardTitle>
        <CardDescription>Newborn vitality assessment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>Time of assessment</Label>
              <div className="flex gap-2 mt-1">
                {(['1', '5', '10'] as const).map((m) => (
                  <Button
                    key={m}
                    type="button"
                    size="sm"
                    variant={minute === m ? 'default' : 'outline'}
                    onClick={() => setMinute(m)}
                  >
                    {m} min
                  </Button>
                ))}
              </div>
            </div>

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
              <Calculator className="h-4 w-4" />
              Calculate APGAR
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6">
            {result !== null ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">APGAR Score ({minute} min)</p>
                <p className="text-6xl font-bold">{result}/10</p>
                <p className={`text-lg font-medium mt-2 ${interpret(result).color}`}>
                  {interpret(result).text}
                </p>
                <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={saveScore} disabled={isSaving}>
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Score'}
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm text-center">
                Rate all 5 criteria and tap Calculate
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
