import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFn } from '@/lib/invokeEdgeFn';
import { toast } from 'sonner';

interface JudgeResult {
  success: boolean;
  decision: 'auto_approve' | 'human_review';
  evidence_level: string;
  grade: string;
  confidence: number;
  requires_human_review: boolean;
  auto_approved: boolean;
  reasoning: string;
}

interface SentinelResult {
  success: boolean;
  status: 'clean' | 'flagged';
  quality_score: number;
  issues_found: number;
  recommendation: string;
  flagged: boolean;
  details: any;
}

interface SentinelAlert {
  id: string;
  pipeline_id: string | null;
  content_id: string | null;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggested_action: string | null;
  is_resolved: boolean;
  created_at: string;
}

export function useAIQualitySystem() {
  const [isJudging, setIsJudging] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<SentinelAlert[]>([]);

  const judgeContent = useCallback(async (
    pipelineId: string, 
    adminEmail?: string
  ): Promise<JudgeResult | null> => {
    setIsJudging(true);
    try {
      const { data, error } = await invokeEdgeFn<any>('ai-judge', { action: 'judge', pipeline_id: pipelineId, admin_email: adminEmail });

      if (error) throw new Error(error);

      if (data.auto_approved) {
        toast.success(`Article auto-approved! Evidence: ${data.evidence_level}, Grade: ${data.grade}`);
      } else if (data.requires_human_review) {
        toast.info(`Article requires human review. Confidence: ${data.confidence}%`);
      }

      return data as JudgeResult;
    } catch (err) {
      console.error('Judge error:', err);
      toast.error('Failed to judge content');
      return null;
    } finally {
      setIsJudging(false);
    }
  }, []);

  const batchJudge = useCallback(async (adminEmail?: string) => {
    setIsJudging(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-judge', {
        body: { action: 'batch_judge', admin_email: adminEmail },
      });

      if (error) throw error;

      const autoApproved = data.results?.filter((r: any) => r.auto_approved).length || 0;
      const needsReview = data.results?.filter((r: any) => r.requires_human_review).length || 0;

      toast.success(`Processed ${data.processed} items: ${autoApproved} auto-approved, ${needsReview} need review`);
      return data;
    } catch (err) {
      console.error('Batch judge error:', err);
      toast.error('Failed to batch judge');
      return null;
    } finally {
      setIsJudging(false);
    }
  }, []);

  const monitorContent = useCallback(async (
    contentId?: string,
    pipelineId?: string
  ): Promise<SentinelResult | null> => {
    setIsMonitoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-sentinel', {
        body: { action: 'monitor', content_id: contentId, pipeline_id: pipelineId },
      });

      if (error) throw error;

      if (data.flagged) {
        toast.warning(`Content flagged! ${data.issues_found} issues found. Recommendation: ${data.recommendation}`);
      } else {
        toast.success(`Content verified. Quality score: ${data.quality_score}/100`);
      }

      return data as SentinelResult;
    } catch (err) {
      console.error('Sentinel error:', err);
      toast.error('Failed to monitor content');
      return null;
    } finally {
      setIsMonitoring(false);
    }
  }, []);

  const runSentinelPatrol = useCallback(async () => {
    setIsMonitoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-sentinel', {
        body: { action: 'patrol' },
      });

      if (error) throw error;

      const flagged = data.results?.filter((r: any) => r.flagged).length || 0;
      toast.success(`Patrol complete: ${data.patrolled} items checked, ${flagged} flagged`);
      return data;
    } catch (err) {
      console.error('Patrol error:', err);
      toast.error('Sentinel patrol failed');
      return null;
    } finally {
      setIsMonitoring(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-sentinel', {
        body: { action: 'get_alerts' },
      });

      if (error) throw error;
      setAlerts(data.alerts || []);
      return data.alerts;
    } catch (err) {
      console.error('Fetch alerts error:', err);
      return [];
    }
  }, []);

  const resolveAlert = useCallback(async (alertId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('sentinel_alerts')
      .update({
        is_resolved: true,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    if (error) {
      toast.error('Failed to resolve alert');
      return false;
    }

    toast.success('Alert resolved');
    await fetchAlerts();
    return true;
  }, [fetchAlerts]);

  return {
    isJudging,
    isMonitoring,
    alerts,
    judgeContent,
    batchJudge,
    monitorContent,
    runSentinelPatrol,
    fetchAlerts,
    resolveAlert,
  };
}
