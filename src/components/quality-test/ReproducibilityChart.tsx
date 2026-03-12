import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { TestResult } from "@/lib/qualityTestEngine";

interface Props { results: TestResult[] }

const COLORS: Record<string, string> = {
  "Stable Failure": "#ef4444",
  "Intermittent": "#f97316",
  "Non-Reproducible": "#a855f7",
  "N/A (Passed)": "#22c55e",
};

export function ReproducibilityChart({ results }: Props) {
  const counts = {
    "Stable Failure": results.filter(r => r.reproResult === "stable_failure").length,
    "Intermittent": results.filter(r => r.reproResult === "intermittent_failure").length,
    "Non-Reproducible": results.filter(r => r.reproResult === "non_reproducible").length,
    "N/A (Passed)": results.filter(r => r.reproResult === "not_applicable").length,
  };
  const data = Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

  const config = Object.fromEntries(Object.entries(COLORS).map(([k, v]) => [k, { label: k, color: v }]));

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Reproducibility</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ChartContainer config={config} className="h-[220px] w-full">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
              {data.map((entry) => <Cell key={entry.name} fill={COLORS[entry.name]} />)}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <div className="px-6 pb-4 flex flex-wrap gap-3 justify-center">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[d.name] }} />
            <span className="text-muted-foreground">{d.name}: {d.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
