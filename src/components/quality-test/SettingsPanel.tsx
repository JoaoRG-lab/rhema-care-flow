import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TestSettings, TestCategory, CATEGORY_LABELS } from "@/lib/qualityTestEngine";
import { Settings } from "lucide-react";

interface Props { settings: TestSettings; onChange: (s: TestSettings) => void }

export function SettingsPanel({ settings, onChange }: Props) {
  const updateDist = (cat: TestCategory, val: number) => {
    const dist = { ...settings.categoryDistribution, [cat]: val };
    onChange({ ...settings, categoryDistribution: dist, totalTests: Object.values(dist).reduce((a, b) => a + b, 0) });
  };

  const updateWeight = (key: keyof TestSettings["weights"], val: number) => {
    onChange({ ...settings, weights: { ...settings.weights, [key]: val } });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 flex flex-row items-center gap-2">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Checkers</Label>
            <Input type="number" min={3} max={5} value={settings.numCheckers} onChange={e => onChange({ ...settings, numCheckers: Number(e.target.value) })} className="h-8 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Reruns (failed)</Label>
            <Input type="number" min={1} max={10} value={settings.rerunCount} onChange={e => onChange({ ...settings, rerunCount: Number(e.target.value) })} className="h-8 text-xs" />
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold">Test Distribution (Total: {settings.totalTests})</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {(Object.keys(CATEGORY_LABELS) as TestCategory[]).map(cat => (
              <div key={cat} className="flex items-center gap-2">
                <span className="w-20 text-muted-foreground truncate">{CATEGORY_LABELS[cat]}</span>
                <Input type="number" min={0} max={500} value={settings.categoryDistribution[cat]}
                  onChange={e => updateDist(cat, Number(e.target.value))} className="h-7 text-xs w-16" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold">Reliability Weights (%)</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {([["passRate", "Pass Rate"], ["agreement", "Agreement"], ["reproducibility", "Reproducibility"], ["edgeCase", "Edge Case"], ["stress", "Stress"]] as const).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="w-24 text-muted-foreground">{label}</span>
                <Input type="number" min={0} max={100} value={settings.weights[key]}
                  onChange={e => updateWeight(key, Number(e.target.value))} className="h-7 text-xs w-14" />
              </div>
            ))}
          </div>
          <div className="text-muted-foreground mt-1">Sum: {Object.values(settings.weights).reduce((a, b) => a + b, 0)}%</div>
        </div>
      </CardContent>
    </Card>
  );
}
