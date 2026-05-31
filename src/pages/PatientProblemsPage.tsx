import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProblemListPanel } from '../components/problems/ProblemListPanel';
import { ProblemSummaryCards } from '../components/problems/ProblemSummaryCards';
import { useProblems } from '../hooks/useProblems';
import { useClinicalTimeline } from '../hooks/useClinicalTimeline';
import { clinicalProblemTemplates } from '../lib/problemRegistry';
import { specialtyRegistry } from '../lib/specialtyRegistry';
import type { ProblemInstance } from '../types';

export default function PatientProblemsPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { problems, loading, error, createProblem } = useProblems(patientId);
  const { addEvent } = useClinicalTimeline(patientId);
  const [templateId, setTemplateId] = useState('');
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<ProblemInstance | null>(null);

  const groupedTemplates = useMemo(() => {
    return clinicalProblemTemplates.reduce<Record<string, typeof clinicalProblemTemplates>>((acc, template) => {
      acc[template.specialty] = [...(acc[template.specialty] ?? []), template];
      return acc;
    }, {});
  }, []);

  async function addFromTemplate() {
    if (!templateId) return;
    const template = clinicalProblemTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setSaving(true);
    const { data, error: createErr } = await createProblem({
      template_id: template.id,
      specialty: template.specialty,
      title: template.title,
      status: template.defaultStatus,
      severity: template.defaultSeverity,
      summary: template.suggestedGoals.join(' · '),
      baseline_data: { required: template.baselineData },
      followup_data: { required: template.followupData },
      safety_flags: template.safetyChecklist,
      red_flags: template.redFlags,
      linked_modules: template.linkedModules,
    });
    if (!createErr && data) {
      await addEvent({
        event_type: 'problem',
        title: `Problema criado: ${data.title}`,
        description: `${data.specialty} · ${data.severity}`,
        payload: { problem_id: data.id, template_id: data.template_id },
      });
      setTemplateId('');
      setSelected(data);
    }
    setSaving(false);
  }

  return (
    <AppShell>
      <div className="max-w-6xl space-y-5">
        <header className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Problem-Oriented Medical Record</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-950">Problemas clínicos do paciente</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
            Estruture o cuidado por problema, meta, intervenção, segurança e seguimento longitudinal. Reumatologia é um pacote maduro, mas a base serve para todas as clínicas.
          </p>
        </header>

        <ProblemSummaryCards problems={problems} />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <ProblemListPanel problems={problems} loading={loading} error={error} onSelect={setSelected} />
            {selected && (
              <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Problema selecionado</p>
                <h2 className="mt-1 text-lg font-bold text-gray-900">{selected.title}</h2>
                <p className="mt-1 text-sm text-gray-500">{selected.specialty} · {selected.status} · {selected.severity}</p>
                {selected.summary && <p className="mt-3 rounded-2xl bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">{selected.summary}</p>}
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <a href={`/patients/${selected.patient_id}/problems/${selected.id}`} className="rounded-2xl bg-teal-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-teal-700">Abrir detalhe</a>
                  <a href={`/patients/${selected.patient_id}/therapeutic-safety`} className="rounded-2xl border border-amber-200 px-4 py-3 text-center text-sm font-semibold text-amber-800 hover:bg-amber-50">Segurança Rx</a>
                </div>
              </article>
            )}
          </div>

          <aside className="space-y-4">
            <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900">Adicionar por template</h2>
              <p className="mt-1 text-xs text-gray-500">Escolha um problema clínico estruturado. Depois você poderá editar metas e follow-ups.</p>
              <select value={templateId} onChange={(event) => setTemplateId(event.target.value)} className="mt-4 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Selecionar problema...</option>
                {Object.entries(groupedTemplates).map(([specialty, templates]) => (
                  <optgroup key={specialty} label={specialtyRegistry.find((item) => item.key === specialty)?.label ?? specialty}>
                    {templates.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}
                  </optgroup>
                ))}
              </select>
              <button onClick={addFromTemplate} disabled={!templateId || saving} className="mt-3 w-full rounded-2xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
                {saving ? 'Criando…' : 'Criar problema'}
              </button>
            </article>

            <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900">Cobertura inicial</h2>
              <div className="mt-3 space-y-2 text-xs text-gray-600">
                {specialtyRegistry.slice(0, 8).map((specialty) => (
                  <p key={specialty.key} className="rounded-xl bg-gray-50 p-2"><strong>{specialty.label}:</strong> {specialty.commonProblems.slice(0, 4).join(' · ')}</p>
                ))}
              </div>
            </article>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
