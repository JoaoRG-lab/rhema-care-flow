import { Card, CardContent } from "@/components/ui/card";
import { RunMetrics } from "@/lib/qualityTestEngine";
import { CheckCircle, XCircle, AlertTriangle, ShieldAlert, Activity, Target } from "lucide-react";

interface Props { metrics: RunMetrics }

export function TestSummaryCards({ metrics }: Props) {
  const cards = [
    { label: "Total Tests", value: metrics.totalTests, icon: Activity, color: "text-foreground" },
    { label: "Passed", value: metrics.passed, icon: CheckCircle, color: "text-green-500" },
    { label: "Failed", value: metrics.failed, icon: XCircle, color: "text-destructive" },
    { label: "Warnings", value: metrics.warnings, icon: AlertTriangle, color: "text-yellow-500" },
    { label: "Critical", value: metrics.criticalInconsistencies, icon: ShieldAlert, color: "text-purple-500" },
    { label: "Reliability", value: `${metrics.reliabilityScore.toFixed(1)}`, icon: Target, color: metrics.reliabilityScore >= 90 ? "text-green-500" : metrics.reliabilityScore >= 65 ? "text-yellow-500" : "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(c => (
        <Card key={c.label} className="border-border/50">
          <CardContent className="p-4 flex flex-col items-center gap-1">
            <c.icon className={`h-5 w-5 ${c.color}`} />
            <span className="text-2xl font-bold font-mono">{c.value}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
