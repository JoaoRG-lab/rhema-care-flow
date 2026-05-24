import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';

type Status = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

interface PatientOption {
  id: string;
  patient_code: string;
  full_name: string | null;
}

interface Teleconsulta {
  id: string;
  provider_id: string;
  patient_card_id: string | null;
  patient_name: string | null;
  specialty: string | null;
  scheduled_date: string;
  start_time: string;
  duration_minutes: number;
  status: Status;
  notes: string | null;
  daily_room_url: string | null;
  patient_cards?: PatientOption | null;
}

const STATUS_LABEL: Record<Status, string> = {
  scheduled: 'Agendada',
  in_progress: 'Em atendimento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

const STATUS_COLOR: Record<Status, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  in_progress: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function fmtDateTime(date: string, time: string) {
  return new Date(`${date}T${time}`).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function SchedulePage() {
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [items, setItems] = useState<Teleconsulta[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(todayISO());
  const [filterStatus, setFilterStatus] = useState<Status | 'todos'>('todos');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patient_card_id: '',
    patient_name: '',
    specialty: 'Rheumatology',
    scheduled_date: todayISO(),
    start_time: '08:00',
    duration_minutes: 30,
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('teleconsultas')
      .select('id, provider_id, patient_card_id, patient_name, specialty, scheduled_date, start_time, duration_minutes, status, notes, daily_room_url, patient_cards(id, patient_code, full_name)')
      .eq('scheduled_date', filterDate)
      .order('start_time', { ascending: true });

    if (filterStatus !== 'todos') query = query.eq('status', filterStatus);

    const { data, error } = await query;
    if (error) {
      toastError('Erro ao carregar agenda', error.message);
      setItems([]);
    } else {
      setItems((data ?? []) as Teleconsulta[]);
    }

    setLoading(false);
  }, [filterDate, filterStatus, toastError]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    supabase
      .from('patient_cards')
      .select('id, patient_code, full_name')
      .eq('active', true)
      .order('full_name', { ascending: true, nullsFirst: false })
      .then(({ data }) => setPatients((data ?? []) as PatientOption[]));
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('teleconsultas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teleconsultas' }, () => load())
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) { toastError('Faça login novamente.'); return; }
    if (!form.patient_card_id && !form.patient_name.trim()) {
      toastError('Selecione um paciente ou informe o nome.'); return;
    }
    if (!form.scheduled_date || !form.start_time) {
      toastError('Informe data e horário.'); return;
    }

    const selectedPatient = patients.find((p) => p.id === form.patient_card_id);

    setSaving(true);
    const { error } = await supabase.from('teleconsultas').insert({
      provider_id: user.id,
      patient_card_id: form.patient_card_id || null,
      patient_name: form.patient_name.trim() || selectedPatient?.full_name || selectedPatient?.patient_code || null,
      specialty: form.specialty || 'Rheumatology',
      scheduled_date: form.scheduled_date,
      start_time: form.start_time,
      duration_minutes: form.duration_minutes || 30,
      notes: form.notes || null,
      status: 'scheduled',
    });
    setSaving(false);

    if (error) { toastError('Erro ao agendar', error.message); return; }

    success('Teleconsulta agendada.');
    setShowModal(false);
    setForm({ patient_card_id: '', patient_name: '', specialty: 'Rheumatology', scheduled_date: filterDate, start_time: '08:00', duration_minutes: 30, notes: '' });
    load();
  }

  async function updateStatus(id: string, status: Status) {
    const { error } = await supabase
      .from('teleconsultas')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) { toastError('Erro ao atualizar status', error.message); return; }
    info(`Status atualizado: ${STATUS_LABEL[status]}`);
    load();
  }

  function displayName(item: Teleconsulta) {
    return item.patient_name || item.patient_cards?.full_name || item.patient_cards?.patient_code || 'Paciente sem identificação';
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agenda</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Teleconsultas e atendimentos agendados</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors w-fit"
        >
          Novo agendamento
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => { setFilterDate(e.target.value); setForm((f) => ({ ...f, scheduled_date: e.target.value })); }}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as Status | 'todos')}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="todos">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {loading ? 'Carregando...' : `${items.length} registro${items.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
            <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum agendamento para este dia</p>
            <button onClick={() => setShowModal(true)} className="mt-4 text-sm text-teal-600 dark:text-teal-400 hover:underline">Criar agendamento</button>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="min-w-[88px]">
                <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100 leading-none">{item.start_time.slice(0, 5)}</p>
                <p className="text-xs text-gray-400">{item.duration_minutes} min</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={item.patient_card_id ? `/patients/${item.patient_card_id}` : '/patients'} className="font-semibold text-gray-900 dark:text-gray-100 hover:text-teal-600 dark:hover:text-teal-400 truncate">
                    {displayName(item)}
                  </Link>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[item.status]}`}>
                    {STATUS_LABEL[item.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {fmtDateTime(item.scheduled_date, item.start_time)} · {item.specialty ?? 'Rheumatology'}
                  {item.notes ? ` · ${item.notes}` : ''}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {item.status === 'scheduled' && <button onClick={() => updateStatus(item.id, 'in_progress')} className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 text-xs font-medium">Iniciar</button>}
                {item.status === 'in_progress' && <button onClick={() => updateStatus(item.id, 'completed')} className="px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-medium">Concluir</button>}
                {['scheduled', 'in_progress'].includes(item.status) && <button onClick={() => updateStatus(item.id, 'cancelled')} className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium">Cancelar</button>}
                {item.daily_room_url && <a href={item.daily_room_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-medium">Abrir sala</a>}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Novo agendamento</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Fechar">×</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Paciente cadastrado</label>
                <select value={form.patient_card_id} onChange={(e) => setForm({ ...form, patient_card_id: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Selecionar depois / paciente externo</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name || p.patient_code}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome do paciente se externo</label>
                <input value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} placeholder="Nome livre se não estiver cadastrado" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Data</label>
                  <input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} required className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Horário</label>
                  <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Duração</label>
                  <input type="number" min="5" step="5" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Especialidade</label>
                  <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold">{saving ? 'Salvando...' : 'Agendar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
