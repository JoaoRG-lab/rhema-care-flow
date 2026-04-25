import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  CalendarIcon, 
  Users, 
  Activity, 
  TrendingUp,
  Filter,
  RefreshCw,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { StatisticsExport } from '@/components/dashboard/StatisticsExport';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from 'recharts';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--info))',
  'hsl(var(--destructive))',
  'hsl(210, 70%, 60%)',
  'hsl(280, 60%, 55%)',
  'hsl(30, 80%, 55%)',
];

const DATE_PRESETS = [
  { label: 'Last 7 days', getDates: () => ({ start: subMonths(new Date(), 0.25), end: new Date() }) },
  { label: 'Last 30 days', getDates: () => ({ start: subMonths(new Date(), 1), end: new Date() }) },
  { label: 'Last 3 months', getDates: () => ({ start: subMonths(new Date(), 3), end: new Date() }) },
  { label: 'Last 6 months', getDates: () => ({ start: subMonths(new Date(), 6), end: new Date() }) },
  { label: 'Last year', getDates: () => ({ start: subMonths(new Date(), 12), end: new Date() }) },
  { label: 'This month', getDates: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
];

export default function Analytics() {
  const { 
    data, 
    loading, 
    filters, 
    setFilters, 
    availableDiagnoses, 
    availableTherapies,
    refetch,
  } = useAnalyticsData();
  
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handlePresetClick = (preset: typeof DATE_PRESETS[0]) => {
    const { start, end } = preset.getDates();
    setFilters(prev => ({ ...prev, startDate: start, endDate: end }));
  };

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from) {
      setFilters(prev => ({
        ...prev,
        startDate: range.from!,
        endDate: range.to || range.from!,
      }));
    }
  };

  const clearFilters = () => {
    setFilters({
      startDate: subMonths(startOfMonth(new Date()), 2),
      endDate: endOfMonth(new Date()),
      diagnosisFilter: undefined,
      therapyFilter: undefined,
    });
  };

  // Convert data for export compatibility
  const exportData = data ? {
    totalPatients: data.totalPatients,
    newPatientsThisMonth: data.newPatients,
    totalVisitsThisMonth: data.totalVisits,
    totalScoresRecorded: data.totalScores,
    averageVisitsPerPatient: data.avgVisitsPerPatient,
    diagnosisBreakdown: data.diagnosisBreakdown.map(d => ({ diagnosis: d.name, count: d.count })),
    recentScores: data.scoreTypeBreakdown.map(s => ({ scoreType: s.name, avgScore: s.avgScore, count: s.count })),
    therapyBreakdown: data.therapyBreakdown.map(t => ({ therapy: t.name, count: t.count })),
  } : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Analytics & Reports
            </h1>
            <p className="text-muted-foreground">
              Detailed insights into your practice data
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
            {exportData && <StatisticsExport stats={exportData} />}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {/* Date Range */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Período</label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[260px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(filters.startDate, 'MMM d, yyyy')} - {format(filters.endDate, 'MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex">
                      <div className="border-r p-2 space-y-1">
                        {DATE_PRESETS.map((preset) => (
                          <Button
                            key={preset.label}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-sm"
                            onClick={() => {
                              handlePresetClick(preset);
                              setDatePickerOpen(false);
                            }}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                      <Calendar
                        mode="range"
                        selected={{ from: filters.startDate, to: filters.endDate }}
                        onSelect={handleDateSelect}
                        numberOfMonths={2}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Diagnosis Filter */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Diagnóstico</label>
                <Select 
                  value={filters.diagnosisFilter || 'all'} 
                  onValueChange={(v) => setFilters(prev => ({ ...prev, diagnosisFilter: v === 'all' ? undefined : v }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todos os diagnósticos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os diagnósticos</SelectItem>
                    {availableDiagnoses.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Therapy Filter */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Terapia</label>
                <Select 
                  value={filters.therapyFilter || 'all'} 
                  onValueChange={(v) => setFilters(prev => ({ ...prev, therapyFilter: v === 'all' ? undefined : v }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todas as terapias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as terapias</SelectItem>
                    {availableTherapies.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(filters.diagnosisFilter || filters.therapyFilter) && (
                <div className="flex items-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !data || data.totalPatients === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No data available for the selected filters</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your date range or filters</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Total de Pacientes</span>
                  </div>
                  <p className="text-2xl font-bold">{data.totalPatients}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-sm text-muted-foreground">Novos Pacientes</span>
                  </div>
                  <p className="text-2xl font-bold">{data.newPatients}</p>
                  <p className="text-xs text-muted-foreground">In selected period</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="h-4 w-4 text-info" />
                    <span className="text-sm text-muted-foreground">Total de Consultas</span>
                  </div>
                  <p className="text-2xl font-bold">{data.totalVisits}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-warning" />
                    <span className="text-sm text-muted-foreground">Scores Recorded</span>
                  </div>
                  <p className="text-2xl font-bold">{data.totalScores}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Avg Visits/Patient</span>
                  </div>
                  <p className="text-2xl font-bold">{data.avgVisitsPerPatient}</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="trends" className="space-y-4">
              <TabsList>
                <TabsTrigger value="trends" className="gap-2">
                  <LineChartIcon className="h-4 w-4" />
                  Trends
                </TabsTrigger>
                <TabsTrigger value="distributions" className="gap-2">
                  <PieChartIcon className="h-4 w-4" />
                  Distributions
                </TabsTrigger>
                <TabsTrigger value="scores" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Scores
                </TabsTrigger>
              </TabsList>

              <TabsContent value="trends" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Visit Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Atividade de Consultas</CardTitle>
                      <CardDescription>Number of visits over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data.visitTrend}>
                            <defs>
                              <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 11 }}
                              tickFormatter={(v) => format(new Date(v), 'MMM d')}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--popover))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                              labelFormatter={(v) => format(new Date(v), 'MMM d, yyyy')}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="count" 
                              stroke="hsl(var(--primary))" 
                              fill="url(#visitGradient)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Patient Growth */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Crescimento de Pacientes</CardTitle>
                      <CardDescription>Cumulative patient count over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.patientGrowth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 11 }}
                              tickFormatter={(v) => format(new Date(v + '-01'), 'MMM yy')}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--popover))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                              labelFormatter={(v) => format(new Date(v + '-01'), 'MMMM yyyy')}
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="cumulative" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              dot={false}
                              name="Total Patients"
                            />
                            <Bar dataKey="new" fill="hsl(var(--success))" name="New Patients" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="distributions" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Diagnosis Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Distribuição de Diagnósticos</CardTitle>
                      <CardDescription>Patient count by diagnosis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data.diagnosisBreakdown.slice(0, 8)}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={90}
                              paddingAngle={2}
                              dataKey="count"
                              nameKey="name"
                              label={({ name, percentage }) => `${name} (${percentage}%)`}
                              labelLine={false}
                            >
                              {data.diagnosisBreakdown.slice(0, 8).map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--popover))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Therapy Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Distribuição de Terapias</CardTitle>
                      <CardDescription>Patient count by therapy</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={data.therapyBreakdown.slice(0, 10)}
                            layout="vertical"
                            margin={{ left: 0, right: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis type="number" tick={{ fontSize: 12 }} />
                            <YAxis 
                              type="category" 
                              dataKey="name" 
                              tick={{ fontSize: 11 }} 
                              width={100}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--popover))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="scores" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Score Type Averages */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Score Averages by Type</CardTitle>
                      <CardDescription>Average score values for each assessment</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.scoreTypeBreakdown}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fontSize: 11 }}
                              angle={-20}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--popover))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                              formatter={(value: number, name: string) => [
                                value.toFixed(1),
                                name === 'avgScore' ? 'Average' : 'Count'
                              ]}
                            />
                            <Legend />
                            <Bar dataKey="avgScore" fill="hsl(var(--success))" name="Average Score" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="count" fill="hsl(var(--info))" name="Count" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Score Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Score Distribution</CardTitle>
                      <CardDescription>Distribution of all recorded scores</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.scoreDistribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--popover))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Bar dataKey="count" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Score Trend */}
                  {data.scoreTrend.length > 0 && (
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-base">Score Trend Over Time</CardTitle>
                        <CardDescription>Monthly average scores</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.scoreTrend}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 11 }}
                                tickFormatter={(v) => format(new Date(v + '-01'), 'MMM yy')}
                              />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--popover))', 
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                }}
                                labelFormatter={(v) => format(new Date(v + '-01'), 'MMMM yyyy')}
                              />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="avgScore" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={2}
                                dot={{ fill: 'hsl(var(--primary))' }}
                                name="Avg Score"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
}
