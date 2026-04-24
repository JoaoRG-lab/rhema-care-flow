import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

/**
 * Simplified WHO/CDC weight-for-age and height-for-age z-score estimator.
 * Uses age-banded median (M) and approximate SD (sigma) values for boys & girls (0–19y).
 * NOT a substitute for full LMS lookup — intended for bedside orientation only.
 */

type Sex = 'M' | 'F';

// Median weight (kg) by age in months — pooled WHO 0–60mo + CDC 5–19y, simplified.
const WEIGHT_MEDIAN: Record<Sex, [number, number][]> = {
  M: [
    [0, 3.3], [1, 4.5], [3, 6.4], [6, 7.9], [12, 9.6], [24, 12.2], [36, 14.3],
    [48, 16.3], [60, 18.3], [84, 22.9], [108, 28.1], [132, 34.4], [156, 45.3],
    [180, 56.0], [204, 65.0], [228, 70.0],
  ],
  F: [
    [0, 3.2], [1, 4.2], [3, 5.8], [6, 7.3], [12, 8.9], [24, 11.5], [36, 13.9],
    [48, 15.9], [60, 17.9], [84, 22.4], [108, 27.9], [132, 36.9], [156, 47.6],
    [180, 53.5], [204, 56.0], [228, 58.0],
  ],
};
// Approximate SD as fraction of median (~12% — clinically usable rough fit).
const WEIGHT_SD_FRAC = 0.12;

// Median height (cm) by age in months.
const HEIGHT_MEDIAN: Record<Sex, [number, number][]> = {
  M: [
    [0, 49.9], [1, 54.7], [3, 61.4], [6, 67.6], [12, 75.7], [24, 87.8], [36, 96.1],
    [48, 103.3], [60, 110.0], [84, 121.9], [108, 133.3], [132, 143.8], [156, 156.0],
    [180, 169.5], [204, 175.7], [228, 177.0],
  ],
  F: [
    [0, 49.1], [1, 53.7], [3, 59.8], [6, 65.7], [12, 74.0], [24, 86.4], [36, 95.1],
    [48, 102.7], [60, 109.4], [84, 121.1], [108, 132.5], [132, 144.5], [156, 157.1],
    [180, 162.5], [204, 163.5], [228, 163.7],
  ],
};
const HEIGHT_SD_FRAC = 0.045;

function interpolate(table: [number, number][], ageMonths: number): number {
  if (ageMonths <= table[0][0]) return table[0][1];
  if (ageMonths >= table[table.length - 1][0]) return table[table.length - 1][1];
  for (let i = 1; i < table.length; i++) {
    const [a1, v1] = table[i - 1];
    const [a2, v2] = table[i];
    if (ageMonths >= a1 && ageMonths <= a2) {
      const t = (ageMonths - a1) / (a2 - a1);
      return v1 + t * (v2 - v1);
    }
  }
  return table[table.length - 1][1];
}

// Standard normal CDF (Abramowitz & Stegun approximation).
function normCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

function classifyZ(z: number, kind: 'weight' | 'height'): { text: string; color: string } {
  if (z < -3) return { text: kind === 'weight' ? 'Severe underweight' : 'Severe stunting', color: 'text-destructive' };
  if (z < -2) return { text: kind === 'weight' ? 'Underweight' : 'Stunted', color: 'text-warning' };
  if (z <= 1) return { text: 'Within normal range', color: 'text-success' };
  if (z <= 2) return { text: kind === 'weight' ? 'Risk of overweight' : 'Tall stature', color: 'text-info' };
  if (z <= 3) return { text: kind === 'weight' ? 'Overweight' : 'Very tall stature', color: 'text-warning' };
  return { text: kind === 'weight' ? 'Obesity' : 'Extreme tall stature', color: 'text-destructive' };
}

export function WHOGrowthCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [sex, setSex] = useState<Sex>('M');
  const [ageMonths, setAgeMonths] = useState<number>(12);
  const [weightKg, setWeightKg] = useState<number>(0);
  const [heightCm, setHeightCm] = useState<number>(0);
  const [result, setResult] = useState<{
    wZ: number; wPct: number; hZ: number; hPct: number; bmi: number | null;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const calculate = () => {
    if (ageMonths < 0 || ageMonths > 240) {
      toast.error('Age must be 0–240 months (0–20 years)');
      return;
    }
    const wM = interpolate(WEIGHT_MEDIAN[sex], ageMonths);
    const hM = interpolate(HEIGHT_MEDIAN[sex], ageMonths);
    const wZ = weightKg > 0 ? (weightKg - wM) / (wM * WEIGHT_SD_FRAC) : 0;
    const hZ = heightCm > 0 ? (heightCm - hM) / (hM * HEIGHT_SD_FRAC) : 0;
    const bmi = weightKg > 0 && heightCm > 0 ? weightKg / Math.pow(heightCm / 100, 2) : null;
    setResult({
      wZ: Math.round(wZ * 100) / 100,
      wPct: Math.round(normCdf(wZ) * 1000) / 10,
      hZ: Math.round(hZ * 100) / 100,
      hPct: Math.round(normCdf(hZ) * 1000) / 10,
      bmi: bmi !== null ? Math.round(bmi * 10) / 10 : null,
    });
  };

  const performSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('score_entries').insert({
        user_id: user.id,
        score_type: 'WHO-Growth',
        data_json: { sex, ageMonths, weightKg, heightCm, ...result } as any,
        calculated_score: result.wZ,
      });
      if (error) throw error;
      toast.success('Growth assessment saved');
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const saveScore = () => {
    if (!result) return;
    if (!requireAuth(performSave)) return;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>WHO Growth Estimator</CardTitle>
        <CardDescription>
          Approximate weight & height z-scores and percentiles by age
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription className="text-xs">
            Bedside orientation only. Uses simplified WHO/CDC reference medians with approximate SD;
            confirm critical decisions with full LMS-based percentile charts.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>Sex</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  size="sm"
                  variant={sex === 'M' ? 'default' : 'outline'}
                  onClick={() => setSex('M')}
                >
                  Male
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={sex === 'F' ? 'default' : 'outline'}
                  onClick={() => setSex('F')}
                >
                  Female
                </Button>
              </div>
            </div>
            <div>
              <Label>Age (months)</Label>
              <Input
                type="number"
                min={0}
                max={240}
                value={ageMonths}
                onChange={(e) => setAgeMonths(Number(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {(ageMonths / 12).toFixed(1)} years
              </p>
            </div>
            <div>
              <Label>Weight (kg)</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Height / Length (cm)</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <Button onClick={calculate} className="w-full gap-2">
              <Calculator className="h-4 w-4" />
              Calculate Z-scores
            </Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            {result ? (
              <>
                {weightKg > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Weight-for-age</p>
                    <p className="text-3xl font-bold">z = {result.wZ}</p>
                    <p className="text-sm text-muted-foreground">≈ p{result.wPct}</p>
                    <p className={`text-sm font-medium ${classifyZ(result.wZ, 'weight').color}`}>
                      {classifyZ(result.wZ, 'weight').text}
                    </p>
                  </div>
                )}
                {heightCm > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Height-for-age</p>
                    <p className="text-3xl font-bold">z = {result.hZ}</p>
                    <p className="text-sm text-muted-foreground">≈ p{result.hPct}</p>
                    <p className={`text-sm font-medium ${classifyZ(result.hZ, 'height').color}`}>
                      {classifyZ(result.hZ, 'height').text}
                    </p>
                  </div>
                )}
                {result.bmi !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground">BMI</p>
                    <p className="text-2xl font-bold">{result.bmi} kg/m²</p>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={saveScore} disabled={isSaving}>
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Assessment'}
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm text-center">
                Enter sex, age, weight and/or height
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
