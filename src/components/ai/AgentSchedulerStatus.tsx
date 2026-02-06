import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Moon,
  Sun,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AgentRun {
  id: string;
  agent_name: string;
  status: string;
  results: Record<string, unknown>;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export function AgentSchedulerStatus({ className }: { className?: string }) {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [currentHour, setCurrentHour] = useState(new Date().getUTCHours());

  useEffect(() => {
    fetchRuns();
    
    const interval = setInterval(() => {
      setCurrentHour(new Date().getUTCHours());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchRuns = async () => {
    const { data } = await supabase
      .from('agent_run_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    if (data) {
      setRuns(data as AgentRun[]);
    }
  };

  const isQuietHours = currentHour >= 18 && currentHour < 22;
  const isPeakHours = currentHour >= 1 && currentHour < 6;

  const getTimeStatus = () => {
    if (isQuietHours) return { label: 'Quiet Hours', icon: Moon, color: 'text-muted-foreground' };
    if (isPeakHours) return { label: 'Peak Hours', icon: Zap, color: 'text-primary' };
    return { label: 'Active', icon: Sun, color: 'text-green-500' };
  };

  const timeStatus = getTimeStatus();
  const TimeIcon = timeStatus.icon;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Agent Scheduler
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('gap-1', timeStatus.color)}>
              <TimeIcon className="h-3 w-3" />
              {timeStatus.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {currentHour}:00 UTC
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Schedule Info */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded bg-muted/50 text-center">
              <p className="font-medium">Peak</p>
              <p className="text-muted-foreground">01:00-06:00 UTC</p>
            </div>
            <div className="p-2 rounded bg-muted/50 text-center">
              <p className="font-medium">Active</p>
              <p className="text-muted-foreground">On user activity</p>
            </div>
            <div className="p-2 rounded bg-muted/50 text-center">
              <p className="font-medium">Quiet</p>
              <p className="text-muted-foreground">18:00-22:00 UTC</p>
            </div>
          </div>

          {/* Recent Runs */}
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Runs
            </p>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {runs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No agent runs yet
                  </p>
                ) : (
                  runs.map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/30 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {run.status === 'completed' && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                        {run.status === 'failed' && (
                          <XCircle className="h-3 w-3 text-destructive" />
                        )}
                        {run.status === 'running' && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        <span>{run.agent_name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(run.started_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
