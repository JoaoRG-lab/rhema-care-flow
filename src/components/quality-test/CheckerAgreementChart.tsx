import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { RunMetrics } from "@/lib/qualityTestEngine";

interface Props { metrics: RunMetrics }

export function CheckerAgreementChart({ metrics }: Props) {
  const data = [
    { name: "Agreement", value: metrics.checkerAgreementRate, fill: "hsl(var(--primary))" },
    { name: "Checker A Div.", value: metrics.checkerADivergence, fill: "#f97316" },
    { name: "Checker B Div.", value: metrics.checkerBDivergence, fill: "#eab308" },
    { name: "Checker C Div.", value: metrics.checkerCDivergence, fill: "#a855f7" },
  ];

  const config = {
    value: { label: "Rate (%)" },
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Checker Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[220px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
