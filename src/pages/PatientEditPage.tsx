import { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { PatientForm } from '../components/patients/PatientForm';
import { supabase } from '../lib/supabase';
import type { PatientCard, PatientCardInsert } from '../types';

interface PatientEditPageProps {
  patientId: string;
}

export function PatientEditPage({ patientId }: PatientEditPageProps) {
  const [patient, setPatient] = useState<PatientCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('patient_cards')
      .select('*')
      .eq('id', patientId)
      .maybeSingle()
      .then(({ data, error: e }) => {
        if (e || !data) setError(e?.message ?? 'Paciente nao encontrado.');
        else setPatient(data as PatientCard);
        setLoading(false);
      });
  }, [patientId]);

  async function handleUpdate(data: PatientCardInsert) {
    const { error: uErr } = await supabase
      .from('patient_cards')
      .update(data)
      .eq('id', patientId);
    if (!uErr) window.location.href = `/patients/${patientId}`;
    return { error: uErr?.message ?? null };
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-2xl space-y-4">
          <div className="h-7 w-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !patient) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error ?? 'Paciente nao encontrado.'}</p>
          <a href="/patients" className="text-sm text-teal-600 hover:underline">Voltar para Pacientes</a>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-2xl">
        {/* Breadcrumb */}
        <nav aria-label="Trilha de navegacao" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <a href="/patients" className="hover:text-teal-600 transition-colors">Pacientes</a>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 18l6-6-6-6"/>
          </svg>
          <a href={`/patients/${patientId}`} className="hover:text-teal-600 transition-colors truncate max-w-xs">
            {patient.full_name}
          </a>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 18l6-6-6-6"/>
          </svg>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Editar</span>
        </nav>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Editar paciente</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Alteracoes salvas sao auditadas automaticamente.
          </p>

          <PatientForm
            mode="edit"
            initial={patient}
            onSubmit={handleUpdate}
            onCancel={() => (window.location.href = `/patients/${patientId}`)}
          />
        </div>
      </div>
    </AppShell>
  );
}

export default PatientEditPage;
