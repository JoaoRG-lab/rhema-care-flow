import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

/**
 * Ganho ponderal recomendado na gestação (Institute of Medicine, 2009 — endossado por ACOG).
 * Baseado no IMC pré-gestacional. Valores para gestação única; gemelar usa faixas distintas.
 */

type Cat = 'low' | 'normal' | 'over' | 'obese';

const RANGES: Record<
  Cat,
  { label: string; bmi: string; total: [number, number]; weeklyT2T3: [number, number] }
> = {
  low: { label: 'Baixo peso', bmi: '< 18,5', total: [12.5, 18], weeklyT2T3: [0.44, 0.58] },
  normal: { label: 'Eutrofia', bmi: '18,5–24,9', total: [11.5, 16], weeklyT2T3: [0.35, 0.5] },
  over: { label: 'Sobrepeso', bmi: '25–29,9', total: [7, 11.5], weeklyT2T3: [0.23, 0.33] },
  obese: { label: 'Obesidade', bmi: '≥ 30', total: [5, 9], weeklyT2T3: [0.17, 0.27] },
};

function classify(bmi: number): Cat {
  if (bmi < 18.5) return 'low';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'over';
  return 'obese';
}

export function PregnancyBMICalculator() {
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [currentWeight, setCurrentWeight] = useState<string>('');
  const [weeks, setWeeks] = useState<string>('');

  const result = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h || h < 1 || h > 2.3) return null;
    const bmi = w / (h * h);
    const cat = classify(bmi);
    const range = RANGES[cat];
    const cw = parseFloat(currentWeight);
    const ga = parseFloat(weeks);
    const gainSoFar = cw && cw > 0 ? cw - w : null;
    let expected: [number, number] | null = null;
    if (ga && ga >= 13 && ga <= 41) {
      // 0,5–2 kg no 1º tri + ganho semanal × (semanas − 13)
      const firstTri = cat === 'low' ? 2 : cat === 'normal' ? 1.6 : cat === 'over' ? 1 : 0.5;
      const w2 = ga - 13;
      expected = [firstTri + range.weeklyT2T3[0] * w2, firstTri + range.weeklyT2T3[1] * w2];
    }
    return { bmi, cat, range, gainSoFar, expected };
  }, [weight, height, currentWeight, weeks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>IMC e Ganho Ponderal na Gestação</CardTitle>
        <CardDescription>
          Faixas recomendadas pelo IOM (2009) para gestação única, conforme IMC pré-gestacional.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <Label htmlFor="w">Peso pré-gestacional (kg)</Label>
              <Input id="w" type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="h">Altura (m)</Label>
              <Input id="h" type="number" step="0.01" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} />
            </div>
            <div className="pt-2 border-t">
              <Label htmlFor="cw">Peso atual (kg) — opcional</Label>
              <Input id="cw" type="number" inputMode="decimal" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ga">Idade gestacional atual (semanas) — opcional</Label>
              <Input id="ga" type="number" inputMode="decimal" value={weeks} onChange={(e) => setWeeks(e.target.value)} />
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 text-sm">
            {!result && <p className="text-muted-foreground text-center">Informe peso pré-gestacional e altura.</p>}
            {result && (
              <>
                <p className="text-muted-foreground">IMC pré-gestacional</p>
                <p className="text-4xl font-bold">{result.bmi.toFixed(1)} kg/m²</p>
                <p className="mt-1">
                  <span className="font-semibold">{result.range.label}</span>{' '}
                  <span className="text-muted-foreground">(IMC {result.range.bmi})</span>
                </p>
                <div className="mt-4 space-y-2">
                  <p>
                    Ganho total recomendado:{' '}
                    <span className="font-semibold">
                      {result.range.total[0]}–{result.range.total[1]} kg
                    </span>
                  </p>
                  <p>
                    Ganho semanal (2º/3º tri):{' '}
                    <span className="font-semibold">
                      {result.range.weeklyT2T3[0]}–{result.range.weeklyT2T3[1]} kg/sem
                    </span>
                  </p>
                  {result.gainSoFar !== null && (
                    <p>
                      Ganho até agora: <span className="font-semibold">{result.gainSoFar.toFixed(1)} kg</span>
                    </p>
                  )}
                  {result.expected && (
                    <p>
                      Esperado para a IG: <span className="font-semibold">{result.expected[0].toFixed(1)}–{result.expected[1].toFixed(1)} kg</span>
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
