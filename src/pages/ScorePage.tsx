import { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { useScores } from '../hooks/useScores';
import { useAuth } from '../contexts/AuthContext';

// ── Calculadoras ────────────────────────────────────────────────

interface ScoreCalc {
  id: string;
  name: string;
  description: string;
  fields: { id: string; label: string; min: number; max: number; step?: number }[];
  calc: (values: Record<string, number>) => number;
  interpret: (score: number) => { label: string; color: string };
}

const SCORES: ScoreCalc[] = [
  {
    id: 'das28',
    name: 'DAS28',
    description: 'Disease Activity Score — Artrite Reumatoide (28 articulacoes)',
    fields: [
      { id: 'tjc', label: 'Articulacoes dolorosas (0-28)', min: 0, max: 28 },
      { id: 'sjc', label: 'Articulacoes edemaciadas (0-28)', min: 0, max: 28 },
      { id: 'esr', label: 'VHS mm/h', min: 1, max: 120 },
      { id: 'vas', label: 'VAS paciente (0-100)', min: 0, max: 100 },
    ],
    calc: ({ tjc, sjc, esr, vas }) =>
      parseFloat(
        (0.56 * Math.sqrt(tjc) + 0.28 * Math.sqrt(sjc) + 0.70 * Math.log(esr) + 0.014 * vas).toFixed(2)
      ),
    interpret: (s) => {
      if (s < 2.6) return { label: 'Remissao',        color: 'text-green-600  dark:text-green-400' };
      if (s < 3.2) return { label: 'Baixa atividade', color: 'text-teal-600   dark:text-teal-400' };
      if (s < 5.1) return { label: 'Atividade moderada', color: 'text-orange-500 dark:text-orange-400' };
      return               { label: 'Alta atividade',  color: 'text-red-600    dark:text-red-400' };
    },
  },
  {
    id: 'sdai',
    name: 'SDAI',
    description: 'Simplified Disease Activity Index',
    fields: [
      { id: 'tjc',    label: 'Articulacoes dolorosas (0-28)', min: 0, max: 28 },
      { id: 'sjc',    label: 'Articulacoes edemaciadas (0-28)', min: 0, max: 28 },
      { id: 'vas_p',  label: 'VAS paciente (0-10)', min: 0, max: 10, step: 0.1 },
      { id: 'vas_md', label: 'VAS medico (0-10)', min: 0, max: 10, step: 0.1 },
      { id: 'crp',    label: 'PCR mg/dL', min: 0, max: 20, step: 0.1 },
    ],
    calc: ({ tjc, sjc, vas_p, vas_md, crp }) =>
      parseFloat((tjc + sjc + vas_p + vas_md + crp).toFixed(2)),
    interpret: (s) => {
      if (s <= 3.3)  return { label: 'Remissao',           color: 'text-green-600  dark:text-green-400' };
      if (s <= 11)   return { label: 'Baixa atividade',    color: 'text-teal-600   dark:text-teal-400' };
      if (s <= 26)   return { label: 'Atividade moderada', color: 'text-orange-500 dark:text-orange-400' };
      return                { label: 'Alta atividade',     color: 'text-red-600    dark:text-red-400' };
    },
  },
  {
    id: 'wells_dvt',
    name: 'Wells DVT',
    description: 'Probabilidade pre-teste de Trombose Venosa Profunda',
    fields: [
      { id: 'cancer',     label: 'Cancer ativo (+1)',                     min: 0, max: 1 },
      { id: 'paralysis',  label: 'Paralisia / imobilizacao (+1)',          min: 0, max: 1 },
      { id: 'bedridden',  label: 'Acamado > 3 dias / cirurgia < 12sem (+1)', min: 0, max: 1 },
      { id: 'tenderness', label: 'Dor na veia profunda (+1)',              min: 0, max: 1 },
      { id: 'swelling',   label: 'Edema em toda a perna (+1)',             min: 0, max: 1 },
      { id: 'calf',       label: 'Edema de panturrilha > 3 cm (+1)',       min: 0, max: 1 },
      { id: 'pitting',    label: 'Edema com cacifo (+1)',                  min: 0, max: 1 },
      { id: 'collateral', label: 'Veias superficiais colaterais (+1)',     min: 0, max: 1 },
      { id: 'alt_dx',     label: 'Diagnostico alternativo mais provavel (-2)', min: 0, max: 1 },
    ],
    calc: ({ cancer, paralysis, bedridden, tenderness, swelling, calf, pitting, collateral, alt_dx }) =>
      cancer + paralysis + bedridden + tenderness + swelling + calf + pitting + collateral - (alt_dx * 2),
    interpret: (s) => {
      if (s <= 0)  return { label: 'Baixa probabilidade',  color: 'text-green-600  dark:text-green-400' };
      if (s <= 2)  return { label: 'Moderada probabilidade', color: 'text-orange-500 dark:text-orange-400' };
      return              { label: 'Alta probabilidade',   color: 'text-red-600    dark:text-red-400' };
    },
  },
  {
    id: 'basfi',
    name: 'BASFI',
    description: 'Bath Ankylosing Spondylitis Functional Index (0-10)',
    fields: Array.from({ length: 10 }, (_, i) => ({
      id: `q${i + 1}`,
      label: `Questao ${i + 1} (0-10)`,
      min: 0, max: 10, step: 0.1,
    })),
    calc: (values) => {
      const sum = Object.values(values).reduce((a, b) => a + b, 0);
      return parseFloat((sum / 10).toFixed(2));
    },
    interpret: (s) => {
      if (s <= 2)  return { label: 'Func. preservada', color: 'text-green-600  dark:text-green-400' };
      if (s <= 5)  return { label: 'Func. moderada',   color: 'text-orange-500 dark:text-orange-400' };
      return              { label: 'Func. gravemente comprometida', color: 'text-red-600 dark:text-red-400' };
    },
  },
];

// ── Componente ──────────────────────────────────────────────────

interface ScorePageProps {
  patientId?: string;
  patientName?: string;
}

export function ScorePage({ patientId, patientName }: ScorePageProps) {
  const { user } = useAuth();
  const { saveScore, latestByType } = useScores(patientId ?? '');

  const [activeScore, setActiveScore] = useState<ScoreCalc>(SCORES[0]);
  const [values, setValues] = useState<Record<string, number>>({});
  const [result, setResult] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function getVal(id: string) {
    return values[id] ?? activeScore.fields.find((f) => f.id === id)?.min ?? 0;
  }

  function setVal(id: string, v: number) {
    setValues((prev) => ({ ...prev, [id]: v }));
    setResult(null);
    setSaved(false);
  }

  function calculate() {
    const filled: Record<string, number> = {};
    for (const f of activeScore.fields) filled[f.id] = getVal(f.id);
    setResult(activeScore.calc(filled));
    setSaved(false);
  }

  async function handleSave() {
    if (result === null || !patientId || !user) return;
    setSaving(true);
    const filled: Record<string, number> = {};
    for (const f of activeScore.fields) filled[f.id] = getVal(f.id);
    await saveScore(activeScore.id, result, undefined, filled);
    setSaving(false);
    setSaved(true);
  }

  function switchScore(sc: ScoreCalc) {
    setActiveScore(sc);
    setValues({});
    setResult(null);
    setSaved(false);
  }

  const interpretation = result !== null ? activeScore.interpret(result) : null;
  const latest = patientId ? latestByType(activeScore.id) : null;

  return (
    <AppShell>
      <div className="max-w-2xl space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Calculadoras Clinicas</h1>
          {patientName && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{patientName}</p>
          )}
        </div>

        {/* Selector de score */}
        <div className="flex flex-wrap gap-2">
          {SCORES.map((sc) => (
            <button
              key={sc.id}
              onClick={() => switchScore(sc)}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                activeScore.id === sc.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-teal-300 dark:hover:border-teal-700'
              }`}
            >
              {sc.name}
            </button>
          ))}
        </div>

        {/* Card calculadora */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{activeScore.name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{activeScore.description}</p>
            {latest && (
              <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                Ultimo registro: <strong>{latest.score_value}</strong> · {new Date(latest.created_at).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>

          {/* Campos */}
          <div className="space-y-3 mb-5">
            {activeScore.fields.map((f) => (
              <div key={f.id} className="flex items-center gap-3">
                <label htmlFor={f.id} className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  {f.label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={f.id}
                    type="range"
                    min={f.min}
                    max={f.max}
                    step={f.step ?? 1}
                    value={getVal(f.id)}
                    onChange={(e) => setVal(f.id, parseFloat(e.target.value))}
                    className="w-28 accent-teal-600"
                  />
                  <input
                    type="number"
                    min={f.min}
                    max={f.max}
                    step={f.step ?? 1}
                    value={getVal(f.id)}
                    onChange={(e) => setVal(f.id, Math.min(f.max, Math.max(f.min, parseFloat(e.target.value) || 0)))}
                    className="w-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-sm text-right text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    aria-label={f.label}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Resultado */}
          {result !== null && interpretation && (
            <div className="mb-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Resultado</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{result}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">Interpretacao</p>
                <p className={`text-sm font-semibold ${interpretation.color}`}>{interpretation.label}</p>
              </div>
            </div>
          )}

          {/* Acoes */}
          <div className="flex gap-3">
            <button
              onClick={calculate}
              className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors"
            >
              Calcular
            </button>
            {result !== null && patientId && (
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="px-5 py-2.5 rounded-xl border border-teal-300 dark:border-teal-700 text-teal-600 dark:text-teal-400 text-sm font-medium hover:bg-teal-50 dark:hover:bg-teal-900/20 disabled:opacity-50 transition-colors"
              >
                {saved ? 'Salvo ✓' : saving ? 'Salvando...' : 'Salvar no prontuario'}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default ScorePage;
