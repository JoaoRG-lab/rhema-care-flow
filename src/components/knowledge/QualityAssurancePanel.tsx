import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Scale,
  Shield,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  Zap,
  RefreshCw,
  Mail,
  FileCheck,
  TrendingUp,
  Award,
  AlertCircle,
} from 'lucide-react';
import { useAIQualitySystem } from '@/hooks/useAIQualitySystem';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PipelineItem {
  id: string;
  topic: string;
  generated_title?: string;
  status: string;
  evidence_level?: string;
  evidence_grade?: string;
  judge_decision?: string;
  judge_confidence?: number;
  judge_reasoning?: string;
  requires_human_review?: boolean;
  auto_approved?: boolean;
  sentinel_flagged?: boolean;
  created_at: string;
}

const EVIDENCE_LEVELS: Record<string, string> = {
  '1a': 'Systematic Review of RCTs',
  '1b': 'Individual RCT',
  '1c': 'All-or-none',
  '2a': 'SR of Cohort Studies',
  '2b': 'Cohort Study',
  '3a': 'SR of Case-Control',
  '3b': 'Case-Control Study',
  '4': 'Case Series',
  '5': 'Expert Opinion',
};

const GRADE_COLORS: Record<string, string> = {
  'A': 'bg-green-500/10 text-green-600 border-green-500/30',
  'B': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  'C': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  'D': 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  'I': 'bg-gray-500/10 text-gray-600 border-gray-500/30',
};

export function QualityAssurancePanel() {
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [adminEmail, setAdminEmail] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    autoApproved: 0,
    humanReview: 0,
    flagged: 0,
  });

  const {
    isJudging,
    isMonitoring,
    alerts,
    batchJudge,
    runSentinelPatrol,
    fetchAlerts,
    resolveAlert,
  } = useAIQualitySystem();

  useEffect(() => {
    fetchData();
    fetchAlerts();
  }, [fetchAlerts]);

  const fetchData = async () => {
    const { data } = await supabase
      .from('ai_research_pipeline')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setItems(data as PipelineItem[]);
      setStats({
        total: data.length,
        autoApproved: data.filter(d => d.auto_approved).length,
        humanReview: data.filter(d => d.requires_human_review && !d.auto_approved).length,
        flagged: data.filter(d => d.sentinel_flagged).length,
      });
    }
  };

  const handleBatchJudge = async () => {
    await batchJudge(adminEmail || undefined);
    await fetchData();
  };

  const handlePatrol = async () => {
    await runSentinelPatrol();
    await fetchData();
    await fetchAlerts();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            AI Quality Assurance System
          </h2>
          <p className="text-sm text-muted-foreground">
            Dual AI system: Judge for triage, Sentinel for continuous monitoring
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.autoApproved}</p>
                <p className="text-xs text-muted-foreground">Auto-Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.humanReview}</p>
                <p className="text-xs text-muted-foreground">Needs Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.flagged}</p>
                <p className="text-xs text-muted-foreground">Sentinel Flagged</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            AI Control Center
          </CardTitle>
          <CardDescription>
            Run AI Judge for evidence-based triage or Sentinel for quality patrol
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="admin-email">Academic Reviewer Email (for human review requests)</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="your-email@institution.edu"
                className="mt-1.5"
              />
            </div>
            <Button
              onClick={handleBatchJudge}
              disabled={isJudging}
              className="gap-2"
            >
              {isJudging ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Scale className="h-4 w-4" />
              )}
              Run AI Judge
            </Button>
            <Button
              onClick={handlePatrol}
              disabled={isMonitoring}
              variant="outline"
              className="gap-2"
            >
              {isMonitoring ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              Sentinel Patrol
            </Button>
          </div>

          <Alert>
            <Scale className="h-4 w-4" />
            <AlertTitle>Evidence-Based Triage</AlertTitle>
            <AlertDescription className="text-sm">
              Articles are evaluated using Oxford OCEBM evidence levels (1a-5) and GRADE recommendations (A-I).
              High-quality evidence (1a-2a, Grade A-B) with confidence ≥85% is auto-published.
              Lower evidence or experimental content requires human review.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Review Queue</TabsTrigger>
          <TabsTrigger value="alerts">
            Sentinel Alerts
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">{alerts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Auto-Approved</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <Card>
            <CardHeader>
              <CardTitle>Human Review Queue</CardTitle>
              <CardDescription>
                Articles requiring expert validation before publication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {items.filter(i => i.requires_human_review && !i.auto_approved).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            {item.evidence_level && (
                              <Badge variant="outline" className="font-mono">
                                Level {item.evidence_level}
                              </Badge>
                            )}
                            {item.evidence_grade && (
                              <Badge className={cn('font-bold', GRADE_COLORS[item.evidence_grade])}>
                                Grade {item.evidence_grade}
                              </Badge>
                            )}
                            {item.judge_confidence && (
                              <Badge variant="secondary">
                                {item.judge_confidence}% confidence
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold truncate">
                            {item.generated_title || item.topic}
                          </h3>
                          {item.judge_reasoning && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {item.judge_reasoning}
                            </p>
                          )}
                          {item.evidence_level && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {EVIDENCE_LEVELS[item.evidence_level] || 'Unknown level'}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Mail className="h-3 w-3" />
                            Send to Expert
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.filter(i => i.requires_human_review && !i.auto_approved).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No items pending human review</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Sentinel Alerts
              </CardTitle>
              <CardDescription>
                Content flagged by continuous monitoring for inconsistencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 border rounded-lg border-l-4"
                      style={{
                        borderLeftColor: alert.severity === 'critical' ? '#ef4444' :
                          alert.severity === 'high' ? '#f97316' :
                          alert.severity === 'medium' ? '#eab308' : '#3b82f6'
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{alert.alert_type}</Badge>
                          </div>
                          <p className="font-medium">{alert.description}</p>
                          {alert.suggested_action && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Suggested: {alert.suggested_action}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active sentinel alerts</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Auto-Approved Content
              </CardTitle>
              <CardDescription>
                High-quality evidence automatically published
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {items.filter(i => i.auto_approved).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border rounded-lg bg-green-500/5 border-green-500/20"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge className="bg-green-500/10 text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Auto-Approved
                            </Badge>
                            {item.evidence_level && (
                              <Badge variant="outline" className="font-mono">
                                Level {item.evidence_level}
                              </Badge>
                            )}
                            {item.evidence_grade && (
                              <Badge className={cn('font-bold', GRADE_COLORS[item.evidence_grade])}>
                                Grade {item.evidence_grade}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold">
                            {item.generated_title || item.topic}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Confidence: {item.judge_confidence}% • {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {item.sentinel_flagged && (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {items.filter(i => i.auto_approved).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No auto-approved content yet. Run the AI Judge to process articles.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
