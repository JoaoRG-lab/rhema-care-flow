import { useState } from 'react';
import { useProblemFollowups } from '../../hooks/useProblems';
import { useClinicalTimeline } from '../../hooks/useClinicalTimeline';
import type { ProblemInstance } from '../../types';

interface ProblemFollowupsPanelProps {
  problem: ProblemInstance;
}

export function ProblemFollowupsPanel({ problem }: ProblemFollowupsPanelProps) {
  const { followups, loading, addFollowup } = useProblemFollowups(problem.id);
  const { addEvent } = useClinicalTimeline(problem.patient_id);
  const [note, setNote] = useState('');
  const [metricKey, setMetricKey] = useState('');
  const [metricValue, setMetricValue] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAddFollowup() {
    if (!note.trim()) return;
    setSaving(true);
    const metrics = metricKey.trim() ? { [metricKey.trim()]: metricValue.trim() } : {};
    const { data, error } = await addFollowup({
      patient_id: problem.patient_id,
      note: note.trim(),
      metrics,
      next_steps: nextSteps.trim() || null,
    });

    if (!error && data) {
      await addEvent({
        event_type: 'followup',
        title: `Follow-up: ${problem.title}`,
        description: note.trim().slice(0, 180),
        payload: { problem_id: problem.id, followup_id: data.id, metrics },
      });
      setNote('');
      setMetricKey('');
      setMetricValue('');
      setNextSteps('');
    }
    setSaving(false);
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Seguimento</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Follow-ups do problema</h2>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{followups.length}</span>
      </div>

      <div className="space-y-2">
        <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="Evolução focada no problema, resposta terapêutica, intercorrências..." className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800" />
        <div className="grid gap-2 md:grid-cols-2">
          <input value={metricKey} onChange={(event) => setMetricKey(event.target.value)} placeholder="Métrica, ex.: DAS28, HbA1c, PA" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800" />
          <input value={metricValue} onChange={(event) => setMetricValue(event.target.value)} placeholder="Valor, ex.: 3.2, 7.1%, 130/80" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800" />
        </div>
        <input value={nextSteps} onChange={(event) => setNextSteps(event.target.value)} placeholder="Próximos passos" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800" />
        <button onClick={handleAddFollowup} disabled={saving || !note.trim()} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{saving ? 'Salvando…' : 'Adicionar follow-up'}</button>
      </div>

      <div className="mt-4 space-y-2">
        {loading && <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Carregando follow-ups…</p>}
        {!loading && followups.length === 0 && <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Nenhum follow-up registrado.</p>}
        {followups.map((item) => (
          <article key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950/40">
            <time className="text-xs text-gray-400" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString('pt-BR')}</time>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-gray-100">{item.note}</p>
            {Object.keys(item.metrics ?? {}).length > 0 && <p className="mt-2 rounded-xl bg-white p-2 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-300">Métricas: {JSON.stringify(item.metrics)}</p>}
            {item.next_steps && <p className="mt-2 rounded-xl bg-teal-50 p-2 text-xs text-teal-800">Próximos passos: {item.next_steps}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
