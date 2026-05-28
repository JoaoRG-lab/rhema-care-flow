import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

export function DAS28Calculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [tjc, setTjc] = useState<number>(0);
  const [sjc, setSjc] = useState<number>(0);
  const [esr, setEsr] = useState<number>(1);
  const [globalHealth, setGlobalHealth] = useState<number>(0);
  const [result, setResult] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const calculate = () => {
    // Guard against Math.log(0) = -Infinity when ESR is 0 or negative
    const safeEsr = Math.max(esr, 1);
    const score =
      0.56 * Math.sqrt(tjc) +
      0.28 * Math.sqrt(sjc) +
      0.70 * Math.log(safeEsr) +
      0.014 * globalHealth;
    setResult(Math.round(score * 100) / 100);
  };

  const saveScore = async () => {
    if (result === null) return;
    if (!requireAuth(() => performSave())) return;
  };

  const performSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('score_entries').insert({
        user_id: user.id,
        score_type: 'DAS28-ESR',
        data_json: { tjc, sjc, esr, globalHealth },
        calculated_score: result,
      });
      if (error) throw error;
      toast.success('DAS28-ESR score saved');
    } catch (error) {
      console.error('Error saving score:', error);
      toast.error('Failed to save score');
    } finally {
      setIsSaving(false);
    }
  };

  const getInterpretation = (score: number) => {
    if (score < 2.6) return { text: 'Remission', color: 'text-green-600 dark:text-green-400' };
    if (score < 3.2) return { text: 'Low Disease Activity', color: 'text-sky-600 dark:text-sky-400' };
    if (score <= 5.1) return { text: 'Moderate Disease Activity', color: 'text-amber-600 dark:text-amber-400' };
    return { text: 'High Disease Activity', color: 'text-destructive' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>DAS28-ESR Calculator</CardTitle>
        <CardDescription>Disease Activity Score for Rheumatoid Arthritis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>Tender Joint Count (TJC28)</Label>
              <Input
                type="number"
                min={0}
                max={28}
                value={tjc}
                onChange={(e) => setTjc(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Swollen Joint Count (SJC28)</Label>
              <Input
                type="number"
                min={0}
                max={28}
                value={sjc}
                onChange={(e) => setSjc(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>ESR (mm/h)</Label>
              <Input
                type="number"
                min={1}
                value={esr}
                onChange={(e) => setEsr(Math.max(1, Number(e.target.value)))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Patient Global Health (0-100 VAS)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={globalHealth}
                onChange={(e) => setGlobalHealth(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <Button onClick={calculate} className="w-full gap-2">
              <Calculator className="h-4 w-4" />
              Calculate DAS28
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6">
            {result !== null ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">DAS28-ESR Score</p>
                <p className="text-5xl font-bold text-foreground">{result}</p>
                <p className={`text-lg font-medium mt-2 ${getInterpretation(result).color}`}>
                  {getInterpretation(result).text}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2"
                  onClick={saveScore}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Score'}
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">Enter values and calculate</p>
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
