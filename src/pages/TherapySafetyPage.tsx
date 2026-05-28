import { useMemo, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { ClinicalCriteriaCards } from '../components/criteria/ClinicalCriteriaCards';
import { prescriptionTemplates, validatePrescriptionItem, type PrescriptionDraftItem, type PrescriptionRiskLevel } from '../lib/prescriptionEngine';

const SAFETY_ITEMS = [
  { id: 'tb', label: 'TB rastreada / endereçada', group: 'Infecção' },
  { id: 'hbv', label: 'HBV revisado', group: 'Infecção' },
  { id: 'hcv_hiv', label: 'HCV/HIV conforme risco', group: 'Infecção' },
  { id: 'vaccines', label: 'Vacinas revisadas antes de imunossupressão', group: 'Prevenção' },
  { id: 'cbc', label: 'Hemograma basal', group: 'Exames' },
  { id: 'renal', label: 'Função renal basal', group: 'Exames' },
  { id: 'hepatic', label: 'Função hepática basal', group: 'Exames' },
  { id: 'pregnancy', label: 'Gestação/contracepção quando aplicável', group: 'Segurança' },
  { id: 'cv_risk', label: 'Risco CV/trombótico considerado', group: 'Segurança' },
  { id: 'interactions', label: 'Interações/duplicidades revisadas', group: 'Segurança' },
];

const sampleRiskItems: PrescriptionDraftItem[] = [
  {
    medication: 'Metotrexato',
    concentration: '2,5 mg comprimido',
    route: 'VO',
    dose: '6 comprimidos',
    frequency: 'todo dia',
    duration: 'uso contínuo',
    quantity: '1 caixa',
    instructions: 'Exemplo proposital de frequência insegura para demonstrar bloqueio crítico.',
  },
  {
    medication: 'Naproxeno',
    concentration: '[preencher apresentação]',
    route: 'VO',
    dose: '[preencher dose]',
    frequency: '[preencher frequência]',
    duration: 'curto prazo',
    quantity: '[preencher quantidade]',
    instructions: 'Exemplo de AINE com placeholders e checagens de segurança.',
  },
];

function alertClass(level: PrescriptionRiskLevel) {
  if (level === 'danger') return 'border-red-200 bg-red-50 text-red-800';
  if (level === 'warning') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-blue-200 bg-blue-50 text-blue-800';
}

export default function TherapySafetyPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const completion = useMemo(() => {
    const done = SAFETY_ITEMS.filter((item) => checked[item.id]).length;
    return Math.round((done / SAFETY_ITEMS.length) * 100);
  }, [checked]);

  const grouped = useMemo(() => {
    return SAFETY_ITEMS.reduce<Record<string, typeof SAFETY_ITEMS>>((acc, item) => {
      acc[item.group] = [...(acc[item.group] ?? []), item];
      return acc;
    }, {});
  }, []);

  const riskAlerts = sampleRiskItems.flatMap((item) => validatePrescriptionItem(item).map((alert) => ({ ...alert, medication: item.medication })));
  const advancedTemplates = prescriptionTemplates.filter((template) => ['csdmard', 'corticosteroid', 'biologic-screening', 'anti-inflammatory'].includes(template.category));

  return (
    <AppShell>
      <div className="max-w-6xl space-y-6">
        <header className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">RhemaFlow Safety Layer</p>
          <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Painel de Segurança Terapêutica</h1>
              <p className="max-w-3xl text-sm text-gray-600">Camada operacional para reduzir omissões antes de DMARDs, biológicos, JAK, corticoide prolongado e AINEs. Não substitui protocolo local nem avaliação presencial.</p>
            </div>
            <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-teal-800">
              <span className="text-xs font-semibold uppercase tracking-wide">Checklist</span>
              <p className="text-2xl font-bold">{completion}%</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Checklist pré-imunossupressão</h2>
            <p className="mt-1 text-sm text-gray-500">Marque os itens já revisados/documentados.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {Object.entries(grouped).map(([group, items]) => (
                <div key={group} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">{group}</h3>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <label key={item.id} className="flex cursor-pointer items-start gap-2 rounded-xl bg-white p-3 text-sm text-gray-700 shadow-sm">
                        <input
                          type="checkbox"
                          checked={Boolean(checked[item.id])}
                          onChange={(event) => setChecked((prev) => ({ ...prev, [item.id]: event.target.checked }))}
                          className="mt-1 accent-teal-600"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900">Templates terapêuticos sensíveis</h2>
              <div className="mt-3 space-y-2">
                {advancedTemplates.map((template) => (
                  <div key={template.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-sm font-semibold text-gray-900">{template.label}</p>
                    <p className="mt-1 text-xs text-gray-500">{template.safetyNotes.join(' · ')}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900">Demonstração de alertas</h2>
              <div className="mt-3 space-y-2">
                {riskAlerts.map((alert) => (
                  <div key={`${alert.medication}-${alert.title}-${alert.message}`} className={`rounded-2xl border p-3 text-xs ${alertClass(alert.level)}`}>
                    <p className="font-bold">{alert.medication}: {alert.title}</p>
                    <p className="mt-1 leading-relaxed">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">Raciocínio associado</p>
            <h2 className="text-lg font-bold text-gray-900">Critérios e contexto de segurança</h2>
          </div>
          <ClinicalCriteriaCards domain="Segurança Terapêutica" />
        </section>
      </div>
    </AppShell>
  );
}
