import { useState } from 'react';
import type { PatientCard, PatientCardInsert } from '../../types';

type FormMode = 'create' | 'edit';

interface PatientFormProps {
  mode: FormMode;
  initial?: Partial<PatientCard>;
  onSubmit: (data: PatientCardInsert) => Promise<{ error: string | null }>;
  onCancel?: () => void;
  loading?: boolean;
}

export function PatientForm({ mode, initial = {}, onSubmit, onCancel, loading }: PatientFormProps) {
  const [form, setForm] = useState<Partial<PatientCardInsert>>({
    full_name: initial.full_name ?? '',
    patient_code: initial.patient_code ?? '',
    date_of_birth: initial.date_of_birth ?? '',
    gender: initial.gender ?? null,
    phone_number: initial.phone_number ?? '',
    email: initial.email ?? '',
    address: initial.address ?? '',
    active: initial.active ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof PatientCardInsert>(key: K, value: PatientCardInsert[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name?.trim()) { setError('Nome completo é obrigatório.'); return; }
    if (!form.patient_code?.trim()) { setError('Código do paciente é obrigatório.'); return; }
    setSubmitting(true);
    setError(null);
    const { error: submitErr } = await onSubmit(form as PatientCardInsert);
    if (submitErr) { setError(submitErr); setSubmitting(false); return; }
    setSubmitting(false);
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Nome + Código */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="full_name" className={labelCls}>
            Nome completo <span className="text-red-500" aria-hidden>*</span>
          </label>
          <input
            id="full_name"
            type="text"
            value={form.full_name ?? ''}
            onChange={(e) => set('full_name', e.target.value)}
            placeholder="Maria da Silva"
            required
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="patient_code" className={labelCls}>
            Código do paciente <span className="text-red-500" aria-hidden>*</span>
          </label>
          <input
            id="patient_code"
            type="text"
            value={form.patient_code ?? ''}
            onChange={(e) => set('patient_code', e.target.value.toUpperCase())}
            placeholder="PAC-00001"
            required
            className={inputCls}
          />
        </div>
      </div>

      {/* Data de nascimento + Gênero */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date_of_birth" className={labelCls}>Data de nascimento</label>
          <input
            id="date_of_birth"
            type="date"
            value={form.date_of_birth ?? ''}
            onChange={(e) => set('date_of_birth', e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="gender" className={labelCls}>Gênero</label>
          <select
            id="gender"
            value={form.gender ?? ''}
            onChange={(e) => set('gender', (e.target.value || null) as PatientCardInsert['gender'])}
            className={inputCls}
          >
            <option value="">Não informado</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
            <option value="outro">Outro</option>
          </select>
        </div>
      </div>

      {/* Telefone + Email */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone_number" className={labelCls}>Telefone</label>
          <input
            id="phone_number"
            type="tel"
            value={form.phone_number ?? ''}
            onChange={(e) => set('phone_number', e.target.value)}
            placeholder="(11) 99999-9999"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>E-mail</label>
          <input
            id="email"
            type="email"
            value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
            placeholder="paciente@email.com"
            className={inputCls}
          />
        </div>
      </div>

      {/* Endereço */}
      <div>
        <label htmlFor="address" className={labelCls}>Endereço</label>
        <input
          id="address"
          type="text"
          value={form.address ?? ''}
          onChange={(e) => set('address', e.target.value)}
          placeholder="Rua, número, bairro, cidade — SP"
          className={inputCls}
        />
      </div>

      {/* Erro */}
      {error && (
        <p role="alert" className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}

      {/* Ações */}
      <div className="flex gap-3 justify-end pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || loading}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {submitting || loading ? 'Salvando...' : mode === 'create' ? 'Cadastrar paciente' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}
