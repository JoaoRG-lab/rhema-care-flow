import { useMemo, useState } from 'react';
import { PrescriptionSafetyPanel } from '../safety/PrescriptionSafetyPanel';
import { useMedications } from '../../hooks/useMedications';
import { useProblemProtocolStatus } from '../../hooks/useProblemProtocolStatus';
import { getProtocolForProblem } from '../../lib/clinicalProtocolRegistry';
import type { ProblemInstance } from '../../types';

interface ProblemMedicationPanelProps {
  patientId: string;
  problem: ProblemInstance;
}

export function ProblemMedicationPanel({ patientId, problem }: ProblemMedicationPanelProps) {
  const { medications, loading, error, createMedication, updateMedicationStatus } = useMedications(patientId, problem.id);
  const { byItemId } = useProblemProtocolStatus(patientId, problem.id);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('');
  const [saving, setSaving] = useState(false);

  const protocolCompleted = useMemo(() => {
    const protocol = getProtocolForProblem(problem.template_id, problem.title);
    const map: Record<string, boolean> = {};
    protocol?.sections.flatMap((section) => section.items).forEach((item) => {
      map[item.id] = Boolean(byItemId.get(item.id)?.completed);
    });
    return map;
  }, [problem.template_id, problem.title, byItemId]);

  const medicationContext = useMemo(() => medications
    .filter((med) => med.status === 'active' || med.status === 'planned')
    .map((med) => ({ name: med.medication_name, dose: med.dose ?? undefined, route: med.route ?? undefined, frequency: med.frequency ?? undefined })), [medications]);

  async function addMedication() {
    if (!name.trim()) return;
    setSaving(true);
    const result = await createMedication({ medication_name: name.trim(), dose: dose.trim() || null, frequency: frequency.trim() || null });
    if (!result.error) {
      setName('');
      setDose('');
      setFrequency('');
    }
    setSaving(false);
  }

  return (
    <section className="space-y-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Medication Registry</p>
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Terapêutica vinculada ao problema</h2>
          </div>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">{medications.length}</span>
        </div>

        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_160px_160px_auto]">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Medicação" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800" />
          <input value={dose} onChange={(event) => setDose(event.target.value)} placeholder="Dose" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800" />
          <input value={frequency} onChange={(event) => setFrequency(event.target.value)} placeholder="Frequência" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 dark:border-gray-700 dark:bg-gray-800" />
          <button onClick={addMedication} disabled={saving || !name.trim()} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">Adicionar</button>
        </div>

        {loading && <p className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Carregando medicações…</p>}
        {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="mt-4 space-y-2">
          {medications.length === 0 && !loading ? <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-800">Nenhuma medicação cadastrada para este problema.</p> : null}
          {medications.map((med) => (
            <article key={med.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{med.medication_name}</p>
                  <p className="mt-1 text-xs text-gray-500">{[med.dose, med.frequency, med.route].filter(Boolean).join(' · ') || 'Sem posologia registrada'}</p>
                </div>
                <select value={med.status} onChange={(event) => updateMedicationStatus(med.id, event.target.value as typeof med.status)} className="rounded-xl border border-gray-200 bg-white px-2 py-1 text-xs font-semibold dark:border-gray-700 dark:bg-gray-900">
                  <option value="active">Ativa</option>
                  <option value="planned">Planejada</option>
                  <option value="paused">Pausada</option>
                  <option value="stopped">Suspensa</option>
                  <option value="completed">Concluída</option>
                </select>
              </div>
            </article>
          ))}
        </div>
      </section>

      <PrescriptionSafetyPanel medications={medicationContext} protocolCompleted={protocolCompleted} problemTitle={problem.title} />
    </section>
  );
}
