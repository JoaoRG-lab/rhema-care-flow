import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Save, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLoginPrompt } from '@/hooks/useLoginPrompt';
import { LoginPromptDialog } from './LoginPromptDialog';

interface DrugPreset {
  id: string;
  name: string;
  mgPerKg: number;
  freq: string;
  maxSingle: number;
  notes?: string;
}

const PRESETS: DrugPreset[] = [
  { id: 'paracetamol', name: 'Paracetamol (oral)', mgPerKg: 15, freq: 'q4–6h', maxSingle: 1000, notes: 'Max 75 mg/kg/day, 4 g/day' },
  { id: 'ibuprofen', name: 'Ibuprofen (oral)', mgPerKg: 10, freq: 'q6–8h', maxSingle: 600, notes: 'Avoid <6 mo; max 40 mg/kg/day' },
  { id: 'amoxicillin', name: 'Amoxicillin (oral)', mgPerKg: 25, freq: 'q8h', maxSingle: 1000, notes: 'Up to 90 mg/kg/day for AOM' },
  { id: 'amoxiclav', name: 'Amoxicillin/clavulanate', mgPerKg: 22.5, freq: 'q12h', maxSingle: 875, notes: 'Component: amoxicillin' },
  { id: 'ceftriaxone', name: 'Ceftriaxone (IV/IM)', mgPerKg: 50, freq: 'q24h', maxSingle: 2000, notes: 'Meningitis: 100 mg/kg/day' },
  { id: 'azithromycin', name: 'Azithromycin (oral)', mgPerKg: 10, freq: 'q24h × 3d', maxSingle: 500 },
  { id: 'salbutamol-neb', name: 'Salbutamol (neb)', mgPerKg: 0.15, freq: 'q20min ×3', maxSingle: 5, notes: 'Min 2.5 mg, max 5 mg' },
  { id: 'prednisolone', name: 'Prednisolone (oral)', mgPerKg: 1, freq: 'q24h', maxSingle: 60, notes: 'Asthma exacerbation 1–2 mg/kg/day' },
  { id: 'epinephrine-im', name: 'Epinephrine 1:1000 (IM)', mgPerKg: 0.01, freq: 'q5–15min', maxSingle: 0.5, notes: 'Anaphylaxis; in mg = mL of 1:1000' },
  { id: 'custom', name: '— Custom drug —', mgPerKg: 0, freq: '', maxSingle: 0 },
];

export function PediatricDoseCalculator() {
  const { user } = useAuth();
  const { showLoginDialog, setShowLoginDialog, requireAuth, goToLogin, goToSignup } = useLoginPrompt();
  const [presetId, setPresetId] = useState<string>('paracetamol');
  const [customName, setCustomName] = useState('');
  const [mgPerKg, setMgPerKg] = useState<number>(15);
  const [maxSingle, setMaxSingle] = useState<number>(1000);
  const [weightKg, setWeightKg] = useState<number>(0);
  const [concentration, setConcentration] = useState<number>(0); // mg per mL (optional)
  const [result, setResult] = useState<{ dose: number; capped: boolean; volumeMl: number | null } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectPreset = (id: string) => {
    setPresetId(id);
    const preset = PRESETS.find((p) => p.id === id);
    if (preset && preset.id !== 'custom') {
      setMgPerKg(preset.mgPerKg);
      setMaxSingle(preset.maxSingle);
      setCustomName('');
    }
  };

  const calculate = () => {
    if (weightKg <= 0) {
      toast.error('Enter patient weight in kg');
      return;
    }
    if (mgPerKg <= 0) {
      toast.error('Enter mg/kg dose');
      return;
    }
    const raw = weightKg * mgPerKg;
    const capped = maxSingle > 0 && raw > maxSingle;
    const dose = capped ? maxSingle : raw;
    const volumeMl = concentration > 0 ? dose / concentration : null;
    setResult({
      dose: Math.round(dose * 100) / 100,
      capped,
      volumeMl: volumeMl !== null ? Math.round(volumeMl * 100) / 100 : null,
    });
  };

  const performSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      const preset = PRESETS.find((p) => p.id === presetId);
      const drugName = presetId === 'custom' ? customName || 'custom drug' : preset?.name || presetId;
      const { error } = await supabase.from('score_entries').insert({
        user_id: user.id,
        score_type: 'Pediatric-Dose',
        data_json: { drugName, weightKg, mgPerKg, maxSingle, concentration, ...result } as any,
        calculated_score: result.dose,
      });
      if (error) throw error;
      toast.success('Dose calculation saved');
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

  const preset = PRESETS.find((p) => p.id === presetId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pediatric Weight-Based Dose</CardTitle>
        <CardDescription>mg/kg dosing with max single-dose safety cap</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertDescription className="text-xs">
            Reference doses for orientation. Always verify with local formulary, contraindications,
            renal/hepatic adjustments, and indication-specific dosing.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>Drug preset</Label>
              <select
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={presetId}
                onChange={(e) => selectPreset(e.target.value)}
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {preset?.notes && (
                <p className="text-xs text-muted-foreground mt-1">{preset.notes}</p>
              )}
              {preset?.freq && (
                <p className="text-xs text-muted-foreground">Frequency: {preset.freq}</p>
              )}
            </div>

            {presetId === 'custom' && (
              <div>
                <Label>Drug name</Label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Cefalexina"
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label>Patient weight (kg)</Label>
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
              <Label>Dose (mg/kg)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={mgPerKg}
                onChange={(e) => setMgPerKg(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Max single dose (mg)</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={maxSingle}
                onChange={(e) => setMaxSingle(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Concentration (mg/mL) — optional</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={concentration}
                onChange={(e) => setConcentration(Number(e.target.value))}
                placeholder="e.g., 50 for amox 250 mg/5 mL"
                className="mt-1"
              />
            </div>

            <Button onClick={calculate} className="w-full gap-2">
              <Calculator className="h-4 w-4" />
              Calculate Dose
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-6">
            {result ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">Single dose</p>
                <p className="text-5xl font-bold">{result.dose} mg</p>
                {result.volumeMl !== null && (
                  <p className="text-lg text-muted-foreground mt-1">≈ {result.volumeMl} mL</p>
                )}
                {result.capped && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Capped at adult maximum single dose ({maxSingle} mg).
                    </AlertDescription>
                  </Alert>
                )}
                <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={saveScore} disabled={isSaving}>
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Calculation'}
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm text-center">
                Pick a drug, enter weight, then calculate
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
