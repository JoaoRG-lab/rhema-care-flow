import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Flame,
  Rocket,
  Zap,
  CheckCircle,
  Clock,
  BookOpen,
  TrendingUp,
  Loader2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFn } from '@/lib/invokeEdgeFn';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface IgnitionResult {
  topic: string;
  status: string;
  confidence?: number;
  evidence_grade?: string;
  error?: string;
}

interface IgnitionStats {
  total_published: number;
  pending_review: number;
  topics_remaining: number;
}

export function IgnitionPanel() {
  const [isIgniting, setIsIgniting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [results, setResults] = useState<IgnitionResult[]>([]);
  const [stats, setStats] = useState<IgnitionStats | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { count: published } = await supabase
      .from('education_content')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    const { count: pending } = await supabase
      .from('ai_research_pipeline')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_review');

    const { count: queued } = await supabase
      .from('research_topic_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'queued');

    setStats({
      total_published: published || 0,
      pending_review: pending || 0,
      topics_remaining: queued || 0
    });
  };

  const handleSeedTopics = async () => {
    setIsSeeding(true);
    try {
      const { data, error } = await invokeEdgeFn<any>('ai-ignition', { action: 'seed_topics' });

      if (error) throw new Error(error);

      toast.success(`Seeded ${data.new_topics} new topics!`);
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error('Failed to seed topics');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleIgnite = async () => {
    setIsIgniting(true);
    setResults([]);
    setProgress(10);

    try {
      toast.info('🔥 Ignition sequence started...', { duration: 3000 });
      setProgress(20);

      const { data, error } = await supabase.functions.invoke('ai-ignition', {
        body: { action: 'ignite' }
      });

      setProgress(90);

      if (error) throw error;

      setResults(data.results || []);
      setStats(data.stats);
      setProgress(100);

      const autoPublished = data.results?.filter((r: IgnitionResult) => r.status === 'auto_published').length || 0;
      toast.success(`🚀 Ignition complete! ${autoPublished} articles auto-published.`);
    } catch (err) {
      console.error(err);
      toast.error('Ignition failed');
    } finally {
      setIsIgniting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'auto_published':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending_review':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Ignition Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Knowledge Engine Ignition</CardTitle>
                <CardDescription>
                  Automatically grow your library with verified medical content
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchStats}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-background/50 border">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats?.total_published || 0}</p>
              <p className="text-xs text-muted-foreground">Published</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-background/50 border">
              <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{stats?.pending_review || 0}</p>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-background/50 border">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{stats?.topics_remaining || 0}</p>
              <p className="text-xs text-muted-foreground">In Queue</p>
            </div>
          </div>

          {/* Progress Bar */}
          {progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSeedTopics}
              disabled={isSeeding || isIgniting}
              className="flex-1"
            >
              {isSeeding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Seed Topics
            </Button>
            <Button
              onClick={handleIgnite}
              disabled={isIgniting || isSeeding}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {isIgniting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4 mr-2" />
              )}
              🔥 IGNITE
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Ignition Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getStatusIcon(result.status)}
                      <span className="truncate font-medium text-sm">
                        {result.topic}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {result.evidence_grade && (
                        <Badge variant="outline" className="text-xs">
                          Grade {result.evidence_grade}
                        </Badge>
                      )}
                      {result.confidence && (
                        <Badge
                          className={cn(
                            'text-xs',
                            result.confidence >= 85
                              ? 'bg-green-500/10 text-green-500'
                              : result.confidence >= 70
                                ? 'bg-yellow-500/10 text-yellow-500'
                                : 'bg-red-500/10 text-red-500'
                          )}
                        >
                          {result.confidence}%
                        </Badge>
                      )}
                      <Badge
                        variant={result.status === 'auto_published' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {result.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Info Alert */}
      <Alert>
        <Flame className="h-4 w-4" />
        <AlertTitle>How Ignition Works</AlertTitle>
        <AlertDescription className="text-sm space-y-2">
          <p>
            <strong>1. Seed Topics:</strong> Populates the queue with 40+ curated rheumatology topics
          </p>
          <p>
            <strong>2. Ignite:</strong> AI generates articles, evaluates evidence quality, and auto-publishes high-confidence content (≥85% + Grade A/B)
          </p>
          <p>
            <strong>3. Continuous:</strong> Lower-confidence articles go to human review; Sentinel AI monitors for inconsistencies
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
