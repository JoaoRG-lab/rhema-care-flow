import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProblemGoalsPanel } from '../components/problems/ProblemGoalsPanel';
import { ProblemFollowupsPanel } from '../components/problems/ProblemFollowupsPanel';
import { ClinicalTimelinePanel } from '../components/timeline/ClinicalTimelinePanel';
import { useClinicalTimeline } from '../hooks/useClinicalTimeline';
import { useProblems } from '../hooks/useProblems';
import { supabase } from '../lib/supabase';
import type { ProblemInstance, ProblemSeverity, ProblemStatus } from '../types';

const STATUS_OPTIONS: Array<{ value: ProblemStatus; label: string }> = [
  { value: 'active', label: 'Ativo' },
  { value: 'controlled', label: 'Controlado' },
  { value: 'monitoring', label: 'Monitorando' },
  { value: 'resolved', label: 'Resolvido' },
  { value: 'uncertain', label: 'Incerto' },
];

const SEVERITY_OPTIONS: Array<{ value: ProblemSeverity; label: string }> = [
  { value: 'low', label: 'Baixa' },
  { value: 'moderate', label: 'Moderada' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];

function PillList({ title, items, tone }: { title: string; items: string[]; tone: 'amber' | 'red' | 'teal' | 'gray' }) {
  const toneClass = {
    amber: 'bg-amber-50 text-amber-800 border-amber-100',
    red: 'bg-red-50 text-red-800 border-red-100',
    teal: 'bg-teal-50 text-teal-800 border-teal-100',
    gray: 'bg-gray-50 text-gray-700 border-gray-100',
  }[tone];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Nenhum item registrado.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => <span key={item} className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}>{item}</span>)}
        </div>
      )}
    </section>
  );
}

export default function ProblemDetailPage() {
  const { patientId, problemId } = useParams<{ patientId: string; problemId: string }>();
  const { updateProblem } = useProblems(patientId);
  const { events, loading: timelineLoading, error: timelineError, addEvent } = useClinicalTimeline(patientId);
  const [problem, setProblem] = useState<ProblemInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    async function loadProblem() {
      if (!problemId) return;
      setLoading(true);
      const { data } = await supabase
        .from('problem_instances')
        .select('*')
        .eq('id', problemId)
        .maybeSingle();
      const loaded = (data ?? null) as ProblemInstance | null;
      setProblem(loaded);
      setSummary(loaded?.summary ?? '');
      setLoading(false);
    }
    loadProblem();
  }, [problemId]);

  const relatedEvents = useMemo(() => {
    if (!problem) return [];
    return events.filter((event) => {
      const payload = event.payload ?? {};
      return payload.problem_id === problem.id || event.title.toLowerCase().includes(problem.title.toLowerCase());
    });
  }, [events, problem]);

  async function patchProblem(patch: Partial<Pick<ProblemInstance, 'status' | 'severity' | 'summary'>>) {
    if (!problem) return;
    setSaving(true);
    const { data, error } = await updateProblem(problem.id, patch);
    if (!error && data) {
      setProblem(data);
      await addEvent({
        event_type: 'problem',
        title: `Problema atualizado: ${data.title}`,
        description: `Status: ${data.status} · Gravidade: ${data.severity}`,
        payload: { problem_id: data.id, patch },
      });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-5xl space-y-4">
          <div className="h-8 w-64 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
          <div className="h-48 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800" />
        </div>
      </AppShell>
    );
  }

  if (!problem || !patientId) {
    return (
      <AppShell>
        <div className="py-20 text-center">
          <p className="text-sm text-gray-500">Problema clínico não encontrado.</p>
          <a href={patientId ? `/patients/${patientId}/problems` : '/patients'} className="mt-3 inline-flex text-sm font-semibold text-teal-600 hover:underline">Voltar</a>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-6xl space-y-5">
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <a href={`/patients/${patientId}`} className="hover:text-teal-600">Paciente</a>
          <span>/</span>
          <a href={`/patients/${patientId}/problems`} className="hover:text-teal-600">Problemas</a>
          <span>/</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{problem.title}</span>
        </nav>

        <header className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-6 shadow-sm dark:border-teal-950 dark:from-teal-950/30 dark:to-gray-900">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Problem-Oriented Medical Record</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-950 dark:text-gray-100">{problem.title}</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{problem.specialty} · criado em {new Date(problem.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <select value={problem.status} onChange={(event) => patchProblem({ status: event.target.value as ProblemStatus })} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select value={problem.severity} onChange={(event) => patchProblem({ severity: event.target.value as ProblemSeverity })} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
                {SEVERITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>
          {saving && <p className="mt-3 text-xs font-semibold text-teal-700">Salvando atualização…</p>}
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-4">
            <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Resumo clínico do problema</h2>
              <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={5} placeholder="Resumo longitudinal, fenótipo, hipóteses, resposta terapêutica, contexto..." className="mt-3 w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800" />
              <button onClick={() => patchProblem({ summary })} disabled={saving} className="mt-3 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">Salvar resumo</button>
            </article>

            <ProblemGoalsPanel problem={problem} />
            <ProblemFollowupsPanel problem={problem} />
            <ClinicalTimelinePanel events={relatedEvents} loading={timelineLoading} error={timelineError} />
          </main>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Atalhos clínicos</h2>
              <div className="mt-3 grid gap-2">
                <a href={`/patients/${patientId}/scores`} className="rounded-xl bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-800 hover:bg-purple-100">Scores e critérios</a>
                <a href={`/patients/${patientId}/prontuario`} className="rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100">Prontuário / prescrição</a>
                <a href={`/patients/${patientId}/therapeutic-safety`} className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100">Segurança terapêutica</a>
              </div>
            </section>

            <PillList title="Safety flags" items={problem.safety_flags ?? []} tone="amber" />
            <PillList title="Red flags" items={problem.red_flags ?? []} tone="red" />
            <PillList title="Módulos relacionados" items={problem.linked_modules ?? []} tone="teal" />
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
