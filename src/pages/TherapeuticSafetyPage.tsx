import { useMemo, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { ClinicalCriteriaCards } from '../components/criteria/ClinicalCriteriaCards';
import { prescriptionTemplates, validatePrescriptionItem, type PrescriptionDraftItem } from '../lib/prescriptionEngine';

type SafetyItem = {
  id: string;
  label: string;
  domain: 'Infecção' | 'Vacinas' | 'Laboratório' | 'Gestação' | 'Cardiometabólico' | 'Farmacologia';
  severity: 'critical' | 'warning' | 'routine';
  note: string;
};

const safetyItems: SafetyItem[] = [
  { id: 'tb', label: 'TB latente/ativa revisada', domain: 'Infecção', severity: 'critical', note: 'IGRA/PPD, imagem e risco epidemiológico conforme contexto e protocolo.' },
  { id: 'hbv', label: 'HBV revisado', domain: 'Infecção', severity: 'critical', note: 'HBsAg, anti-HBc, anti-HBs e plano se risco de reativação.' },
  { id: 'hcv-hiv', label: 'HCV/HIV avaliados quando indicado', domain: 'Infecção', severity: 'warning', note: 'Conforme risco, terapia pretendida e protocolo local.' },
  { id: 'vaccines', label: 'Vacinas revisadas antes da imunossupressão', domain: 'Vacinas', severity: 'critical', note: 'Atenção para vacinas vivas antes de biológico/JAK e calendário adulto.' },
  { id: 'cbc', label: 'Hemograma basal disponível', domain: 'Laboratório', severity: 'critical', note: 'Essencial para DMARDs, biológicos, JAK e citopenias prévias.' },
  { id: 'renal-hepatic', label: 'Função renal/hepática basal disponível', domain: 'Laboratório', severity: 'critical', note: 'Dose, contraindicação e monitorização dependem disso.' },
  { id: 'pregnancy', label: 'Gestação/contracepção revisada quando aplicável', domain: 'Gestação', severity: 'critical', note: 'Obrigatório para MTX, leflunomida, micofenolato e outras drogas teratogênicas.' },
  { id: 'cv-risk', label: 'Risco cardiovascular/trombótico considerado', domain: 'Cardiometabólico', severity: 'warning', note: 'Especialmente antes de JAK, AINEs e corticoide prolongado.' },
  { id: 'interactions', label: 'Interações e duplicidades revisadas', domain: 'Farmacologia', severity: 'warning', note: 'AINE duplicado, anticoagulação, hepatotóxicos, nefrotóxicos e combinações de risco.' },
  { id: 'monitoring-plan', label: 'Plano de monitorização registrado', domain: 'Laboratório', severity: 'routine', note: 'Periodicidade de hemograma, TGO/TGP, creatinina e avaliação clínica.' },
];

const emptyItem: PrescriptionDraftItem = {
  medication: '',
  concentration: '',
  route: 'VO',
  dose: '',
  frequency: '',
  duration: '',
  quantity: '',
  instructions: '',
};

function severityClass(severity: SafetyItem['severity']) {
  if (severity === 'critical') return 'border-red-200 bg-red-50 text-red-800';
  if (severity === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-teal-200 bg-teal-50 text-teal-800';
}

export default function TherapeuticSafetyPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<PrescriptionDraftItem>(emptyItem);

  const grouped = useMemo(() => {
    return safetyItems.reduce<Record<SafetyItem['domain'], SafetyItem[]>>((acc, item) => {
      acc[item.domain] = [...(acc[item.domain] ?? []), item];
      return acc;
    }, {} as Record<SafetyItem['domain'], SafetyItem[]>);
  }, []);

  const completion = useMemo(() => {
    const done = safetyItems.filter((item) => checked[item.id]).length;
    return Math.round((done / safetyItems.length) * 100);
  }, [checked]);

  const missingCritical = safetyItems.filter((item) => item.severity === 'critical' && !checked[item.id]);
  const draftAlerts = useMemo(() => validatePrescriptionItem(draft).filter((alert) => Object.values(draft).some((value) => value.trim())), [draft]);

  function applyTemplate(id: string) {
    const template = prescriptionTemplates.find((item) => item.id === id);
    if (!template) return;
    setDraft({
      medication: template.medication,
      concentration: template.concentration,
      route: template.route,
      dose: template.dose,
      frequency: template.frequency,
      duration: template.duration,
      quantity: template.quantity,
      instructions: template.instructions,
    });
  }

  return (
    <AppShell>
      <div className="max-w-6xl space-y-6">
        <header className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">RhemaFlow Safety Layer</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-950">Painel de Segurança Terapêutica</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
            Checklist operacional para reduzir falhas antes de DMARDs, biológicos, JAK, AINEs e corticoide prolongado. Não substitui protocolo institucional nem julgamento clínico.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-teal-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Checklist concluído</p>
              <p className="mt-1 text-3xl font-bold text-teal-700">{completion}%</p>
            </div>
            <div className="rounded-2xl border border-red-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pendências críticas</p>
              <p className="mt-1 text-3xl font-bold text-red-700">{missingCritical.length}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Templates terapêuticos</p>
              <p className="mt-1 text-3xl font-bold text-amber-700">{prescriptionTemplates.length}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {Object.entries(grouped).map(([domain, items]) => (
              <article key={domain} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">{domain}</h2>
                <div className="mt-3 space-y-2">
                  {items.map((item) => (
                    <label key={item.id} className={`flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm ${checked[item.id] ? 'border-teal-200 bg-teal-50 text-teal-900' : severityClass(item.severity)}`}>
                      <input
                        type="checkbox"
                        checked={Boolean(checked[item.id])}
                        onChange={(event) => setChecked((prev) => ({ ...prev, [item.id]: event.target.checked }))}
                        className="mt-1 h-4 w-4 accent-teal-600"
                      />
                      <span>
                        <strong className="block">{item.label}</strong>
                        <span className="mt-1 block text-xs opacity-80">{item.note}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <aside className="space-y-4">
            <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900">Teste rápido de prescrição</h2>
              <p className="mt-1 text-xs text-gray-500">Use um template para visualizar alertas do motor de prescrição.</p>
              <select
                defaultValue=""
                onChange={(event) => event.target.value && applyTemplate(event.target.value)}
                className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Selecionar template...</option>
                {prescriptionTemplates.map((template) => (
                  <option key={template.id} value={template.id}>{template.label}</option>
                ))}
              </select>

              <div className="mt-4 rounded-2xl bg-gray-50 p-3 text-xs text-gray-700">
                <p><strong>Medicamento:</strong> {draft.medication || '—'}</p>
                <p><strong>Dose:</strong> {draft.dose || '—'}</p>
                <p><strong>Frequência:</strong> {draft.frequency || '—'}</p>
              </div>

              {draftAlerts.length > 0 && (
                <div className="mt-3 space-y-2">
                  {draftAlerts.map((alert) => (
                    <div key={`${alert.title}-${alert.message}`} className={`rounded-2xl border p-3 text-xs ${alert.level === 'danger' ? 'border-red-200 bg-red-50 text-red-800' : alert.level === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
                      <strong>{alert.title}</strong>
                      <p className="mt-1">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              <h2 className="font-bold">Regra operacional</h2>
              <p className="mt-2 leading-relaxed">
                Se houver pendência crítica em infecção, gestação/contracepção ou exames basais, evite iniciar automaticamente imunossupressão avançada até documentar risco/benefício e plano.
              </p>
            </article>
          </aside>
        </section>

        <section>
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Base interpretativa</p>
            <h2 className="text-lg font-bold text-gray-900">Critérios relacionados à segurança</h2>
          </div>
          <ClinicalCriteriaCards domain="Segurança Terapêutica" />
        </section>
      </div>
    </AppShell>
  );
}
