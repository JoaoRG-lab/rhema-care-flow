import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { calculateMulticlinicMetrics, type MulticlinicMetrics } from '@/lib/multiclinicMetricsEngine';

type CountResult = { count: number | null; error: { message: string } | null };

type CountDiagnostic = { table: string; error: string };

async function safeCount(table: string, userId: string, configure?: (query: any) => any, diagnostics?: CountDiagnostic[]): Promise<number> {
  try {
    let query = (supabase as unknown as { from: (name: string) => any })
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (configure) query = configure(query);
    const { count, error } = await query as CountResult;

    if (error) {
      diagnostics?.push({ table, error: error.message });
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    diagnostics?.push({ table, error: error instanceof Error ? error.message : 'Unknown count error' });
    return 0;
  }
}

export function useMulticlinicMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<MulticlinicMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<CountDiagnostic[]>([]);

  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setMetrics(null);
      setDiagnostics([]);
      return;
    }

    setLoading(true);
    setError(null);
    const countDiagnostics: CountDiagnostic[] = [];

    try {
      const today = new Date().toISOString().slice(0, 10);
      const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const [
        activePatients,
        activeProblems,
        overdueMonitoring,
        upcomingMonitoring30d,
        completedProtocols,
        incompleteProtocols,
        scheduledFollowups,
        overdueFollowups,
        prescriptions,
        signedPrescriptions,
      ] = await Promise.all([
        safeCount('patient_cards', user.id, (q) => q.eq('active', true), countDiagnostics),
        safeCount('problem_instances', user.id, (q) => q.in('status', ['active', 'monitoring', 'uncertain']), countDiagnostics),
        safeCount('monitoring_events', user.id, (q) => q.neq('status', 'completed').lt('due_date', today), countDiagnostics),
        safeCount('monitoring_events', user.id, (q) => q.neq('status', 'completed').gte('due_date', today).lte('due_date', in30), countDiagnostics),
        safeCount('therapy_safety_checklists', user.id, (q) => q.gte('completion', 90), countDiagnostics),
        safeCount('therapy_safety_checklists', user.id, (q) => q.lt('completion', 90), countDiagnostics),
        safeCount('problem_followups', user.id, undefined, countDiagnostics),
        safeCount('problem_followups', user.id, (q) => q.lt('due_date', today).neq('status', 'completed'), countDiagnostics),
        safeCount('prescriptions', user.id, undefined, countDiagnostics),
        safeCount('prescriptions', user.id, (q) => q.eq('status', 'signed'), countDiagnostics),
      ]);

      setMetrics(calculateMulticlinicMetrics({
        activePatients,
        activeProblems,
        overdueMonitoring,
        upcomingMonitoring30d,
        criticalSafetyAlerts: 0,
        incompleteProtocols,
        completedProtocols,
        scheduledFollowups,
        overdueFollowups,
        prescriptions,
        signedPrescriptions,
      }));
      setDiagnostics(countDiagnostics);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar métricas multiclínicas.');
      setMetrics(null);
      setDiagnostics(countDiagnostics);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, diagnostics, refetch: fetchMetrics };
}
