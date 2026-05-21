import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { useAuditLog } from '../hooks/useAuditLog';

type Status = 'agendado' | 'confirmado' | 'realizado' | 'cancelado' | 'falta';

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  start_at: string;
  end_at: string;
  status: Status;
  reason: string | null;
  notes: string | null;
  teleconsulta: boolean;
  patient?: { name: string };
  doctor?: { full_name: string | null };
}

const STATUS_LABEL: Record<Status, string> = {
  agendado:   'Agendado',
  confirmado: 'Confirmado',
  realizado:  'Realizado',
  cancelado:  'Cancelado',
  falta:      'Falta',
};

const STATUS_COLOR: Record<Status, string> = {
  agendado:   'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300',
  confirmado: 'bg-teal-100   text-teal-700   dark:bg-teal-900/30   dark:text-teal-300',
  realizado:  'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-300',
  cancelado:  'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-300',
  falta:      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function SchedulePage() {
  const { profile } = useAuth();
  const { success, error: toastError, info } = useToast();
  const { log } = useAuditLog();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [view,         setView]         = useState<'list' | 'day'>('list');
  const [filterDate,   setFilterDate]   = useState(todayISO());
  const [filterStatus, setFilterStatus] = useState<Status | 'todos'>('todos');
  const [showModal,    setShowModal]    = useState(false);

  // Form novo agendamento
  const [patients,  setPatients]  = useState<{ id: string; name: string }[]>([]);
  const [doctors,   setDoctors]   = useState<{ id: string; full_name: string | null }[]>([]);
  const [form, setForm] = useState({
    patient_id: '', doctor_id: '', start_at: '', end_at: '',
    reason: '', teleconsulta: false,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('appointments')
      .select('*, patient:patients(name), doctor:profiles(full_name)')
      .order('start_at');

    if (filterStatus !== 'todos') q = q.eq('status', filterStatus);
    q = q
      .gte('start_at', `${filterDate}T00:00:00`)
      .lte('start_at', `${filterDate}T23:59:59`);

    const { data, error } = await q;
    if (error) { toastError('Erro ao carregar agenda'); }
    else { setAppointments((data ?? []) as Appointment[]); }
    setLoading(false);
  }, [filterDate, filterStatus]);

  useEffect(() => { load(); }, [load]);

  // Realtime: atualiza lista ao vivo
  useEffect(() => {
    const ch = supabase
      .channel('appointments-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, load)
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [load]);

  useEffect(() => {
    supabase.from('patients').select('id, name').eq('active', true).order('name')
      .then(({ data }) => setPatients(data ?? []));
    supabase.from('profiles').select('id, full_name').eq('active', true).in('role', ['admin','medico'])
      .then(({ data }) => setDoctors(data ?? []));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patient_id || !form.doctor_id || !form.start_at || !form.end_at) {
      toastError('Preencha todos os campos obrigatórios'); return;
    }
    if (new Date(form.end_at) <= new Date(form.start_at)) {
      toastError('Horário de fim deve ser após o início'); return;
    }
    setSaving(true);
    const { error } = await supabase.from('appointments').insert({
      ...form,
      created_by: profile?.id,
      status: 'agendado',
    });
    setSaving(false);
    if (error) {
      if (error.code === '23P01') toastError('Conflito de horário', 'Médico já tem consulta neste período');
      else toastError('Erro ao agendar', error.message);
      return;
    }
    await log('create', 'appointments', undefined, { patient_id: form.patient_id });
    success('Agendamento criado!');
    setShowModal(false);
    setForm({ patient_id: '', doctor_id: '', start_at: '', end_at: '', reason: '', teleconsulta: false });
    load();
  }

  async function updateStatus(id: string, status: Status) {
    const { error } = await supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { toastError('Erro ao atualizar status'); return; }
    await log('update_status', 'appointments', id, { status });
    info(`Status atualizado: ${STATUS_LABEL[status]}`);
    load();
  }

  // Agrupa por hora para view de dia
  const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 07h–19h
  function apptsByHour(h: number) {
    return appointments.filter((a) => new Date(a.start_at).getHours() === h);
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agenda</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Agendamentos do dia</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle view */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(['list','day'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === v
                    ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {v === 'list' ? 'Lista' : 'Dia'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Novo agendamento
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as Status | 'todos')}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="todos">Todos os status</option>
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {loading ? '...' : `${appointments.length} consulta${appointments.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* View: Lista */}
      {view === 'list' && (
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))
          ) : appointments.length === 0 ? (
            <div className="text-center py-16">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-300 dark:text-gray-700 mb-4" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8"  y1="2" x2="8"  y2="6"/>
                <line x1="3"  y1="10" x2="21" y2="10"/>
              </svg>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhuma consulta para este dia</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 text-sm text-teal-600 dark:text-teal-400 hover:underline"
              >Criar agendamento</button>
            </div>
          ) : (
            appointments.map((a) => (
              <div key={a.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                {/* Hora */}
                <div className="text-center min-w-[56px]">
                  <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100 leading-none">{fmtTime(a.start_at)}</p>
                  <p className="text-xs text-gray-400">{fmtTime(a.end_at)}</p>
                </div>

                {/* Divisor */}
                <div className="hidden sm:block w-px h-12 bg-gray-100 dark:bg-gray-800" />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/patients/${a.patient_id}`} className="font-semibold text-gray-900 dark:text-gray-100 hover:text-teal-600 dark:hover:text-teal-400 truncate">
                      {a.patient?.name ?? '—'}
                    </Link>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[a.status]}`}>
                      {STATUS_LABEL[a.status]}
                    </span>
                    {a.teleconsulta && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.88v6.24a1 1 0 0 1-1.447.89L15 14M3 8h12v8H3z"/></svg>
                        Teleconsulta
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Dr(a). {a.doctor?.full_name ?? '—'}
                    {a.reason ? ` · ${a.reason}` : ''}
                  </p>
                </div>

                {/* Ações */}
                {profile?.role !== 'enfermeiro' && (
                  <div className="flex gap-2">
                    {a.status === 'agendado' && (
                      <button
                        onClick={() => updateStatus(a.id, 'confirmado')}
                        className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs font-medium transition-colors"
                      >Confirmar</button>
                    )}
                    {a.status === 'confirmado' && (
                      <button
                        onClick={() => updateStatus(a.id, 'realizado')}
                        className="px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-medium transition-colors"
                      >Realizado</button>
                    )}
                    {['agendado','confirmado'].includes(a.status) && (
                      <button
                        onClick={() => updateStatus(a.id, 'cancelado')}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium transition-colors"
                      >Cancelar</button>
                    )}
                    {a.teleconsulta && a.status === 'confirmado' && (
                      <Link
                        to={`/teleconsulta?room=${a.id}`}
                        className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs font-medium transition-colors"
                      >Iniciar</Link>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* View: Dia (timeline) */}
      {view === 'day' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
          {hours.map((h) => {
            const appts = apptsByHour(h);
            return (
              <div key={h} className={`flex gap-4 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 ${appts.length > 0 ? 'bg-teal-50/30 dark:bg-teal-900/5' : ''}` }>
                <span className="w-12 text-sm tabular-nums font-medium text-gray-400 dark:text-gray-600 pt-0.5">{String(h).padStart(2,'0')}:00</span>
                <div className="flex-1 flex flex-wrap gap-2">
                  {appts.length === 0 ? (
                    <span className="text-sm text-gray-300 dark:text-gray-700">—</span>
                  ) : (
                    appts.map((a) => (
                      <div key={a.id} className={`rounded-xl px-3 py-2 text-xs font-medium border ${
                        a.teleconsulta
                          ? 'border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800'
                          : 'border-teal-200 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-800'
                      }`}>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{a.patient?.name ?? '—'}</p>
                        <p className="text-gray-500 dark:text-gray-400">{fmtTime(a.start_at)} – {fmtTime(a.end_at)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal novo agendamento */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Novo agendamento</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Fechar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Paciente *</label>
                <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} required
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Selecione o paciente</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Médico *</label>
                <select value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} required
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Selecione o médico</option>
                  {doctors.map((d) => <option key={d.id} value={d.id}>{d.full_name ?? d.id}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Início *</label>
                  <input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} required
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fim *</label>
                  <input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} required
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Motivo</label>
                <input type="text" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Ex: Retorno, Avaliação DAS28..."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  role="switch"
                  aria-checked={form.teleconsulta}
                  onClick={() => setForm({ ...form, teleconsulta: !form.teleconsulta })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    form.teleconsulta ? 'bg-teal-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    form.teleconsulta ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Teleconsulta</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                  {saving ? 'Salvando...' : 'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
