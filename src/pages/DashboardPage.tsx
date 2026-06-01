import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PopulationMonitoringCard } from '@/components/monitoring/PopulationMonitoringCard';

interface KPI {
  patients: number;
  todayAppts: number;
  pendingAppts: number;
  scoresThisMonth: number;
}

interface SeriesPoint { label: string; consultas: number; scores: number; }
interface StatusDist { name: string; value: number; color: string; }
interface RecentTeleconsulta {
  id: string;
  scheduled_date: string;
  start_time: string;
  status: string;
  patient_name: string | null;
  patient_cards?: { full_name?: string | null; patient_code?: string | null } | null;
}

const STATUS_COLOR: Record<string, string> = {
  scheduled: '#60a5fa',
  in_progress: '#2dd4bf',
  completed: '#4ade80',
  cancelled: '#f87171',
};

const clinicalActions = [
  {
    to: '/scores',
    title: 'Scores e critérios',
    description: 'DAS28, CDAI, SDAI, BASDAI, ASDAS, SLEDAI, WPI/SSS e gráficos longitudinais.',
    accent: 'text-teal-700 bg-teal-50 border-teal-100 dark:text-teal-300 dark:bg-teal-950/30 dark:border-teal-900',
    icon: 'M3 3v18h18M7 15l3-3 3 2 5-7',
  },
  {
    to: '/therapeutic-safety',
    title: 'Segurança Rx',
    description: 'Checklist pré-imunossupressão, risco infeccioso, vacinas, exames basais e alertas terapêuticos.',
    accent: 'text-amber-700 bg-amber-50 border-amber-100 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-900',
    icon: 'M9 12l2 2 4-4M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z',
  },
  {
    to: '/patients',
    title: 'Prescrição no prontuário',
    description: 'Abra um paciente e use o compositor estruturado com templates, alertas e impressão/PDF.',
    accent: 'text-purple-700 bg-purple-50 border-purple-100 dark:text-purple-300 dark:bg-purple-950/30 dark:border-purple-900',
    icon: 'M9 12h6m-6 4h6M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
  },
];

function KPICard({ label, value, icon, color, sub }: {
  label: string; value: number | string; icon: React.ReactNode;
  color: string; sub?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ClinicalActionCard({ action }: { action: typeof clinicalActions[number] }) {
  return (
    <Link to={action.to} className={`group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${action.accent}`}>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 shadow-sm dark:bg-gray-900/70">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d={action.icon} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-sm font-bold text-gray-950 dark:text-gray-100">{action.title}</h2>
      <p className="mt-1 text-xs leading-relaxed opacity-80">{action.description}</p>
      <span className="mt-4 inline-flex text-xs font-semibold group-hover:underline">Abrir módulo →</span>
    </Link>
  );
}

function monthBounds(yearMonth: string) {
  const [year, month] = yearMonth.split('-').map(Number);
  const start = `${yearMonth}-01`;
  const next = new Date(year, month, 1).toISOString().slice(0, 10);
  return { start, next };
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [kpi, setKpi] = useState<KPI>({ patients: 0, todayAppts: 0, pendingAppts: 0, scoresThisMonth: 0 });
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [dist, setDist] = useState<StatusDist[]>([]);
  const [recent, setRecent] = useState<RecentTeleconsulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const today = new Date().toISOString().split('T')[0];
        const monthStart = today.slice(0, 7) + '-01';

        const [pRes, teleTodayRes, telePendRes, scoresRes, teleStatusRes, recentRes] = await Promise.all([
          supabase.from('patient_cards').select('*', { count: 'exact', head: true }).eq('active', true),
          supabase.from('teleconsultas').select('*', { count: 'exact', head: true }).eq('scheduled_date', today),
          supabase.from('teleconsultas').select('*', { count: 'exact', head: true }).in('status', ['scheduled', 'in_progress']),
          supabase.from('score_entries').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
          supabase.from('teleconsultas').select('status'),
          supabase
            .from('teleconsultas')
            .select('id, scheduled_date, start_time, status, patient_name, patient_cards(full_name, patient_code)')
            .order('scheduled_date', { ascending: false })
            .order('start_time', { ascending: false })
            .limit(6),
        ]);

        const possibleError = pRes.error || teleTodayRes.error || telePendRes.error || scoresRes.error || teleStatusRes.error || recentRes.error;
        if (possibleError) throw possibleError;

        setKpi({
          patients: pRes.count ?? 0,
          todayAppts: teleTodayRes.count ?? 0,
          pendingAppts: telePendRes.count ?? 0,
          scoresThisMonth: scoresRes.count ?? 0,
        });

        const statusMap: Record<string, number> = {};
        (teleStatusRes.data ?? []).forEach(({ status }: { status: string }) => {
          statusMap[status] = (statusMap[status] ?? 0) + 1;
        });
        setDist(Object.entries(statusMap).map(([name, value]) => ({ name: name.replace('_', ' ').replace(/^./, (c) => c.toUpperCase()), value, color: STATUS_COLOR[name] ?? '#94a3b8' })));
        setRecent((recentRes.data ?? []) as RecentTeleconsulta[]);

        const months: SeriesPoint[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const ym = d.toISOString().slice(0, 7);
          const label = d.toLocaleString('pt-BR', { month: 'short' });
          const { start, next } = monthBounds(ym);
          const [cRes, sRes] = await Promise.all([
            supabase.from('teleconsultas').select('*', { count: 'exact', head: true }).gte('scheduled_date', start).lt('scheduled_date', next),
            supabase.from('score_entries').select('*', { count: 'exact', head: true }).gte('created_at', start).lt('created_at', next),
          ]);
          months.push({ label, consultas: cRes.count ?? 0, scores: sRes.count ?? 0 });
        }
        setSeries(months);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Erro ao carregar dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{greeting}, {profile?.full_name?.split(' ')[0] ?? 'Bem-vindo'} 👋</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {loadError && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">Erro ao carregar dados: {loadError}</div>}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Pacientes ativos" value={kpi.patients} color="bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} />
          <KPICard label="Teleconsultas hoje" value={kpi.todayAppts} color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" sub="agendadas para hoje" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
          <KPICard label="Pendentes" value={kpi.pendingAppts} color="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" sub="scheduled / in progress" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
          <KPICard label="Scores este mês" value={kpi.scoresThisMonth} color="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} />
        </div>
      )}

      <PopulationMonitoringCard />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {clinicalActions.map((action) => <ClinicalActionCard key={action.to} action={action} />)}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Atividade nos últimos 6 meses</h2>
          {loading ? <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" /> : <ResponsiveContainer width="100%" height={200}><AreaChart data={series} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} /><XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} /><Tooltip /><Area type="monotone" dataKey="consultas" stroke="#0d9488" fill="#0d9488" fillOpacity={0.16} strokeWidth={2} name="Teleconsultas" /><Area type="monotone" dataKey="scores" stroke="#818cf8" fill="#818cf8" fillOpacity={0.16} strokeWidth={2} name="Scores" /></AreaChart></ResponsiveContainer>}
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Status das teleconsultas</h2>
          {loading ? <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" /> : dist.length === 0 ? <div className="h-48 flex items-center justify-center text-sm text-gray-400">Sem dados</div> : <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={dist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3}>{dist.map((entry, i) => <Cell key={i} fill={entry.color} />)}</Pie><Tooltip formatter={(v) => [`${v} teleconsultas`]} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-800"><h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Teleconsultas recentes</h2><Link to="/teleconsulta" className="text-xs text-teal-600 dark:text-teal-400 hover:underline">Ver teleconsultas</Link></div>
          {loading ? <div className="px-5 py-10 text-center text-sm text-gray-400">Carregando...</div> : recent.length === 0 ? <div className="px-5 py-10 text-center text-sm text-gray-400">Nenhuma teleconsulta registrada</div> : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {recent.map((a) => {
                const name = a.patient_name || a.patient_cards?.full_name || a.patient_cards?.patient_code || '—';
                return <li key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"><div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{name}</p><p className="text-xs text-gray-500 dark:text-gray-500">{a.scheduled_date} · {a.start_time}</p></div><span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">{a.status}</span></li>;
              })}
            </ul>
          )}
        </div>
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-5 text-white shadow-sm">
          <h2 className="text-lg font-bold mb-2">Ações rápidas</h2>
          <div className="space-y-2 mt-4">
            <Link to="/patients/new" className="block bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 text-sm transition-colors">+ Novo paciente</Link>
            <Link to="/teleconsulta" className="block bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 text-sm transition-colors">Iniciar teleconsulta</Link>
            <Link to="/scores" className="block bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 text-sm transition-colors">Calcular score clínico</Link>
            <Link to="/therapeutic-safety" className="block bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 text-sm transition-colors">Checar segurança terapêutica</Link>
            <Link to="/reports" className="block bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 text-sm transition-colors">Gerar relatório</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
