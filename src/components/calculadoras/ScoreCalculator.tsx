/**
 * ScoreCalculator — Componente React reutilizável
 * [PERPLEXITY] feat/perplexity-calculadoras-scores
 *
 * Renderiza dinamicamente qualquer calculadora do SCORE_CATALOG.
 * Uso:
 *   <ScoreCalculator scoreId="das28-crp" />
 *   <ScoreCalculator scoreId="sledai2k" />
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  calcDAS28, DAS28Input,
  calcSDAI, SDAIInput,
  calcCDAI, CDAIInput,
  calcSLEDAI2K, SLEDAI2KInput,
  calcBASDAI, BASDAIInput,
  calcASDAS_CRP, ASDASInput,
  calcFRAXRiskCategory, FRAXInput,
  ScoreResult,
} from '@/data/calculadoras/rheumatology-scores';

// ─── Mapa de campos por score ─────────────────────────────────────────────────

type FieldDef =
  | { type: 'number'; key: string; label: string; min: number; max: number; step?: number; unit?: string }
  | { type: 'boolean'; key: string; label: string }
  | { type: 'select'; key: string; label: string; options: { value: string; label: string }[] };

const DAS28_CRP_FIELDS: FieldDef[] = [
  { type: 'number', key: 'tjc',       label: 'Articulações dolorosas (0–28)',  min: 0, max: 28 },
  { type: 'number', key: 'sjc',       label: 'Articulações edemaciadas (0–28)', min: 0, max: 28 },
  { type: 'number', key: 'pga',       label: 'Avaliação global do paciente (VAS 0–100 mm)', min: 0, max: 100 },
  { type: 'number', key: 'reactant',  label: 'PCR (mg/L)', min: 0, max: 500, step: 0.1, unit: 'mg/L' },
  { type: 'select', key: 'reactantType', label: 'Reagente de fase aguda',
    options: [{ value: 'crp', label: 'PCR' }, { value: 'esr', label: 'VHS' }] },
];

const SDAI_FIELDS: FieldDef[] = [
  { type: 'number', key: 'tjc',          label: 'Articulações dolorosas (0–28)',     min: 0, max: 28 },
  { type: 'number', key: 'sjc',          label: 'Articulações edemaciadas (0–28)',   min: 0, max: 28 },
  { type: 'number', key: 'pgaPatient',   label: 'Avaliação global paciente (0–10 cm VAS)', min: 0, max: 10, step: 0.5 },
  { type: 'number', key: 'pgaEvaluator', label: 'Avaliação global médico (0–10 cm VAS)',   min: 0, max: 10, step: 0.5 },
  { type: 'number', key: 'crp',          label: 'PCR (mg/dL)',                       min: 0, max: 50, step: 0.1, unit: 'mg/dL' },
];

const CDAI_FIELDS: FieldDef[] = [
  { type: 'number', key: 'tjc',          label: 'Articulações dolorosas (0–28)',    min: 0, max: 28 },
  { type: 'number', key: 'sjc',          label: 'Articulações edemaciadas (0–28)',  min: 0, max: 28 },
  { type: 'number', key: 'pgaPatient',   label: 'Avaliação global paciente (0–10)', min: 0, max: 10, step: 0.5 },
  { type: 'number', key: 'pgaEvaluator', label: 'Avaliação global médico (0–10)',   min: 0, max: 10, step: 0.5 },
];

const SLEDAI_FIELDS: FieldDef[] = [
  { type: 'boolean', key: 'seizure',               label: 'Convulsão (×8)' },
  { type: 'boolean', key: 'psychosis',              label: 'Psicose (×8)' },
  { type: 'boolean', key: 'organic_brain_syndrome', label: 'Síndrome orgânica cerebral (×8)' },
  { type: 'boolean', key: 'visual_disturbance',     label: 'Distúrbio visual (×8)' },
  { type: 'boolean', key: 'cranial_nerve_disorder', label: 'Neuropatia de nervo craniano (×8)' },
  { type: 'boolean', key: 'lupus_headache',         label: 'Cefaleia lúpica (×8)' },
  { type: 'boolean', key: 'cva',                   label: 'AVC (×8)' },
  { type: 'boolean', key: 'vasculitis',             label: 'Vasculite (×8)' },
  { type: 'boolean', key: 'arthritis',              label: 'Artrite (×4)' },
  { type: 'boolean', key: 'myositis',               label: 'Miosite (×4)' },
  { type: 'boolean', key: 'urinary_casts',          label: 'Cilindros urinários (×4)' },
  { type: 'boolean', key: 'hematuria',              label: 'Hematúria (×4)' },
  { type: 'boolean', key: 'proteinuria',            label: 'Proteinúria >0,5g/24h (×4)' },
  { type: 'boolean', key: 'pyuria',                 label: 'Piúria (×4)' },
  { type: 'boolean', key: 'rash',                   label: 'Rash (×2)' },
  { type: 'boolean', key: 'alopecia',               label: 'Alopecia (×2)' },
  { type: 'boolean', key: 'mucosal_ulcers',         label: 'Úlceras mucosas (×2)' },
  { type: 'boolean', key: 'pleurisy',               label: 'Pleurite (×2)' },
  { type: 'boolean', key: 'pericarditis',           label: 'Pericardite (×2)' },
  { type: 'boolean', key: 'low_complement',         label: 'Complemento baixo (×2)' },
  { type: 'boolean', key: 'increased_dna_binding',  label: 'Anti-DNA aumentado (×2)' },
  { type: 'boolean', key: 'fever',                  label: 'Febre >38°C (×1)' },
  { type: 'boolean', key: 'thrombocytopenia',       label: 'Trombocitopenia <100k (×1)' },
  { type: 'boolean', key: 'leukopenia',             label: 'Leucopenia <3k (×1)' },
];

const BASDAI_FIELDS: FieldDef[] = [
  { type: 'number', key: 'q1_fatigue',                     label: 'Fadiga (0–10)',                           min: 0, max: 10, step: 0.5 },
  { type: 'number', key: 'q2_spinal_pain',                  label: 'Dor na coluna (0–10)',                    min: 0, max: 10, step: 0.5 },
  { type: 'number', key: 'q3_peripheral_pain',              label: 'Dor articular periférica (0–10)',          min: 0, max: 10, step: 0.5 },
  { type: 'number', key: 'q4_enthesitis',                   label: 'Entesite (0–10)',                         min: 0, max: 10, step: 0.5 },
  { type: 'number', key: 'q5_morning_stiffness_severity',   label: 'Intensidade da rigidez matinal (0–10)',   min: 0, max: 10, step: 0.5 },
  { type: 'number', key: 'q6_morning_stiffness_duration',   label: 'Duração da rigidez matinal (0–10)',       min: 0, max: 10, step: 0.5 },
];

const ASDAS_FIELDS: FieldDef[] = [
  { type: 'number', key: 'back_pain',                 label: 'Dor lombar (0–10)',                  min: 0, max: 10, step: 0.5 },
  { type: 'number', key: 'morning_stiffness_duration', label: 'Duração rigidez matinal (0–10)',    min: 0, max: 10, step: 0.5 },
  { type: 'number', key: 'patient_global',             label: 'Avaliação global do paciente (0–10)', min: 0, max: 10, step: 0.5 },
  { type: 'number', key: 'peripheral_pain',            label: 'Dor/edema periférico (0–10)',       min: 0, max: 10, step: 0.5 },
  { type: 'number', key: 'crp',                        label: 'PCR (mg/L)',                        min: 0, max: 300, step: 0.1, unit: 'mg/L' },
];

const FRAX_FIELDS: FieldDef[] = [
  { type: 'number',  key: 'age',                    label: 'Idade (anos)',      min: 40, max: 90 },
  { type: 'select',  key: 'sex',                    label: 'Sexo',
    options: [{ value: 'F', label: 'Feminino' }, { value: 'M', label: 'Masculino' }] },
  { type: 'number',  key: 'bmi',                    label: 'IMC (kg/m²)',       min: 10, max: 60, step: 0.1 },
  { type: 'boolean', key: 'previous_fracture',      label: 'Fratura prévia por fragilidade' },
  { type: 'boolean', key: 'parent_hip_fracture',    label: 'Fratura de quadril nos pais' },
  { type: 'boolean', key: 'current_smoker',         label: 'Tabagismo atual' },
  { type: 'boolean', key: 'glucocorticoids',        label: 'Corticoterapia (≥5mg prednisona/dia ≥3 meses)' },
  { type: 'boolean', key: 'rheumatoid_arthritis',   label: 'Artrite Reumatoide' },
  { type: 'boolean', key: 'secondary_osteoporosis', label: 'Osteoporose secundária' },
  { type: 'boolean', key: 'alcohol_3_or_more',      label: 'Álcool ≥3 doses/dia' },
];

// ─── Mapa scoreId → configuração ─────────────────────────────────────────────

const SCORE_CONFIG: Record<string, {
  title: string;
  disease: string;
  fields: FieldDef[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  calculate: (values: any) => ScoreResult | ReturnType<typeof calcFRAXRiskCategory>;
}> = {
  'das28-crp': { title: 'DAS28-PCR', disease: 'Artrite Reumatoide', fields: DAS28_CRP_FIELDS, calculate: calcDAS28 },
  'das28-esr': { title: 'DAS28-VHS', disease: 'Artrite Reumatoide', fields: DAS28_CRP_FIELDS, calculate: (v: DAS28Input) => calcDAS28({ ...v, reactantType: 'esr' }) },
  'sdai':      { title: 'SDAI',      disease: 'Artrite Reumatoide', fields: SDAI_FIELDS,     calculate: (v: SDAIInput) => calcSDAI(v) },
  'cdai':      { title: 'CDAI',      disease: 'Artrite Reumatoide', fields: CDAI_FIELDS,     calculate: (v: CDAIInput) => calcCDAI(v) },
  'sledai2k':  { title: 'SLEDAI-2K', disease: 'Lúpus Eritematoso',  fields: SLEDAI_FIELDS,   calculate: (v: SLEDAI2KInput) => calcSLEDAI2K(v) },
  'basdai':    { title: 'BASDAI',    disease: 'Espondiloartrite',    fields: BASDAI_FIELDS,   calculate: (v: BASDAIInput) => calcBASDAI(v) },
  'asdas-crp': { title: 'ASDAS-PCR', disease: 'Espondiloartrite',    fields: ASDAS_FIELDS,    calculate: (v: ASDASInput) => calcASDAS_CRP(v) },
  'frax':      { title: 'FRAX (triagem)', disease: 'Osteoporose',    fields: FRAX_FIELDS,     calculate: (v: FRAXInput) => calcFRAXRiskCategory(v) },
};

// ─── Helpers de cor ───────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  green:  'bg-green-50 border-green-200 text-green-800',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  orange: 'bg-orange-50 border-orange-200 text-orange-800',
  red:    'bg-red-50 border-red-200 text-red-800',
};

const BADGE_MAP: Record<string, string> = {
  green:  'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  orange: 'bg-orange-100 text-orange-800',
  red:    'bg-red-100 text-red-800',
};

// ─── Componente principal ─────────────────────────────────────────────────────

interface ScoreCalculatorProps {
  scoreId: string;
  className?: string;
}

export default function ScoreCalculator({ scoreId, className = '' }: ScoreCalculatorProps) {
  const config = SCORE_CONFIG[scoreId];

  const initialValues = config.fields.reduce<Record<string, number | string | boolean>>((acc, f) => {
    if (f.type === 'number') acc[f.key] = 0;
    else if (f.type === 'boolean') acc[f.key] = false;
    else if (f.type === 'select') acc[f.key] = f.options[0].value;
    return acc;
  }, {});

  const [values, setValues] = useState<Record<string, number | string | boolean>>(initialValues);
  const [result, setResult] = useState<ScoreResult | ReturnType<typeof calcFRAXRiskCategory> | null>(null);

  if (!config) {
    return <Alert><AlertDescription>Score <code>{scoreId}</code> não encontrado.</AlertDescription></Alert>;
  }

  const handleCalculate = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = config.calculate(values as any);
      setResult(res);
    } catch (e) {
      console.error('Erro ao calcular score:', e);
    }
  };

  const handleReset = () => {
    setValues(initialValues);
    setResult(null);
  };

  const isFRAX = scoreId === 'frax';

  return (
    <Card className={`w-full max-w-2xl ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-semibold">{config.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{config.disease}</p>
          </div>
          <Badge variant="outline" className="shrink-0 text-xs">[PERPLEXITY]</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Campos do formulário */}
        <div className="grid gap-3">
          {config.fields.map((field) => (
            <div key={field.key} className="space-y-1">
              <Label htmlFor={field.key} className="text-sm">{field.label}</Label>

              {field.type === 'number' && (
                <div className="flex items-center gap-2">
                  <Input
                    id={field.key}
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step ?? 1}
                    value={values[field.key] as number}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.key]: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-28"
                  />
                  {field.unit && <span className="text-xs text-muted-foreground">{field.unit}</span>}
                </div>
              )}

              {field.type === 'boolean' && (
                <Switch
                  id={field.key}
                  checked={values[field.key] as boolean}
                  onCheckedChange={(checked) =>
                    setValues((v) => ({ ...v, [field.key]: checked }))
                  }
                />
              )}

              {field.type === 'select' && (
                <select
                  id={field.key}
                  value={values[field.key] as string}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  className="border rounded px-2 py-1 text-sm bg-background"
                >
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>

        {/* Botões */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleCalculate} className="flex-1">Calcular</Button>
          <Button onClick={handleReset} variant="outline">Limpar</Button>
        </div>

        {/* Resultado */}
        {result && (
          <div className={`mt-4 rounded-lg border p-4 ${
            COLOR_MAP[(result as ScoreResult).color ?? (isFRAX ? (result as ReturnType<typeof calcFRAXRiskCategory>).color : 'green')]
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xl">
                {'score' in result ? result.score : ''}
              </span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                BADGE_MAP[(result as ScoreResult).color ?? (result as ReturnType<typeof calcFRAXRiskCategory>).color]
              }`}>
                {'label' in result ? result.label : ''}
              </span>
            </div>
            <p className="text-sm">
              {'description' in result ? result.description : ''}
            </p>
            {'reference' in result && result.reference && (
              <p className="text-xs mt-2 opacity-70">Ref: {result.reference}</p>
            )}
            {isFRAX && (result as ReturnType<typeof calcFRAXRiskCategory>).referToFRAX && (
              <p className="text-xs mt-2 font-medium">
                ⚠️ Para risco preciso, use o calculador oficial:{' '}
                <a href="https://www.sheffield.ac.uk/FRAX/" target="_blank" rel="noopener noreferrer"
                   className="underline">sheffield.ac.uk/FRAX</a>
              </p>
            )}
          </div>
        )}

        {/* Aviso clínico */}
        <p className="text-xs text-muted-foreground border-t pt-3">
          ⚕️ Esta calculadora é uma ferramenta de apoio clínico. Não substitui julgamento médico individualizado.
        </p>
      </CardContent>
    </Card>
  );
}
