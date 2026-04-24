import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * Triagem de risco para pré-eclâmpsia (ACOG / USPSTF / FEBRASGO).
 * - 1+ fator de alto risco => risco aumentado, profilaxia com AAS 100–150 mg/dia
 *   iniciada entre 12–16 semanas e mantida até 36 semanas.
 * - ≥ 2 fatores de risco moderado => mesma recomendação.
 * - Caso contrário => risco basal, sem profilaxia indicada.
 */

const HIGH_RISK = [
  { key: 'prev_pe', label: 'Pré-eclâmpsia em gestação anterior (especialmente precoce ou com prematuridade)' },
  { key: 'multifetal', label: 'Gestação múltipla' },
  { key: 'chronic_htn', label: 'Hipertensão arterial crônica' },
  { key: 'dm', label: 'Diabetes pré-gestacional (tipo 1 ou 2)' },
  { key: 'ckd', label: 'Doença renal crônica' },
  { key: 'autoimmune', label: 'Doença autoimune (LES, SAF)' },
];

const MODERATE_RISK = [
  { key: 'nullipara', label: 'Nuliparidade' },
  { key: 'obesity', label: 'Obesidade (IMC ≥ 30)' },
  { key: 'family_pe', label: 'História familiar de pré-eclâmpsia (mãe ou irmã)' },
  { key: 'age35', label: 'Idade ≥ 35 anos' },
  { key: 'sociodemo', label: 'Fatores sociodemográficos (baixa renda, etnia)' },
  { key: 'history', label: 'Antecedente de RCIU, descolamento ou natimorto' },
  { key: 'interval10', label: 'Intervalo interpartal > 10 anos' },
];

export function PreeclampsiaRiskCalculator() {
  const [high, setHigh] = useState<Record<string, boolean>>({});
  const [moderate, setModerate] = useState<Record<string, boolean>>({});

  const result = useMemo(() => {
    const highCount = Object.values(high).filter(Boolean).length;
    const modCount = Object.values(moderate).filter(Boolean).length;
    let level: 'alto' | 'moderado' | 'basal' = 'basal';
    if (highCount >= 1) level = 'alto';
    else if (modCount >= 2) level = 'moderado';
    const recommendAspirin = level !== 'basal';
    return { highCount, modCount, level, recommendAspirin };
  }, [high, moderate]);

  const reset = () => {
    setHigh({});
    setModerate({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risco de Pré-eclâmpsia</CardTitle>
        <CardDescription>
          Triagem baseada em fatores clínicos (ACOG 2018 / USPSTF / FEBRASGO).
          Profilaxia com AAS deve ser considerada conforme estratificação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <h4 className="font-semibold text-sm mb-2">Fatores de alto risco (1 já indica profilaxia)</h4>
              <div className="space-y-2">
                {HIGH_RISK.map((f) => (
                  <label key={f.key} className="flex items-start gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={!!high[f.key]}
                      onCheckedChange={(v) => setHigh((s) => ({ ...s, [f.key]: !!v }))}
                    />
                    <span>{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Fatores de risco moderado (≥ 2 indicam profilaxia)</h4>
              <div className="space-y-2">
                {MODERATE_RISK.map((f) => (
                  <label key={f.key} className="flex items-start gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={!!moderate[f.key]}
                      onCheckedChange={(v) => setModerate((s) => ({ ...s, [f.key]: !!v }))}
                    />
                    <span>{f.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>Limpar</Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground mb-2">Estratificação</p>
            <p
              className={
                'text-3xl font-bold capitalize ' +
                (result.level === 'alto'
                  ? 'text-destructive'
                  : result.level === 'moderado'
                    ? 'text-warning'
                    : 'text-success')
              }
            >
              Risco {result.level}
            </p>
            <p className="text-sm mt-2">
              Alto: {result.highCount} · Moderado: {result.modCount}
            </p>
            <div className="mt-4 text-sm">
              {result.recommendAspirin ? (
                <p>
                  <span className="font-semibold">Profilaxia recomendada:</span> AAS 100–150 mg/dia,
                  iniciar entre <strong>12–16 semanas</strong> e manter até <strong>36 semanas</strong>.
                </p>
              ) : (
                <p>Sem indicação de profilaxia farmacológica nesta triagem.</p>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-4">
              Decisão final é clínica. Considerar Doppler de a. uterinas e PlGF quando disponíveis.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
