import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getScoreDefinitionsForProblem } from '../../lib/problemScoreRegistry';
import type { ProblemInstance, ScoreEntry } from '../../types';

interface ProblemOutcomePanelProps {
  problem: ProblemInstance;
  patientId: string;
}

function trendLabel(entries: ScoreEntry[]) {
  if (entries.length < 2) return { label: 'Sem tendência', helper: 'Salve pelo menos dois registros.', delta: null as number | null };
  const latest = entries[0];
  const previous = entries[1];
  const delta = Number(latest.score_value) - Number(previous.score_value);
  if (delta === 0) return { label: 'Estável', helper: 'Sem variação desde o registro anterior.', delta };
  if (delta < 0) return { label: 'Redução', helper: 'Score menor que o registro anterior.', delta };
  return { label: 'Aumento', helper: 'Score maior que o registro anterior.', delta };
}

export function ProblemOutcomePanel({ problem, patientId }: ProblemOutcomePanelProps) {
  const scoreDefinitions = useMemo(() => getScoreDefinitionsForProblem(problem.template_id, problem.title), [problem.template_id, problem.title]);
  const [entries, setEntries] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(Boolean(patientId && problem.id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOutcomes() {
      if (!patientId || !problem.id || scoreDefinitions.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const { data, error: qErr } = await supabase
        .from('score_entries')
        .select('*')
        .eq('patient_id', patientId)
        .in('score_type', scoreDefinitions.map((score) => score.id))
        .order('created_at', { ascending: false });
      if (qErr) setError(qErr.message);
      const filtered = ((data ?? []) as ScoreEntry[]).filter((entry) => entry.metadata?.problem_id === problem.id);
      setEntries(filtered);
      setLoading(false);
    }
    loadOutcomes();
  }, [patientId, problem.id, scoreDefinitions]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Outcomes</p>
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Desfechos por score</h2>
        </div>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">{entries.length}</span>
      </div>

      {loading && <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Carregando desfechos…</p>}
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!loading && !error && scoreDefinitions.length === 0 && <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Nenhum score recomendado para este problema ainda.</p>}
      {!loading && !error && scoreDefinitions.length > 0 && entries.length === 0 && <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Ainda não há scores vinculados a este problema.</p>}

      <div className="space-y-2">
        {scoreDefinitions.map((score) => {
          const scoreEntries = entries.filter((entry) => entry.score_type === score.id);
          const latest = scoreEntries[0];
          const trend = trendLabel(scoreEntries);
          return (
            <article key={score.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{score.name}</p>
                  <p className="mt-1 text-xs text-gray-500">{latest ? new Date(latest.created_at).toLocaleDateString('pt-BR') : 'Sem registro'}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{latest ? latest.score_value : '—'}</p>
                  <p className="text-xs font-semibold text-teal-700">{trend.label}</p>
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-gray-500">{trend.helper}{trend.delta !== null ? ` Variação: ${trend.delta > 0 ? '+' : ''}${trend.delta.toFixed(2)}.` : ''}</p>
              <a href={`/patients/${patientId}/scores?score=${score.id}&problemId=${problem.id}`} className="mt-3 inline-flex text-xs font-semibold text-purple-700 hover:underline">Calcular novo {score.name} →</a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
