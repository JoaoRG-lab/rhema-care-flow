import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RunMetrics } from "@/lib/qualityTestEngine";

interface Props { metrics: RunMetrics }

export function ReliabilityGauge({ metrics }: Props) {
  const { reliabilityScore, confidence, deployRecommendation } = metrics;
  const pct = Math.min(100, Math.max(0, reliabilityScore));
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (pct / 100) * circumference;

  const color = pct >= 90 ? "#22c55e" : pct >= 80 ? "#84cc16" : pct >= 65 ? "#eab308" : pct >= 50 ? "#f97316" : "#ef4444";

  const recColor: Record<string, string> = {
    "Approve": "text-green-500",
    "Approve with Monitoring": "text-yellow-500",
    "Retest After Fixes": "text-orange-500",
    "Reject Deployment": "text-destructive",
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Reliability Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <div className="relative w-44 h-44">
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
            <circle cx="80" cy="80" r="70" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
            <circle cx="80" cy="80" r="70" fill="none" stroke={color} strokeWidth="10"
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
              className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-mono">{pct.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="text-center space-y-1">
          <div className="text-sm font-semibold" style={{ color }}>{confidence}</div>
          <div className={`text-xs font-medium ${recColor[deployRecommendation] || "text-muted-foreground"}`}>{deployRecommendation}</div>
        </div>
      </CardContent>
    </Card>
  );
}
