import { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { useProntuario } from '../hooks/useProntuario';
import { useVisits } from '../hooks/useVisits';
import { supabase } from '../lib/supabase';
import type { PatientCard, Visit, VisitStatus } from '../types';

const STATUS_LABELS: Record<VisitStatus, string> = {
  agendada:     'Agendada',
  em_andamento: 'Em andamento',
  concluida:    'Concluída',
  cancelada:    'Cancelada',
  faltou:       'Faltou',
};

const STATUS_COLORS: Record<VisitStatus, string> = {
  agendada:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  em_andamento: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  concluida:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelada:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  faltou:       'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

type Tab = 'overview' | 'prontuario' | 'visits';

interface PatientDetailPageProps {
  patientId: string;
}

function ClinicalShortcut({ href, title, description, tone }: { href: string; title: string; description: string; tone: 'teal' | 'purple' | 'amber' }) {
  const toneClass = {
    teal: 'border-teal-100 bg-teal-50 text-teal-800 hover:bg-teal-100 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-300',
    purple: 'border-purple-100 bg-purple-50 text-purple-800 hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/30 dark:text-purple-300',
    amber: 'border-amber-100 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300',
  }[tone];

  return (
    <a href={href} className={`rounded-2xl border p-4 transition-colors ${toneClass}`}>
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-1 text-xs leading-relaxed opacity-80">{description}</p>
      <span className="mt-3 inline-flex text-xs font-semibold underline-offset-2 hover:underline">Abrir →</span>
    </a>
  );
}

export function PatientDetailPage({ patientId }: PatientDetailPageProps) {
  const [patient, setPatient] = useState<PatientCard | null>(null);
  const [patientLoading, setPatientLoading] = useState(true);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  const { entries, loading: pronLoading } = useProntuario(patientId);
  const { visits, loading: visitsLoading } = useVisits(patientId);

  useEffect(() => {
    async function load() {
      setPatientLoading(true);
      const { data, error } = await supabase
        .from('patient_cards')
        .select('*')
        .eq('id', patientId)
        .maybeSingle();
      if (error) setPatientError(error.message);
      else if (!data) setPatientError('Paciente não encontrado.');
      else setPatient(data as PatientCard);
      setPatientLoading(false);
    }
    load();
  }, [patientId]);

  function calcAge(dob: string | null) {
    if (!dob) return null;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  }

  if (patientLoading) {
    return (
      <AppShell>
        <div className="space-y-4 max-w-3xl">
          <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" style={{ width: `${[60, 80, 50, 70, 40][i]}%` }} />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (patientError || !patient) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{patientError ?? 'Paciente não encontrado.'}</p>
          <a href="/patients" className="text-sm text-teal-600 hover:underline">Voltar para Pacientes</a>
        </div>
      </AppShell>
    );
  }

  const age = calcAge(patient.date_of_birth);
  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview',   label: 'Resumo' },
    { id: 'prontuario', label: 'Prontuário', count: entries.length },
    { id: 'visits',     label: 'Visitas',    count: visits.length },
  ];

  return (
    <AppShell>
      <div className="max-w-3xl space-y-5">
        {/* Breadcrumb */}
        <nav aria-label="Trilha de navegação" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <a href="/patients" className="hover:text-teal-600 transition-colors">Pacientes</a>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
          <span className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-xs">{patient.full_name}</span>
        </nav>

        {/* Card de identidade */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-teal-700 dark:text-teal-300">
                {patient.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{patient.full_name}</h1>
                {!patient.active && <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-500">Inativo</span>}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                <span>{patient.patient_code}</span>
                {age !== null && <span>{age} anos</span>}
                {patient.gender && <span>{{ M: 'Masculino', F: 'Feminino', outro: 'Outro' }[patient.gender]}</span>}
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <a href={`/patients/${patient.id}/prontuario`} className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Prontuário</a>
              <a href={`/patients/${patient.id}/edit`} className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors">Editar</a>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid sm:grid-cols-3 gap-3">
            {patient.phone_number && <div><p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Telefone</p><a href={`tel:${patient.phone_number}`} className="text-sm text-gray-900 dark:text-gray-100 hover:text-teal-600 transition-colors">{patient.phone_number}</a></div>}
            {patient.email && <div><p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">E-mail</p><a href={`mailto:${patient.email}`} className="text-sm text-gray-900 dark:text-gray-100 hover:text-teal-600 transition-colors truncate block">{patient.email}</a></div>}
            {patient.date_of_birth && <div><p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Nascimento</p><p className="text-sm text-gray-900 dark:text-gray-100">{new Date(patient.date_of_birth + 'T00:00:00').toLocaleDateString('pt-BR')}</p></div>}
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-3">
          <ClinicalShortcut href={`/patients/${patient.id}/prontuario`} title="Prontuário / Prescrição" description="Registrar evolução, prescrição estruturada e impressão/PDF." tone="teal" />
          <ClinicalShortcut href="/scores" title="Scores e critérios" description="Calcular atividade, registrar métricas e revisar critérios." tone="purple" />
          <ClinicalShortcut href="/therapeutic-safety" title="Segurança Rx" description="Checklist pré-imunossupressão e alertas de risco." tone="amber" />
        </section>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {t.label}
              {t.count !== undefined && t.count > 0 && <span className="ml-1.5 text-xs bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded-full">{t.count}</span>}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4"><p className="text-xs text-gray-400 mb-1">Entradas no prontuário</p><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pronLoading ? '—' : entries.length}</p></div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4"><p className="text-xs text-gray-400 mb-1">Visitas totais</p><p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{visitsLoading ? '—' : visits.length}</p></div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4"><p className="text-xs text-gray-400 mb-1">Última visita</p><p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{visitsLoading ? '—' : visits[0] ? new Date(visits[0].scheduled_at).toLocaleDateString('pt-BR') : 'Sem visitas'}</p></div>
          </div>
        )}

        {tab === 'prontuario' && <div className="text-center py-8 text-sm text-gray-500"><a href={`/patients/${patient.id}/prontuario`} className="text-teal-600 hover:underline">Abrir prontuário completo</a></div>}

        {tab === 'visits' && (
          <div className="space-y-3">
            {visitsLoading && <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse h-16" />)}</div>}
            {!visitsLoading && visits.length === 0 && <div className="text-center py-10 text-sm text-gray-500">Nenhuma visita registrada.</div>}
            {!visitsLoading && visits.map((v: Visit) => (
              <div key={v.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{new Date(v.scheduled_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>{v.chief_complaint && <p className="text-xs text-gray-500 truncate">{v.chief_complaint}</p>}</div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_COLORS[v.status]}`}>{STATUS_LABELS[v.status]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default PatientDetailPage;
