import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Activity,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

interface VisitScore {
  visitId: string;
  visitDate: Date;
  das28?: number;
  cdai?: number;
  sdai?: number;
  tjc?: number;
  sjc?: number;
  patientGlobal?: number;
  physicianGlobal?: number;
  crp?: number;
  esr?: number;
  pain?: number;
}

interface ResponseResult {
  visitDate: Date;
  visitLabel: string;
  // DAS28/EULAR
  das28?: number;
  eularResponse?: 'good' | 'moderate' | 'none' | null;
  das28Category?: 'remission' | 'low' | 'moderate' | 'high';
  // ACR responses (compared to baseline)
  acr20?: boolean;
  acr50?: boolean;
  acr70?: boolean;
  // CDAI
  cdai?: number;
  cdaiCategory?: 'remission' | 'low' | 'moderate' | 'high';
}

// Demo data for visualization
const DEMO_VISITS: VisitScore[] = [
  { visitId: '1', visitDate: new Date('2024-01-15'), das28: 5.8, cdai: 32, tjc: 12, sjc: 8, patientGlobal: 65, physicianGlobal: 55, crp: 2.4 },
  { visitId: '2', visitDate: new Date('2024-04-10'), das28: 4.2, cdai: 18, tjc: 6, sjc: 4, patientGlobal: 45, physicianGlobal: 40, crp: 1.2 },
  { visitId: '3', visitDate: new Date('2024-07-22'), das28: 3.4, cdai: 10, tjc: 3, sjc: 2, patientGlobal: 30, physicianGlobal: 25, crp: 0.8 },
  { visitId: '4', visitDate: new Date('2024-10-05'), das28: 2.8, cdai: 6, tjc: 2, sjc: 1, patientGlobal: 20, physicianGlobal: 15, crp: 0.4 },
  { visitId: '5', visitDate: new Date('2025-01-18'), das28: 2.4, cdai: 4, tjc: 1, sjc: 0, patientGlobal: 15, physicianGlobal: 10, crp: 0.3 },
];

function calculateEULARResponse(baseline: number, current: number): 'good' | 'moderate' | 'none' {
  const improvement = baseline - current;
  
  if (current <= 3.2 && improvement > 1.2) return 'good';
  if (current <= 3.2 && improvement > 0.6 && improvement <= 1.2) return 'moderate';
  if (current > 3.2 && current <= 5.1 && improvement > 1.2) return 'moderate';
  if (current > 3.2 && current <= 5.1 && improvement > 0.6 && improvement <= 1.2) return 'none';
  if (current > 5.1 && improvement > 1.2) return 'moderate';
  return 'none';
}

function getDAS28Category(das28: number): 'remission' | 'low' | 'moderate' | 'high' {
  if (das28 < 2.6) return 'remission';
  if (das28 <= 3.2) return 'low';
  if (das28 <= 5.1) return 'moderate';
  return 'high';
}

function getCDAICategory(cdai: number): 'remission' | 'low' | 'moderate' | 'high' {
  if (cdai <= 2.8) return 'remission';
  if (cdai <= 10) return 'low';
  if (cdai <= 22) return 'moderate';
  return 'high';
}

function calculateACRResponse(baseline: VisitScore, current: VisitScore): { acr20: boolean; acr50: boolean; acr70: boolean } {
  const bTJC = baseline.tjc ?? 0;
  const bSJC = baseline.sjc ?? 0;
  const cTJC = current.tjc ?? 0;
  const cSJC = current.sjc ?? 0;
  
  const tjcImprovement = bTJC > 0 ? ((bTJC - cTJC) / bTJC) * 100 : 0;
  const sjcImprovement = bSJC > 0 ? ((bSJC - cSJC) / bSJC) * 100 : 0;
  
  // Simplified ACR: requires improvement in TJC/SJC + 3 of 5 other measures
  // For demo, we'll use a simplified version based on TJC/SJC and patient global
  const bPG = baseline.patientGlobal ?? 0;
  const cPG = current.patientGlobal ?? 0;
  const pgImprovement = bPG > 0 ? ((bPG - cPG) / bPG) * 100 : 0;
  
  const coreImprovement20 = tjcImprovement >= 20 && sjcImprovement >= 20;
  const coreImprovement50 = tjcImprovement >= 50 && sjcImprovement >= 50;
  const coreImprovement70 = tjcImprovement >= 70 && sjcImprovement >= 70;
  
  return {
    acr20: coreImprovement20 && pgImprovement >= 20,
    acr50: coreImprovement50 && pgImprovement >= 50,
    acr70: coreImprovement70 && pgImprovement >= 70,
  };
}

export function TreatmentResponseComparison() {
  const [baselineVisitId, setBaselineVisitId] = useState(DEMO_VISITS[0].visitId);
  
  const responseData = useMemo(() => {
    const baseline = DEMO_VISITS.find(v => v.visitId === baselineVisitId);
    if (!baseline) return [];
    
    return DEMO_VISITS.map((visit, index) => {
      const result: ResponseResult = {
        visitDate: visit.visitDate,
        visitLabel: `V${index + 1}`,
        das28: visit.das28,
        cdai: visit.cdai,
      };
      
      if (visit.das28 !== undefined) {
        result.das28Category = getDAS28Category(visit.das28);
        if (baseline.das28 !== undefined && visit.visitId !== baselineVisitId) {
          result.eularResponse = calculateEULARResponse(baseline.das28, visit.das28);
        }
      }
      
      if (visit.cdai !== undefined) {
        result.cdaiCategory = getCDAICategory(visit.cdai);
      }
      
      if (visit.visitId !== baselineVisitId) {
        const acr = calculateACRResponse(baseline, visit);
        result.acr20 = acr.acr20;
        result.acr50 = acr.acr50;
        result.acr70 = acr.acr70;
      }
      
      return result;
    });
  }, [baselineVisitId]);

  const getResponseColor = (response: 'good' | 'moderate' | 'none' | null | undefined) => {
    switch (response) {
      case 'good': return 'text-success bg-success/10 border-success/30';
      case 'moderate': return 'text-warning bg-warning/10 border-warning/30';
      case 'none': return 'text-destructive bg-destructive/10 border-destructive/30';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getCategoryColor = (category: string | undefined) => {
    switch (category) {
      case 'remission': return 'bg-success';
      case 'low': return 'bg-info';
      case 'moderate': return 'bg-warning';
      case 'high': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const chartData = responseData.map(r => ({
    name: format(r.visitDate, 'MMM yy'),
    das28: r.das28,
    cdai: r.cdai,
    acr20: r.acr20 ? 1 : 0,
    acr50: r.acr50 ? 1 : 0,
    acr70: r.acr70 ? 1 : 0,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Treatment Response Comparison
            </CardTitle>
            <CardDescription>
              Track ACR and EULAR responses across multiple visits
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Baseline:</span>
            <Select value={baselineVisitId} onValueChange={setBaselineVisitId}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEMO_VISITS.map((v, i) => (
                  <SelectItem key={v.visitId} value={v.visitId}>
                    Visit {i + 1} ({format(v.visitDate, 'MMM yy')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="timeline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="chart" className="gap-2">
              <Activity className="h-4 w-4" />
              Chart
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            {/* Response Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryCard
                title="Latest DAS28"
                value={responseData[responseData.length - 1]?.das28?.toFixed(1) || '-'}
                category={responseData[responseData.length - 1]?.das28Category}
                trend={
                  responseData.length > 1 && 
                  (responseData[responseData.length - 1]?.das28 || 0) < (responseData[0]?.das28 || 0)
                    ? 'down' : 'up'
                }
              />
              <SummaryCard
                title="Latest CDAI"
                value={responseData[responseData.length - 1]?.cdai?.toFixed(0) || '-'}
                category={responseData[responseData.length - 1]?.cdaiCategory}
                trend={
                  responseData.length > 1 && 
                  (responseData[responseData.length - 1]?.cdai || 0) < (responseData[0]?.cdai || 0)
                    ? 'down' : 'up'
                }
              />
              <SummaryCard
                title="ACR50 Achieved"
                value={responseData.filter(r => r.acr50).length.toString()}
                subtitle={`of ${responseData.length - 1} visits`}
              />
              <SummaryCard
                title="Good EULAR"
                value={responseData.filter(r => r.eularResponse === 'good').length.toString()}
                subtitle={`of ${responseData.length - 1} visits`}
              />
            </div>

            {/* Visit Timeline */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Visit-by-Visit Response</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left font-medium">Visit</th>
                      <th className="p-2 text-center font-medium">DAS28</th>
                      <th className="p-2 text-center font-medium">EULAR</th>
                      <th className="p-2 text-center font-medium">CDAI</th>
                      <th className="p-2 text-center font-medium">ACR20</th>
                      <th className="p-2 text-center font-medium">ACR50</th>
                      <th className="p-2 text-center font-medium">ACR70</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responseData.map((r, i) => {
                      const isBaseline = DEMO_VISITS[i].visitId === baselineVisitId;
                      return (
                        <tr key={i} className={cn('border-b', isBaseline && 'bg-primary/5')}>
                          <td className="p-2">
                            <div className="font-medium">{r.visitLabel}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(r.visitDate, 'MMM d, yyyy')}
                            </div>
                            {isBaseline && (
                              <Badge variant="outline" className="text-xs mt-1">Baseline</Badge>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-mono">{r.das28?.toFixed(1)}</span>
                              <span className={cn(
                                'w-3 h-3 rounded-full',
                                getCategoryColor(r.das28Category)
                              )} />
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            {r.eularResponse ? (
                              <Badge variant="outline" className={cn('capitalize', getResponseColor(r.eularResponse))}>
                                {r.eularResponse}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-mono">{r.cdai}</span>
                              <span className={cn(
                                'w-3 h-3 rounded-full',
                                getCategoryColor(r.cdaiCategory)
                              )} />
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            {isBaseline ? (
                              <span className="text-muted-foreground">-</span>
                            ) : r.acr20 ? (
                              <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                            )}
                          </td>
                          <td className="p-2 text-center">
                            {isBaseline ? (
                              <span className="text-muted-foreground">-</span>
                            ) : r.acr50 ? (
                              <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                            )}
                          </td>
                          <td className="p-2 text-center">
                            {isBaseline ? (
                              <span className="text-muted-foreground">-</span>
                            ) : r.acr70 ? (
                              <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-success" />
                <span>Remission</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-info" />
                <span>Low Activity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-warning" />
                <span>Moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-destructive" />
                <span>High Activity</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chart">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis yAxisId="left" domain={[0, 8]} className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 40]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <ReferenceLine yAxisId="left" y={2.6} stroke="hsl(var(--success))" strokeDasharray="5 5" label="DAS28 Remission" />
                  <ReferenceLine yAxisId="left" y={3.2} stroke="hsl(var(--info))" strokeDasharray="5 5" label="DAS28 LDA" />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="das28"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                    name="DAS28"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cdai"
                    stroke="hsl(var(--info))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--info))' }}
                    name="CDAI"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="acr50"
                    fill="hsl(var(--success))"
                    opacity={0.3}
                    name="ACR50"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              DAS28 (left axis) • CDAI (right axis) • Green bars indicate ACR50 achieved
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function SummaryCard({ 
  title, 
  value, 
  category, 
  trend, 
  subtitle 
}: { 
  title: string; 
  value: string; 
  category?: string; 
  trend?: 'up' | 'down'; 
  subtitle?: string;
}) {
  return (
    <div className="p-3 rounded-lg border bg-card">
      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold">{value}</span>
        {category && (
          <Badge variant="outline" className={cn(
            'text-xs capitalize',
            category === 'remission' && 'border-success/30 text-success',
            category === 'low' && 'border-info/30 text-info',
            category === 'moderate' && 'border-warning/30 text-warning',
            category === 'high' && 'border-destructive/30 text-destructive',
          )}>
            {category}
          </Badge>
        )}
        {trend === 'down' && <TrendingDown className="h-4 w-4 text-success" />}
        {trend === 'up' && <TrendingUp className="h-4 w-4 text-destructive" />}
      </div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}
