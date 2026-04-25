import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3, Users, Eye, Clock, Globe, Monitor, Smartphone, Tablet,
  TrendingUp, ArrowUp, ArrowDown, RefreshCw, Activity, MousePointerClick,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subDays, subHours, format, startOfDay, eachDayOfInterval, eachHourOfInterval } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(210, 70%, 60%)',
  'hsl(150, 60%, 50%)',
  'hsl(40, 90%, 55%)',
  'hsl(0, 70%, 60%)',
  'hsl(280, 60%, 60%)',
  'hsl(180, 50%, 50%)',
];

type TimeRange = '24h' | '7d' | '30d' | '90d';

interface SiteStats {
  totalPageviews: number;
  uniqueVisitors: number;
  totalSessions: number;
  avgDuration: number;
  bounceRate: number;
  pagesPerSession: number;
  topPages: { path: string; views: number; uniqueVisitors: number }[];
  trafficOverTime: { date: string; views: number; visitors: number }[];
  deviceBreakdown: { name: string; value: number }[];
  browserBreakdown: { name: string; value: number }[];
  osBreakdown: { name: string; value: number }[];
  countryBreakdown: { name: string; value: number }[];
  referrerBreakdown: { name: string; value: number }[];
  realtimeVisitors: number;
}

export default function SiteAnalytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const now = new Date();
    let startDate: Date;
    switch (timeRange) {
      case '24h': startDate = subHours(now, 24); break;
      case '7d': startDate = subDays(now, 7); break;
      case '30d': startDate = subDays(now, 30); break;
      case '90d': startDate = subDays(now, 90); break;
    }

    const { data: visits } = await supabase
      .from('site_visits' as any)
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (!visits || visits.length === 0) {
      setStats({
        totalPageviews: 0, uniqueVisitors: 0, totalSessions: 0,
        avgDuration: 0, bounceRate: 0, pagesPerSession: 0,
        topPages: [], trafficOverTime: [], deviceBreakdown: [],
        browserBreakdown: [], osBreakdown: [], countryBreakdown: [],
        referrerBreakdown: [], realtimeVisitors: 0,
      });
      setLoading(false);
      return;
    }

    const allVisits = visits as any[];
    const totalPageviews = allVisits.length;
    const uniqueVisitors = new Set(allVisits.map((v: any) => v.visitor_id)).size;
    const totalSessions = new Set(allVisits.map((v: any) => v.session_id)).size;
    const totalDuration = allVisits.reduce((s: number, v: any) => s + (v.duration_seconds || 0), 0);
    const avgDuration = totalPageviews > 0 ? Math.round(totalDuration / totalPageviews) : 0;
    const bounces = allVisits.filter((v: any) => v.is_bounce).length;
    const bounceRate = totalSessions > 0 ? Math.round((bounces / totalSessions) * 100) : 0;
    const pagesPerSession = totalSessions > 0 ? Math.round((totalPageviews / totalSessions) * 10) / 10 : 0;

    // Realtime (last 5 min)
    const fiveMinAgo = subDays(now, 0);
    fiveMinAgo.setMinutes(fiveMinAgo.getMinutes() - 5);
    const realtimeVisitors = new Set(
      allVisits.filter((v: any) => new Date(v.created_at) >= fiveMinAgo).map((v: any) => v.visitor_id)
    ).size;

    // Top pages
    const pageCounts: Record<string, { views: number; visitors: Set<string> }> = {};
    allVisits.forEach((v: any) => {
      if (!pageCounts[v.page_path]) pageCounts[v.page_path] = { views: 0, visitors: new Set() };
      pageCounts[v.page_path].views++;
      pageCounts[v.page_path].visitors.add(v.visitor_id);
    });
    const topPages = Object.entries(pageCounts)
      .map(([path, d]) => ({ path, views: d.views, uniqueVisitors: d.visitors.size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);

    // Traffic over time
    let trafficOverTime: { date: string; views: number; visitors: number }[] = [];
    if (timeRange === '24h') {
      const hours = eachHourOfInterval({ start: startDate, end: now });
      const byHour: Record<string, { views: number; visitors: Set<string> }> = {};
      hours.forEach(h => { byHour[format(h, 'HH:00')] = { views: 0, visitors: new Set() }; });
      allVisits.forEach((v: any) => {
        const key = format(new Date(v.created_at), 'HH:00');
        if (byHour[key]) { byHour[key].views++; byHour[key].visitors.add(v.visitor_id); }
      });
      trafficOverTime = Object.entries(byHour).map(([date, d]) => ({ date, views: d.views, visitors: d.visitors.size }));
    } else {
      const days = eachDayOfInterval({ start: startOfDay(startDate), end: startOfDay(now) });
      const byDay: Record<string, { views: number; visitors: Set<string> }> = {};
      days.forEach(d => { byDay[format(d, 'MM/dd')] = { views: 0, visitors: new Set() }; });
      allVisits.forEach((v: any) => {
        const key = format(new Date(v.created_at), 'MM/dd');
        if (byDay[key]) { byDay[key].views++; byDay[key].visitors.add(v.visitor_id); }
      });
      trafficOverTime = Object.entries(byDay).map(([date, d]) => ({ date, views: d.views, visitors: d.visitors.size }));
    }

    // Breakdowns
    const countField = (field: string) => {
      const counts: Record<string, number> = {};
      allVisits.forEach((v: any) => {
        const val = v[field] || 'Unknown';
        counts[val] = (counts[val] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    };

    const referrerBreakdown = (() => {
      const counts: Record<string, number> = {};
      allVisits.forEach((v: any) => {
        let ref = v.referrer || 'Direct';
        if (ref && ref !== 'Direct') {
          try { ref = new URL(ref).hostname; } catch { ref = 'Direct'; }
        }
        counts[ref] = (counts[ref] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    })();

    setStats({
      totalPageviews, uniqueVisitors, totalSessions, avgDuration,
      bounceRate, pagesPerSession, topPages, trafficOverTime,
      deviceBreakdown: countField('device_type'),
      browserBreakdown: countField('browser'),
      osBreakdown: countField('os'),
      countryBreakdown: countField('country'),
      referrerBreakdown, realtimeVisitors,
    });
    setLoading(false);
  }, [user, timeRange]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const formatDuration = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Site Analytics
            </h1>
            <p className="text-muted-foreground text-sm mt-1">YouTube Studio-style metrics for your platform</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchStats}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Realtime indicator */}
            {stats.realtimeVisitors > 0 && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-semibold text-foreground">{stats.realtimeVisitors}</span>
                  <span className="text-muted-foreground text-sm">visitantes ativos agora</span>
                </CardContent>
              </Card>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard icon={Eye} label="Visualizações" value={stats.totalPageviews.toLocaleString()} />
              <StatCard icon={Users} label="Visitantes Únicos" value={stats.uniqueVisitors.toLocaleString()} />
              <StatCard icon={Activity} label="Sessões" value={stats.totalSessions.toLocaleString()} />
              <StatCard icon={Clock} label="Duração Média" value={formatDuration(stats.avgDuration)} />
              <StatCard icon={MousePointerClick} label="Taxa de Rejeição" value={`${stats.bounceRate}%`} alert={stats.bounceRate > 70} />
              <StatCard icon={TrendingUp} label="Páginas/Sessão" value={stats.pagesPerSession.toString()} />
            </div>

            {/* Main chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tráfego ao Longo do Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.trafficOverTime}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="views" name="Pageviews" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="visitors" name="Visitantes" stroke="hsl(210, 70%, 60%)" fill="hsl(210, 70%, 60%)" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="pages" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pages">Páginas</TabsTrigger>
                <TabsTrigger value="devices">Dispositivos</TabsTrigger>
                <TabsTrigger value="geography">Geografia</TabsTrigger>
                <TabsTrigger value="sources">Fontes</TabsTrigger>
              </TabsList>

              <TabsContent value="pages">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Páginas Mais Visitadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Página</TableHead>
                            <TableHead className="text-right">Visualizações</TableHead>
                            <TableHead className="text-right">Visitantes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.topPages.map((page) => (
                            <TableRow key={page.path}>
                              <TableCell className="font-mono text-sm">{page.path}</TableCell>
                              <TableCell className="text-right font-semibold">{page.views}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{page.uniqueVisitors}</TableCell>
                            </TableRow>
                          ))}
                          {stats.topPages.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">Sem dados ainda</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="devices">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <PieCard title="Tipo de Dispositivo" data={stats.deviceBreakdown} />
                  <PieCard title="Navegador" data={stats.browserBreakdown} />
                  <PieCard title="Sistema Operacional" data={stats.osBreakdown} />
                </div>
              </TabsContent>

              <TabsContent value="geography">
                <Card>
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5" /> Países</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.countryBreakdown} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                          <Tooltip />
                          <Bar dataKey="value" name="Visitas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sources">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Fontes de Tráfego</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.referrerBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Bar dataKey="value" name="Visitas" fill="hsl(210, 70%, 60%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}

function StatCard({ icon: Icon, label, value, alert }: { icon: any; label: string; value: string; alert?: boolean }) {
  return (
    <Card className={alert ? 'border-destructive/30' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={`text-2xl font-bold ${alert ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function PieCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
