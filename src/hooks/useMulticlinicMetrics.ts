import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { calculateMulticlinicMetrics, type MulticlinicMetrics } from '@/lib/multiclinicMetricsEngine';

type CountResult = { count: number | null; error: { message: string } | null };

async function safeCount(table: string, userId: string, configure?: (query: any) => any): Promise<number> {
  let query = (supabase as unknown as { from: (name: string) => any })
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (configure) query = configure(query);
  const { count, error } = await query as CountResult;
  if (error) return 0;
  return count ?? 0;
}

export function useMulticlinicMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<MulticlinicMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setMetrics(null);
      return;
    }

    setLoading(true);
    setError(null);

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
        safeCount('patient_cards', user.id, (q) => q.eq('active', true)),
        safeCount('problem_instances', user.id, (q) => q.in('status', ['active', 'monitoring', 'uncertain'])),
        safeCount('monitoring_events', user.id, (q) => q.neq('status', 'completed').lt('due_date', today)),
        safeCount('monitoring_events', user.id, (q) => q.neq('status', 'completed').gte('due_date', today).lte('due_date', in30)),
        safeCount('therapy_safety_checklists', user.id, (q) => q.gte('completion', 90)),
        safeCount('therapy_safety_checklists', user.id, (q) => q.lt('completion', 90)),
        safeCount('problem_followups', user.id),
        safeCount('problem_followups', user.id, (q) => q.lt('due_date', today).neq('status', 'completed')),
        safeCount('prescriptions', user.id),
        safeCount('prescriptions', user.id, (q) => q.eq('status', 'signed')),
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar métricas multiclínicas.');
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
}
