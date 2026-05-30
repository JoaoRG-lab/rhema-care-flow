import { useState } from 'react';
import { useProblemGoals } from '../../hooks/useProblems';
import { useClinicalTimeline } from '../../hooks/useClinicalTimeline';
import type { ProblemInstance } from '../../types';

interface ProblemGoalsPanelProps {
  problem: ProblemInstance;
}

export function ProblemGoalsPanel({ problem }: ProblemGoalsPanelProps) {
  const { goals, loading, addGoal } = useProblemGoals(problem.id);
  const { addEvent } = useClinicalTimeline(problem.patient_id);
  const [goal, setGoal] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAddGoal() {
    if (!goal.trim()) return;
    setSaving(true);
    const { data, error } = await addGoal({ patient_id: problem.patient_id, goal: goal.trim(), target_date: targetDate || null });
    if (!error && data) {
      await addEvent({
        event_type: 'goal',
        title: `Meta criada: ${goal.trim()}`,
        description: `Problema: ${problem.title}`,
        payload: { problem_id: problem.id, goal_id: data.id },
      });
      setGoal('');
      setTargetDate('');
    }
    setSaving(false);
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Metas</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Objetivos terapêuticos</h2>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{goals.length}</span>
      </div>

      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_150px_auto]">
        <input value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Ex.: remissão clínica, DAS28 < 2.6, PA em alvo..." className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800" />
        <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800" />
        <button onClick={handleAddGoal} disabled={saving || !goal.trim()} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{saving ? 'Salvando…' : 'Adicionar'}</button>
      </div>

      <div className="mt-4 space-y-2">
        {loading && <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Carregando metas…</p>}
        {!loading && goals.length === 0 && <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Nenhuma meta registrada.</p>}
        {goals.map((item) => (
          <article key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950/40">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.goal}</h3>
                {item.target_date && <p className="mt-1 text-xs text-gray-500">Alvo: {new Date(item.target_date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>}
              </div>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-900 dark:text-gray-300">{item.status}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
