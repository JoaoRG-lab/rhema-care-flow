import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface KPI {
  patients:       number;
  todayAppts:     number;
  pendingAppts:   number;
  scoresThisMonth:number;
}

interface SeriesPoint { label: string; consultas: number; scores: number; }
interface StatusDist   { name: string; value: number; color: string; }
interface RecentAppt {
  id: string; start_at: string; status: string;
  patient: { name: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  agendado:   '#60a5fa',
  confirmado: '#2dd4bf',
  realizado:  '#4ade80',
  cancelado:  '#f87171',
  falta:      '#fb923c',
};

function KPICard({ label, value, icon, color, sub }: {
  label: string; value: number | string; icon: React.ReactNode;
  color: string; sub?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const [kpi,     setKpi]     = useState<KPI>({ patients: 0, todayAppts: 0, pendingAppts: 0, scoresThisMonth: 0 });
  const [series,  setSeries]  = useState<SeriesPoint[]>([]);
  const [dist,    setDist]    = useState<StatusDist[]>([]);
  const [recent,  setRecent]  = useState<RecentAppt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const today     = new Date().toISOString().split('T')[0];
      const monthStart= today.slice(0, 7) + '-01';

      const [pRes, apptTodayRes, apptPendRes, scoresRes, apptStatusRes, recentRes] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('appointments').select('*', { count: 'exact', head: true })
          .gte('start_at', `${today}T00:00:00`).lte('start_at', `${today}T23:59:59`),
        supabase.from('appointments').select('*', { count: 'exact', head: true })
          .in('status', ['agendado', 'confirmado']),
        supabase.from('scores').select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart),
        supabase.from('appointments').select('status'),
        supabase.from('appointments')
          .select('id, start_at, status, patient:patients(name)')
          .order('start_at', { ascending: false }).limit(6),
      ]);

      setKpi({
        patients:        pRes.count        ?? 0,
        todayAppts:      apptTodayRes.count ?? 0,
        pendingAppts:    apptPendRes.count  ?? 0,
        scoresThisMonth: scoresRes.count    ?? 0,
      });

      // Distribuicao de status
      const statusMap: Record<string, number> = {};
      (apptStatusRes.data ?? []).forEach(({ status }: { status: string }) => {
        statusMap[status] = (statusMap[status] ?? 0) + 1;
      });
      setDist(
        Object.entries(statusMap).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: STATUS_COLOR[name] ?? '#94a3b8',
        }))
      );

      setRecent((recentRes.data ?? []) as RecentAppt[]);

      // Serie temporal: ultimos 6 meses
      const months: SeriesPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const d  = new Date();
        d.setMonth(d.getMonth() - i);
        const ym = d.toISOString().slice(0, 7);
        const label = d.toLocaleString('pt-BR', { month: 'short' });

        const [cRes, sRes] = await Promise.all([
          supabase.from('appointments').select('*', { count: 'exact', head: true })
            .gte('start_at', `${ym}-01`).lt('start_at', `${ym}-32`),
          supabase.from('scores').select('*', { count: 'exact', head: true })
            .gte('created_at', `${ym}-01`).lt('created_at', `${ym}-32`),
        ]);
        months.push({ label, consultas: cRes.count ?? 0, scores: sRes.count ?? 0 });
      }
      setSeries(months);
      setLoading(false);
    }
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Saudacao */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {greeting}, {profile?.full_name?.split(' ')[0] ?? 'Bem-vindo'} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Pacientes ativos" value={kpi.patients}
            color="bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            }
          />
          <KPICard
            label="Consultas hoje" value={kpi.todayAppts}
            color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            }
            sub="agendadas para hoje"
          />
          <KPICard
            label="Pendentes" value={kpi.pendingAppts}
            color="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            }
            sub="aguardando confirmacao"
          />
          <KPICard
            label="Scores este mês" value={kpi.scoresThisMonth}
            color="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            }
          />
        </div>
      )}

      {/* Graficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area chart — 6 meses */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Atividade nos últimos 6 meses</h2>
          {loading ? (
            <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={series} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gConsultas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gScores" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--tw-prose-bg, #fff)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="consultas" stroke="#0d9488" fill="url(#gConsultas)" strokeWidth={2} name="Consultas" />
                <Area type="monotone" dataKey="scores"    stroke="#818cf8" fill="url(#gScores)"    strokeWidth={2} name="Scores" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart — status */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Status das consultas</h2>
          {loading ? (
            <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ) : dist.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={dist} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={70} innerRadius={40}
                  paddingAngle={3}
                >
                  {dist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} consultas`]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Consultas recentes + atalhos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recentes */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Consultas recentes</h2>
            <Link to="/schedule" className="text-xs text-teal-600 dark:text-teal-400 hover:underline">Ver agenda</Link>
          </div>
          {loading ? (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 px-5 py-3">
                  <div className="w-24 h-4 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  <div className="flex-1 h-4 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">Nenhuma consulta registrada</div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {recent.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{a.patient?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(a.start_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    a.status === 'realizado'  ? 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-300'  :
                    a.status === 'cancelado'  ? 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-300'    :
                    a.status === 'confirmado' ? 'bg-teal-100   text-teal-700   dark:bg-teal-900/30   dark:text-teal-300'   :
                    a.status === 'falta'      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                               'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-300'
                  }`}>{a.status.charAt(0).toUpperCase() + a.status.slice(1)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Atalhos rapidos */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-1">Atalhos rápidos</h2>
          {[
            { to: '/patients/new', label: 'Novo paciente',    icon: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M22 11h-6', color: 'text-teal-600   dark:text-teal-400'   },
            { to: '/schedule',     label: 'Agendar consulta', icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', color: 'text-blue-600    dark:text-blue-400'    },
            { to: '/teleconsulta', label: 'Teleconsulta',     icon: 'M15 10l4.553-2.069A1 1 0 0 1 21 8.88v6.24a1 1 0 0 1-1.447.89L15 14M3 8h12v8H3z',              color: 'text-purple-600  dark:text-purple-400'  },
            { to: '/reports',      label: 'Gerar relatório',  icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8', color: 'text-orange-600  dark:text-orange-400'  },
          ].map(({ to, label, icon, color }) => (
            <Link
              key={to} to={to}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-teal-200 dark:hover:border-teal-800 hover:shadow-md transition-all group"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`${color} group-hover:scale-110 transition-transform`} aria-hidden="true">
                <path d={icon} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="ml-auto text-gray-300 dark:text-gray-700 group-hover:text-teal-500 transition-colors" aria-hidden="true">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
