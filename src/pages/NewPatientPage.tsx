import { AppShell } from '../components/layout/AppShell';
import { PatientForm } from '../components/patients/PatientForm';
import { usePatients } from '../hooks/usePatients';
import type { PatientCardInsert } from '../types';

export function NewPatientPage() {
  const { createPatient } = usePatients();

  async function handleCreate(data: PatientCardInsert) {
    const { data: created, error } = await createPatient(data);
    if (!error && created) {
      window.location.href = `/patients/${created.id}`;
    }
    return { error };
  }

  return (
    <AppShell>
      <div className="max-w-2xl">
        {/* Breadcrumb */}
        <nav aria-label="Trilha de navegação" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <a href="/patients" className="hover:text-teal-600 transition-colors">Pacientes</a>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 18l6-6-6-6"/>
          </svg>
          <span className="text-gray-900 dark:text-gray-100 font-medium">Novo paciente</span>
        </nav>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Cadastrar novo paciente</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Preencha os dados básicos. Você pode completar o prontuário depois.</p>

          <PatientForm
            mode="create"
            onSubmit={handleCreate}
            onCancel={() => (window.location.href = '/patients')}
          />
        </div>
      </div>
    </AppShell>
  );
}

export default NewPatientPage;
