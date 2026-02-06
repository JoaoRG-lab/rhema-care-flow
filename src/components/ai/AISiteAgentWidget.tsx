import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Bot,
  Sparkles,
  TrendingUp,
  Search,
  Shield,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle,
  RefreshCw,
  Brain,
  Lightbulb,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AgentResult {
  name: string;
  suggestions?: Array<{
    topic?: string;
    initiative?: string;
    reason?: string;
    importance?: string;
    priority?: number;
    impact?: string;
  }>;
  error?: string;
  timestamp: string;
}

interface AgentResponse {
  success: boolean;
  agent: string;
  run_at: string;
  results: { [key: string]: AgentResult };
}

export function AISiteAgentWidget({ className }: { className?: string }) {
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastRun, setLastRun] = useState<AgentResponse | null>(null);
  const [pulseActive, setPulseActive] = useState(true);

  // Simulate active state with pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseActive(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const runAgent = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-site-agent', {
        body: { task_type: 'all' },
      });

      if (error) throw error;

      setLastRun(data as AgentResponse);
      toast.success('AI Agent completed analysis!');
    } catch (err: any) {
      console.error('Agent error:', err);
      toast.error(err.message || 'Agent run failed');
    } finally {
      setIsRunning(false);
    }
  };

  const totalSuggestions = lastRun
    ? Object.values(lastRun.results).reduce(
        (sum, r) => sum + (r.suggestions?.length || 0),
        0
      )
    : 0;

  return (
    <Card className={cn('border-primary/20 overflow-hidden', className)}>
      {/* Animated gradient header */}
      <div className="h-1 bg-gradient-to-r from-primary via-[hsl(165_60%_48%)] to-[hsl(42_85%_55%)] animate-pulse" />
      
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "relative h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center",
                pulseActive && "animate-pulse"
              )}>
                <Brain className="h-5 w-5 text-white" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-success animate-ping" />
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-success" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  AI Site Agent
                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                    Active
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Continuously improving UHS Health OS
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={runAgent}
                disabled={isRunning}
                className="gap-1"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {isRunning ? 'Running...' : 'Run Now'}
              </Button>
              <CollapsibleTrigger asChild>
                <Button size="icon" variant="ghost">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Agent Capabilities */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>Trend Discovery</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                <Search className="h-4 w-4 text-blue-500" />
                <span>Gap Analysis</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                <Shield className="h-4 w-4 text-purple-500" />
                <span>Quality Check</span>
              </div>
            </div>

            {/* Results */}
            {lastRun && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last run:</span>
                  <span className="font-medium">
                    {new Date(lastRun.run_at).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">
                    Generated <strong>{totalSuggestions}</strong> improvement suggestions
                  </span>
                </div>

                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {Object.entries(lastRun.results).map(([key, result]) => (
                      <div key={key} className="p-3 rounded-lg bg-muted/30 space-y-2">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-warning" />
                          <span className="font-medium text-sm">{result.name}</span>
                          {result.suggestions && (
                            <Badge variant="secondary" className="text-xs">
                              {result.suggestions.length} items
                            </Badge>
                          )}
                        </div>
                        {result.suggestions?.slice(0, 2).map((s, i) => (
                          <div key={i} className="text-xs text-muted-foreground pl-6">
                            • {s.topic || s.initiative}
                            {s.priority && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                P{s.priority}
                              </Badge>
                            )}
                          </div>
                        ))}
                        {(result.suggestions?.length || 0) > 2 && (
                          <div className="text-xs text-muted-foreground pl-6">
                            +{(result.suggestions?.length || 0) - 2} more...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {!lastRun && !isRunning && (
              <div className="text-center py-6 text-muted-foreground">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Click "Run Now" to analyze the platform</p>
              </div>
            )}

            {isRunning && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm">AI Agent analyzing platform...</span>
                </div>
                <Progress value={33} className="h-1" />
                <p className="text-xs text-muted-foreground">
                  Discovering trends, analyzing gaps, checking quality standards...
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
