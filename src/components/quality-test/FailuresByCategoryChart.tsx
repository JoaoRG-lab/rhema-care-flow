import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { RunMetrics, CATEGORY_LABELS, TestCategory } from "@/lib/qualityTestEngine";

interface Props { metrics: RunMetrics }

export function FailuresByCategoryChart({ metrics }: Props) {
  const cats: TestCategory[] = ["smoke", "core", "edge", "stress", "regression"];
  const data = cats.map(c => ({
    name: CATEGORY_LABELS[c],
    Passed: metrics.categoryBreakdown[c].passed,
    Failed: metrics.categoryBreakdown[c].failed,
    Warnings: metrics.categoryBreakdown[c].warnings,
  }));

  const config = {
    Passed: { label: "Passed", color: "#22c55e" },
    Failed: { label: "Failed", color: "#ef4444" },
    Warnings: { label: "Warnings", color: "#eab308" },
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Results by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-[220px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="Passed" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Warnings" stackId="a" fill="#eab308" />
            <Bar dataKey="Failed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
