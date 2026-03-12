import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TestSummaryCards } from "@/components/quality-test/TestSummaryCards";
import { ReliabilityGauge } from "@/components/quality-test/ReliabilityGauge";
import { CheckerAgreementChart } from "@/components/quality-test/CheckerAgreementChart";
import { FailuresByCategoryChart } from "@/components/quality-test/FailuresByCategoryChart";
import { ReproducibilityChart } from "@/components/quality-test/ReproducibilityChart";
import { ResultsTable } from "@/components/quality-test/ResultsTable";
import { FinalReport } from "@/components/quality-test/FinalReport";
import { SettingsPanel } from "@/components/quality-test/SettingsPanel";
import { TestProgressBar } from "@/components/quality-test/TestProgressBar";
import {
  DEFAULT_SETTINGS, TestSettings, TestResult, RunMetrics, TestCategory,
  CATEGORY_LABELS, generateTestCases, runTestSuite, calculateMetrics,
} from "@/lib/qualityTestEngine";
import { Play, RotateCcw, ChevronDown, Shield } from "lucide-react";

export default function QualityTest() {
  const [settings, setSettings] = useState<TestSettings>(DEFAULT_SETTINGS);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [metrics, setMetrics] = useState<RunMetrics | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const cancelRef = useRef(false);

  const runSuite = useCallback(async (category?: TestCategory) => {
    cancelRef.current = false;
    setRunning(true);
    setProgress(0);
    setResults(null);
    setMetrics(null);

    const effectiveSettings = category
      ? { ...settings, categoryDistribution: { smoke: 0, core: 0, edge: 0, stress: 0, regression: 0, [category]: settings.categoryDistribution[category] }, totalTests: settings.categoryDistribution[category] }
      : settings;

    const cases = generateTestCases(effectiveSettings);
    const total = cases.length;
    const batchSize = Math.max(1, Math.floor(total / 20));
    const allResults: TestResult[] = [];

    for (let i = 0; i < total; i += batchSize) {
      if (cancelRef.current) break;
      const batch = cases.slice(i, i + batchSize);
      const batchResults = runTestSuite(batch, effectiveSettings);
      allResults.push(...batchResults);
      setProgress(Math.min(100, ((i + batchSize) / total) * 100));
      await new Promise(r => setTimeout(r, 40));
    }

    if (!cancelRef.current) {
      setResults(allResults);
      setMetrics(calculateMetrics(allResults, settings));
      setProgress(100);
    }
    setRunning(false);
  }, [settings]);

  const handleRun = () => {
    if (selectedCategory === "all") runSuite();
    else runSuite(selectedCategory as TestCategory);
  };

  const reset = () => {
    cancelRef.current = true;
    setRunning(false);
    setProgress(0);
    setResults(null);
    setMetrics(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Redundancy Quality Test System</h1>
              <p className="text-xs text-muted-foreground">Triple-check validation • {settings.totalTests} tests • {settings.numCheckers} checkers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Full Suite</SelectItem>
                {(Object.keys(CATEGORY_LABELS) as TestCategory[]).map(c => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleRun} disabled={running} size="sm" className="gap-1.5">
              <Play className="h-3.5 w-3.5" />Run
            </Button>
            <Button onClick={reset} variant="outline" size="sm" className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />Reset
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <TestProgressBar progress={progress} running={running} />

        {/* Settings Collapsible */}
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${settingsOpen ? "rotate-180" : ""}`} />
              Settings
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <SettingsPanel settings={settings} onChange={setSettings} />
          </CollapsibleContent>
        </Collapsible>

        {metrics && results && (
          <>
            <TestSummaryCards metrics={metrics} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ReliabilityGauge metrics={metrics} />
              <CheckerAgreementChart metrics={metrics} />
              <ReproducibilityChart results={results} />
            </div>

            <FailuresByCategoryChart metrics={metrics} />

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Detailed Results</h2>
              <ResultsTable results={results} />
            </div>

            <FinalReport metrics={metrics} results={results} />
          </>
        )}

        {!metrics && !running && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Shield className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold text-muted-foreground">Ready to Run</h2>
            <p className="text-sm text-muted-foreground/70 max-w-md mt-1">
              Click <strong>Run</strong> to execute {settings.totalTests} tests with {settings.numCheckers}-checker redundancy validation.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
