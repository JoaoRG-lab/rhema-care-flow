import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

type Period = '7d' | '30d' | '90d' | '365d';

type TrendData = {
  period: string;
  metrics: {
    visits?: { count: number; period: string };
    new_patients?: { count: number; period: string };
    sms?: { total: number; sent: number; failed: number; period: string };
    payments?: { total: number; paid: number; period: string };
  };
  ai_insight: string | null;
  meta: { generated_at: string };
};

function KPICard({ title, value, sub, color }: { title: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-1 shadow-sm">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
      <p className={`text-3xl font-bold tabular-nums ${color ?? 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}

export function AIDashboard() {
  const [period, setPeriod] = useState<Period>('30d');
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchTrends(p: Period) {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('analyze-trends', {
        body: { period: p, metrics: ['visits', 'patients', 'sms', 'payments'] },
      });
      if (fnError) throw new Error(fnError.message);
      setData(result as TrendData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar tendencias.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTrends(period); }, [period]);

  const PERIODS: { label: string; value: Period }[] = [
    { label: '7 dias', value: '7d' },
    { label: '30 dias', value: '30d' },
    { label: '90 dias', value: '90d' },
    { label: '1 ano', value: '365d' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Painel de Tendencias</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Metricas operacionais com analise de IA</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p.value
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => fetchTrends(period)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 disabled:opacity-50 transition-colors"
            aria-label="Atualizar dados"
          >
            {loading ? '...' : '↻'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      {loading && !data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-28 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              title="Consultas"
              value={data.metrics.visits?.count ?? '-'}
              sub={`Ultimos ${data.period}`}
              color="text-teal-600 dark:text-teal-400"
            />
            <KPICard
              title="Novos Pacientes"
              value={data.metrics.new_patients?.count ?? '-'}
              sub={`Ultimos ${data.period}`}
              color="text-blue-600 dark:text-blue-400"
            />
            <KPICard
              title="SMS Enviados"
              value={data.metrics.sms?.sent ?? '-'}
              sub={`${data.metrics.sms?.failed ?? 0} falhas`}
              color="text-purple-600 dark:text-purple-400"
            />
            <KPICard
              title="Pagamentos Aprovados"
              value={data.metrics.payments?.paid ?? '-'}
              sub={`de ${data.metrics.payments?.total ?? 0} total`}
              color="text-green-600 dark:text-green-400"
            />
          </div>

          {/* Insight de IA */}
          {data.ai_insight && (
            <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-800 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600 dark:text-teal-400" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-teal-700 dark:text-teal-300 mb-1">Insight da IA — GPT-4o</p>
                  <p className="text-sm text-teal-800 dark:text-teal-200 leading-relaxed">{data.ai_insight}</p>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 text-right">
            Atualizado em {new Date(data.meta.generated_at).toLocaleString('pt-BR')}
          </p>
        </>
      )}
    </div>
  );
}

export default AIDashboard;
