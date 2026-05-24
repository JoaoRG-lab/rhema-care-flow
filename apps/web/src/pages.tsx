import { useEffect, useMemo, useState } from 'react';
import { api, type Appointment, type Patient } from './api';
import { Header } from './Layout';

function Alert({ message }: { message: string }) {
  return message ? <div className="alert">{message}</div> : null;
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card kpi">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function Dashboard() {
  const [data, setData] = useState<{ patients: number; appointments: number; scheduled_today: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<typeof data>('/api/dashboard').then(setData).catch((err) => setError(err.message));
  }, []);

  return (
    <section>
      <Header title="Dashboard" subtitle="Visão operacional do núcleo clínico multi-especialidade." />
      <Alert message={error} />
      <div className="grid cards">
        <Kpi label="Pacientes" value={data?.patients ?? '—'} />
        <Kpi label="Agendamentos" value={data?.appointments ?? '—'} />
        <Kpi label="Hoje" value={data?.scheduled_today ?? '—'} />
      </div>
      <div className="card">
        <h2>Escopo do MVP</h2>
        <p>
          Base soberana para pacientes, agenda, scores e futura camada IA. Sem Vercel, Supabase Auth, OAuth ou Magic Link neste núcleo.
        </p>
      </div>
    </section>
  );
}

export function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setPatients(await api<Patient[]>('/api/patients'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pacientes');
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <section>
      <Header title="Pacientes" subtitle="Cadastro clínico geral, com suporte futuro a linhas de cuidado por especialidade." />
      <Alert message={error} />
      <div className="card table-card">
        <table>
          <thead><tr><th>Nome</th><th>Diagnóstico / linha</th><th>Contato</th></tr></thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td>{patient.full_name}</td>
                <td>{patient.diagnosis || '—'}</td>
                <td>{patient.phone || patient.email || '—'}</td>
              </tr>
            ))}
            {patients.length === 0 && <tr><td colSpan={3}>Nenhum paciente cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function NewPatient({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ full_name: '', diagnosis: '', phone: '', email: '', notes: '' });
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await api('/api/patients', { method: 'POST', body: JSON.stringify(form) });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar paciente');
    }
  }

  return (
    <section>
      <Header title="Novo paciente" subtitle="Registro mínimo para qualquer linha clínica do UHS HealthOS." />
      <Alert message={error} />
      <form className="card form" onSubmit={submit}>
        <input placeholder="Nome completo" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <input placeholder="Diagnóstico, condição ou linha de cuidado" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
        <input placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <textarea placeholder="Notas clínicas iniciais" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button>Criar paciente</button>
      </form>
    </section>
  );
}

export function Schedule() {
  const today = new Date().toISOString().slice(0, 10);
  const [items, setItems] = useState<Appointment[]>([]);
  const [form, setForm] = useState({ patient_name: '', scheduled_date: today, start_time: '08:00', kind: 'consulta', notes: '' });
  const [error, setError] = useState('');

  async function load() {
    try {
      setItems(await api<Appointment[]>('/api/appointments'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar agenda');
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await api('/api/appointments', { method: 'POST', body: JSON.stringify(form) });
      setForm({ ...form, patient_name: '', notes: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao agendar');
    }
  }

  return (
    <section>
      <Header title="Agenda" subtitle="Consultas, teleconsultas e pontos de cuidado." />
      <Alert message={error} />
      <form className="card form inline" onSubmit={submit}>
        <input placeholder="Paciente" value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} />
        <input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
        <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
        <input placeholder="Tipo" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} />
        <button>Agendar</button>
      </form>
      <div className="card table-card">
        <table>
          <thead><tr><th>Paciente</th><th>Data</th><th>Hora</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((item) => <tr key={item.id}><td>{item.patient_name}</td><td>{item.scheduled_date}</td><td>{item.start_time}</td><td>{item.status}</td></tr>)}
            {items.length === 0 && <tr><td colSpan={4}>Nenhum agendamento.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function Scores() {
  const [tj, setTj] = useState(0);
  const [ts, setTs] = useState(0);
  const [crp, setCrp] = useState(0);
  const [vas, setVas] = useState(0);
  const das28 = useMemo(() => Number((0.56 * Math.sqrt(tj) + 0.28 * Math.sqrt(ts) + 0.36 * Math.log(crp + 1) + 0.014 * vas + 0.96).toFixed(2)), [tj, ts, crp, vas]);

  return (
    <section>
      <Header title="Scores" subtitle="Calculadoras clínicas locais. Reumatologia é o primeiro pacote vertical; o módulo é extensível." />
      <div className="card form">
        <h2>DAS28-CRP</h2>
        <input type="number" placeholder="Articulações dolorosas" value={tj} onChange={(e) => setTj(Number(e.target.value))} />
        <input type="number" placeholder="Articulações edemaciadas" value={ts} onChange={(e) => setTs(Number(e.target.value))} />
        <input type="number" placeholder="PCR" value={crp} onChange={(e) => setCrp(Number(e.target.value))} />
        <input type="number" placeholder="EVA global" value={vas} onChange={(e) => setVas(Number(e.target.value))} />
        <div className="result">DAS28-CRP: <strong>{das28}</strong></div>
      </div>
    </section>
  );
}
