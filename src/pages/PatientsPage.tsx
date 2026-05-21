import { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { usePatients } from '../hooks/usePatients';
import type { PatientCard } from '../types';

function PatientRow({ patient }: { patient: PatientCard }) {
  const initials = patient.full_name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <a
      href={`/patients/${patient.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{patient.full_name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {patient.patient_code}
          {patient.phone_number ? ` · ${patient.phone_number}` : ''}
        </p>
      </div>

      {/* Seta */}
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/>
      </svg>
    </a>
  );
}

export function PatientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: patients, loading, error, count, totalPages, refetch } = usePatients({
    search, page, perPage: 25,
  });

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Pacientes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{count} cadastros ativos</p>
          </div>
          <a
            href="/patients/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors w-fit"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" d="M12 5v14M5 12h14"/>
            </svg>
            Novo Paciente
          </a>
        </div>

        {/* Busca */}
        <div className="relative">
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="search"
            value={search}
            onChange={handleSearch}
            placeholder="Buscar por nome, codigo ou telefone..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Buscar pacientes"
          />
        </div>

        {/* Lista */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          {loading && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button onClick={refetch} className="mt-2 text-xs text-teal-600 hover:underline">Tentar novamente</button>
            </div>
          )}

          {!loading && !error && patients.length === 0 && (
            <div className="px-4 py-12 text-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-300 dark:text-gray-600 mb-3" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {search ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado ainda.'}
              </p>
              {!search && (
                <a href="/patients/new" className="mt-2 inline-block text-xs text-teal-600 hover:underline">Cadastrar primeiro paciente</a>
              )}
            </div>
          )}

          {!loading && !error && patients.length > 0 && (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {patients.map((p) => <PatientRow key={p.id} patient={p} />)}
            </div>
          )}
        </div>

        {/* Paginacao */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Pagina {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Proxima
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default PatientsPage;
