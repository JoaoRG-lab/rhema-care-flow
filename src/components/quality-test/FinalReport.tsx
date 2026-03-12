import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RunMetrics, TestResult, CATEGORY_LABELS, TestCategory } from "@/lib/qualityTestEngine";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { metrics: RunMetrics; results: TestResult[] }

export function FinalReport({ metrics, results }: Props) {
  const criticals = results.filter(r => r.majorityDecision === "critical_inconsistency");
  const unstable = results.filter(r => r.reproResult === "intermittent_failure" || r.reproResult === "non_reproducible");

  const exportCSV = () => {
    const header = "Test ID,Category,Checker A,Checker B,Checker C,Decision,Reproducibility,Severity,Notes\n";
    const rows = results.map(r =>
      `${r.testId},${r.category},${r.checkerA},${r.checkerB},${r.checkerC},${r.majorityDecision},${r.reproResult},${r.severity},"${r.notes}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `quality-test-report-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const report = { generatedAt: new Date().toISOString(), metrics, criticalIssues: criticals.map(r => r.testId), unstableTests: unstable.map(r => ({ id: r.testId, type: r.reproResult })), results };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `quality-test-report-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Final Report</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="text-xs h-7"><Download className="h-3 w-3 mr-1" />CSV</Button>
          <Button variant="outline" size="sm" onClick={exportJSON} className="text-xs h-7"><Download className="h-3 w-3 mr-1" />JSON</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="p-4 rounded-lg bg-muted/30 space-y-2">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Executive Summary</h4>
          <p>Executed <strong>{metrics.totalTests}</strong> tests across 5 categories with 3-checker redundancy validation.
            Reliability score: <strong>{metrics.reliabilityScore.toFixed(1)}/100</strong> ({metrics.confidence}).
            Checker agreement rate: <strong>{metrics.checkerAgreementRate.toFixed(1)}%</strong>.
            Reproducibility score: <strong>{metrics.reproducibilityScore.toFixed(1)}%</strong>.</p>
          <p className="font-semibold">Recommendation: {metrics.deployRecommendation}</p>
        </div>

        {criticals.length > 0 && (
          <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5 space-y-1">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-purple-500">Critical Issues ({criticals.length})</h4>
            <ul className="text-xs space-y-0.5 text-muted-foreground">
              {criticals.slice(0, 10).map(r => <li key={r.testId}>• {r.testId}: {r.testName} — all checkers diverged</li>)}
              {criticals.length > 10 && <li>... and {criticals.length - 10} more</li>}
            </ul>
          </div>
        )}

        {unstable.length > 0 && (
          <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-500/5 space-y-1">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-orange-500">Unstable Tests ({unstable.length})</h4>
            <ul className="text-xs space-y-0.5 text-muted-foreground">
              {unstable.slice(0, 10).map(r => <li key={r.testId}>• {r.testId}: {r.reproResult.replace(/_/g, " ")}</li>)}
              {unstable.length > 10 && <li>... and {unstable.length - 10} more</li>}
            </ul>
          </div>
        )}

        <div className="p-4 rounded-lg bg-muted/30 space-y-2">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Category Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            {(Object.keys(CATEGORY_LABELS) as TestCategory[]).map(cat => {
              const b = metrics.categoryBreakdown[cat];
              const rate = b.total > 0 ? ((b.passed / b.total) * 100).toFixed(0) : "N/A";
              return (
                <div key={cat} className="p-2 rounded bg-background border border-border/50 text-center">
                  <div className="font-medium text-[11px]">{CATEGORY_LABELS[cat]}</div>
                  <div className="font-mono text-lg font-bold">{rate}%</div>
                  <div className="text-muted-foreground">{b.passed}/{b.total} pass</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/30 space-y-1">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Checker Comparison</h4>
          <div className="grid grid-cols-3 gap-3 text-xs text-center">
            {["A", "B", "C"].map((ch, i) => {
              const div = [metrics.checkerADivergence, metrics.checkerBDivergence, metrics.checkerCDivergence][i];
              return (
                <div key={ch} className="p-2 rounded bg-background border border-border/50">
                  <div className="font-medium">Checker {ch}</div>
                  <div className="font-mono text-lg font-bold">{div.toFixed(1)}%</div>
                  <div className="text-muted-foreground">divergence</div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
