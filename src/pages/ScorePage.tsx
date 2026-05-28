import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AppShell } from '../components/layout/AppShell';
import { useScores } from '../hooks/useScores';
import { useAuth } from '../contexts/AuthContext';
import {
  clinicalScores,
  createInitialValues,
  severityClass,
  type ClinicalScoreDefinition,
  type ScoreField,
} from '../lib/clinicalScores';

interface ScorePageProps {
  patientId?: string;
  patientName?: string;
}

function clamp(value: number, min = 0, max = Number.POSITIVE_INFINITY) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function fieldValue(field: ScoreField, values: Record<string, number>) {
  return values[field.id] ?? field.options?.[0]?.value ?? field.min ?? 0;
}

function scoreChartData(score: ClinicalScoreDefinition, values: Record<string, number>) {
  return score.fields.map((field) => {
    const value = fieldValue(field, values);
    const max = field.kind === 'select'
      ? Math.max(...(field.options ?? [{ value: 1 }]).map((option) => option.value), 1)
      : field.max ?? Math.max(value, 1);

    return {
      name: field.label.length > 22 ? `${field.label.slice(0, 22)}…` : field.label,
      value,
      normalized: max ? Math.round((value / max) * 100) : 0,
    };
  });
}

function ScoreInput({ field, value, onChange }: { field: ScoreField; value: number; onChange: (value: number) => void }) {
  if (field.kind === 'boolean') {
    return (
      <button
        type="button"
        onClick={() => onChange(value ? 0 : 1)}
        className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
          value ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-gray-200 bg-white text-gray-600 hover:border-teal-200'
        }`}
      >
        {value ? 'Sim' : 'Não'}
      </button>
    );
  }

  if (field.kind === 'select') {
    return (
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-teal-500"
      >
        {(field.options ?? []).map((option) => (
          <option key={`${field.id}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  const min = field.min ?? 0;
  const max = field.max ?? 100;
  const step = field.step ?? 1;

  return (
    <div className="flex items-center gap-3">
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(clamp(Number(event.target.value), min, max))} className="w-full accent-teal-600" />
      <input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(clamp(Number(event.target.value), min, max))} className="w-24 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-right text-sm text-gray-900 outline-none focus:ring-2 focus:ring-teal-500" aria-label={field.label} />
    </div>
  );
}

export function ScorePage({ patientId, patientName }: ScorePageProps) {
  const { user } = useAuth();
  const { scores, saveScore, latestByType } = useScores(patientId ?? '');

  const [activeScore, setActiveScore] = useState<ClinicalScoreDefinition>(clinicalScores[0]);
  const [values, setValues] = useState<Record<string, number>>(() => createInitialValues(clinicalScores[0]));
  const [result, setResult] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const areas = useMemo(() => Array.from(new Set(clinicalScores.map((score) => score.area))), []);
  const chartData = useMemo(() => scoreChartData(activeScore, values), [activeScore, values]);
  const interpretation = result !== null ? activeScore.interpret(result, values) : null;
  const latest = patientId ? latestByType(activeScore.id) : null;
  const trendData = useMemo(() => scores
    .filter((score) => score.score_type === activeScore.id)
    .slice()
    .reverse()
    .map((score) => ({
      date: new Date(score.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: Number(score.score_value),
    })), [scores, activeScore.id]);

  function switchScore(score: ClinicalScoreDefinition) {
    setActiveScore(score);
    setValues(createInitialValues(score));
    setResult(null);
    setSaved(false);
  }

  function updateField(field: ScoreField, value: number) {
    const min = field.min ?? 0;
    const max = field.max ?? Number.POSITIVE_INFINITY;
    setValues((prev) => ({ ...prev, [field.id]: clamp(value, min, max) }));
    setResult(null);
    setSaved(false);
  }

  function calculate() {
    const computed = activeScore.calculate(values);
    setResult(computed);
    setSaved(false);
  }

  async function handleSave() {
    if (result === null || !patientId || !user) return;
    setSaving(true);
    try {
      await saveScore(activeScore.id, result, undefined, values);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-6xl space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">RhemaFlow Clinical Engine</p>
            <h1 className="text-2xl font-bold text-gray-900">Scores, critérios e calculadoras</h1>
            <p className="max-w-3xl text-sm text-gray-500">Calculadoras reumatológicas para apoio longitudinal. Use como ferramenta clínica auxiliar: classificação não substitui diagnóstico, exame físico ou julgamento presencial.</p>
            {patientName && <p className="mt-1 text-sm text-gray-500">Paciente: {patientName}</p>}
          </div>
          {latest && <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800">Último {activeScore.name}: <strong>{latest.score_value}</strong> · {new Date(latest.created_at).toLocaleDateString('pt-BR')}</div>}
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4">
            {areas.map((area) => <div key={area} className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"><h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{area}</h2><div className="space-y-2">{clinicalScores.filter((score) => score.area === area).map((score) => <button key={score.id} onClick={() => switchScore(score)} className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${activeScore.id === score.id ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-50 text-gray-700 hover:bg-teal-50 hover:text-teal-700'}`}><span className="block font-semibold">{score.name}</span><span className={`block text-xs ${activeScore.id === score.id ? 'text-teal-50' : 'text-gray-500'}`}>{score.description}</span></button>)}</div></div>)}
          </aside>

          <main className="space-y-4">
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><h2 className="text-xl font-bold text-gray-900">{activeScore.name}</h2><p className="text-sm text-gray-500">{activeScore.description}</p></div><span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">{activeScore.area}</span></div>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-4">{activeScore.fields.map((field) => { const value = fieldValue(field, values); return <div key={field.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4"><div className="mb-2 flex items-start justify-between gap-3"><div><label className="text-sm font-semibold text-gray-800">{field.label}</label>{field.help && <p className="mt-0.5 text-xs text-gray-500">{field.help}</p>}</div><span className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-gray-700 shadow-sm">{value}</span></div><ScoreInput field={field} value={value} onChange={(next) => updateField(field, next)} /></div>; })}</div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Distribuição dos componentes</p><div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" domain={[0, 100]} hide /><YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} /><Tooltip formatter={(value, _name, item) => [`${item.payload.value}`, 'Valor']} /><Bar dataKey="normalized" radius={[0, 8, 8, 0]} fill="#0d9488" /></BarChart></ResponsiveContainer></div></div>
                  {result !== null && interpretation && <div className={`rounded-2xl border p-4 ${severityClass(interpretation.severity)}`}><p className="text-xs font-semibold uppercase tracking-wide opacity-80">Resultado</p><div className="mt-1 flex items-end justify-between gap-3"><span className="text-4xl font-bold tabular-nums">{result}</span><span className="text-sm font-bold">{interpretation.label}</span></div><p className="mt-3 text-sm leading-relaxed">{interpretation.clinicalNote}</p></div>}
                  <div className="flex gap-3"><button onClick={calculate} className="flex-1 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700">Calcular</button>{result !== null && patientId && <button onClick={handleSave} disabled={saving || saved} className="rounded-2xl border border-teal-300 px-4 py-3 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 disabled:opacity-50">{saved ? 'Salvo ✓' : saving ? 'Salvando…' : 'Salvar'}</button>}</div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-gray-900">Evolução longitudinal</h3><p className="text-xs text-gray-500">Histórico salvo para {activeScore.name}.</p></div><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{trendData.length} registro(s)</span></div>
              {trendData.length >= 2 ? <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={trendData} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => [`${value}`, activeScore.name]} /><Line type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div> : <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">Salve pelo menos dois resultados deste score para visualizar tendência longitudinal.</p>}
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-gray-900">Referências e ressalvas operacionais</h3>
              <ul className="space-y-2 text-sm text-gray-600">{activeScore.references.map((reference) => <li key={reference} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-500" /><span>{reference}</span></li>)}</ul>
              <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">Ferramenta de apoio. Critérios classificatórios não equivalem automaticamente a diagnóstico individual; sempre correlacionar com história, exame, exames complementares e diferenciais.</p>
            </section>
          </main>
        </div>
      </div>
    </AppShell>
  );
}

export default ScorePage;
