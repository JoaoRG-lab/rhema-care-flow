import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Coins,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Activity,
  ArrowLeft,
  Zap,
  CreditCard,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { useAICredits } from '@/hooks/useAICredits';
import { PaywallDialog } from '@/components/billing/PaywallDialog';

interface AgentRun {
  agent_name: string;
  status: string;
  started_at: string;
  completed_at: string | null;
}

const FREE_AI_BALANCE_USD = 1; // Lovable AI free monthly balance
const FREE_CLOUD_BALANCE_USD = 25; // Lovable Cloud free monthly balance

interface PaymentTx {
  id: string;
  amount_brl: number;
  credits_amount: number;
  package_label: string | null;
  status: string;
  created_at: string;
  paid_at: string | null;
}

export default function SettingsCredits() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [transactions, setTransactions] = useState<PaymentTx[]>([]);
  const { credits, remainingFree, refresh } = useAICredits();

  useEffect(() => {
    const since = subDays(new Date(), 30).toISOString();
    supabase
      .from('agent_run_log')
      .select('agent_name,status,started_at,completed_at')
      .gte('started_at', since)
      .order('started_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!error && data) setRuns(data as AgentRun[]);
        setLoading(false);
      });

    supabase
      .from('payment_transactions')
      .select('id,amount_brl,credits_amount,package_label,status,created_at,paid_at')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setTransactions(data as PaymentTx[]);
      });
  }, []);

  const totalRuns = runs.length;
  const successfulRuns = runs.filter((r) => r.status === 'completed' || r.status === 'success').length;
  const failedRuns = runs.filter((r) => r.status === 'failed' || r.status === 'error').length;
  const lastRun = runs[0];

  // Heuristic: estimate AI usage from agent runs (very rough — for visibility only)
  const estimatedUsagePct = Math.min(100, Math.round((totalRuns / 200) * 100));

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Settings
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            Credits & AI Balance
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor your AI usage, plan limits, and billing status.
          </p>
        </div>

        {/* User AI Credits (PIX) */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Your AI Credits
            </CardTitle>
            <CardDescription>
              Free monthly quota + paid credits for the AI Assistant. Recarregue via PIX.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3 bg-background/60">
                <p className="text-xs text-muted-foreground">Saldo de créditos</p>
                <p className="text-3xl font-bold mt-1 text-primary">
                  {credits?.credits_balance ?? 0}
                </p>
              </div>
              <div className="rounded-lg border p-3 bg-background/60">
                <p className="text-xs text-muted-foreground">Cota grátis restante</p>
                <p className="text-3xl font-bold mt-1">
                  {remainingFree}
                  <span className="text-base text-muted-foreground font-normal">
                    /{credits?.free_quota_limit ?? 10}
                  </span>
                </p>
                <Progress
                  value={
                    credits
                      ? ((credits.free_quota_limit - remainingFree) / credits.free_quota_limit) * 100
                      : 0
                  }
                  className="mt-2 h-1.5"
                />
              </div>
            </div>
            <Button onClick={() => setPaywallOpen(true)} className="w-full sm:w-auto">
              <Zap className="h-4 w-4 mr-2" />
              Comprar créditos via PIX
            </Button>

            {transactions.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Últimas transações</p>
                <div className="space-y-1">
                  {transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between text-xs p-2 rounded bg-background/50"
                    >
                      <span>
                        {tx.package_label || `${tx.credits_amount} créditos`} ·{' '}
                        {format(new Date(tx.created_at), 'dd/MM HH:mm')}
                      </span>
                      <Badge
                        variant={
                          tx.status === 'paid'
                            ? 'default'
                            : tx.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {tx.status === 'paid' ? 'Pago' : tx.status === 'pending' ? 'Pendente' : tx.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <PaywallDialog open={paywallOpen} onOpenChange={setPaywallOpen} onSuccess={refresh} />

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>About these numbers</AlertTitle>
          <AlertDescription className="text-xs">
            Your AI Gateway balance and subscription credits are managed by Lovable and not directly
            queryable from this app. The cards below summarize your project's AI agent activity and
            link out to the official Lovable settings where exact balances live.
          </AlertDescription>
        </Alert>

        {/* AI Balance Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Lovable AI Gateway Balance
            </CardTitle>
            <CardDescription>
              Powers all in-app AI features (visit summaries, AI assistant, research engine, guardian).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3 bg-background/50">
                <p className="text-xs text-muted-foreground">Free monthly balance</p>
                <p className="text-2xl font-bold mt-1">${FREE_AI_BALANCE_USD.toFixed(2)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Auto-renews monthly (until early 2026)
                </p>
              </div>
              <div className="rounded-lg border p-3 bg-background/50">
                <p className="text-xs text-muted-foreground">Estimated usage (30d)</p>
                <p className="text-2xl font-bold mt-1">{estimatedUsagePct}%</p>
                <Progress value={estimatedUsagePct} className="mt-2 h-2" />
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
              <a
                href="https://lovable.dev/settings"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                Top up AI balance in Lovable
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Cloud Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Lovable Cloud Balance
            </CardTitle>
            <CardDescription>
              Covers database, edge functions, storage, and authentication usage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-3 bg-background/50">
              <p className="text-xs text-muted-foreground">Free monthly balance</p>
              <p className="text-2xl font-bold mt-1">${FREE_CLOUD_BALANCE_USD.toFixed(2)}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Per workspace, until early 2026
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <a
                href="https://lovable.dev/settings"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                View Cloud usage
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Plan & Billing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Plan & Billing
            </CardTitle>
            <CardDescription>
              Subscription tier, monthly chat-credit allowance, and billing status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Subscription plan</p>
                <p className="text-xs text-muted-foreground">Free / Pro / Business / Enterprise</p>
              </div>
              <Badge variant="outline">View in Lovable</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Last billing status</p>
                <p className="text-xs text-muted-foreground">
                  Invoices and payment history are managed in your workspace settings
                </p>
              </div>
            </div>
            <Button asChild variant="default" size="sm" className="w-full sm:w-auto">
              <a
                href="https://lovable.dev/settings"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                Open Plans & Credits
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Project AI Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Project AI Activity (last 30 days)
            </CardTitle>
            <CardDescription>
              Edge function and AI agent runs from this project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{totalRuns}</p>
                    <p className="text-xs text-muted-foreground">Total runs</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold text-success">{successfulRuns}</p>
                    <p className="text-xs text-muted-foreground">Successful</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold text-destructive">{failedRuns}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                </div>
                {lastRun && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Last run: <span className="font-medium">{lastRun.agent_name}</span> ·{' '}
                    {format(new Date(lastRun.started_at), 'PPp')}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
