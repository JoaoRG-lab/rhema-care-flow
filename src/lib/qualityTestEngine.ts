// ── Types ──────────────────────────────────────────────────────────────────
export type TestCategory = "smoke" | "core" | "edge" | "stress" | "regression";
export type CheckerResult = "pass" | "fail" | "warning";
export type MajorityDecision = "pass" | "fail" | "warning" | "critical_inconsistency";
export type ReproResult = "stable_failure" | "intermittent_failure" | "non_reproducible" | "not_applicable";
export type Severity = "low" | "medium" | "high" | "critical";
export type Confidence = "Excellent" | "Good" | "Moderate" | "Weak" | "Critical";
export type DeployRecommendation = "Approve" | "Approve with Monitoring" | "Retest After Fixes" | "Reject Deployment";

export interface TestCase {
  id: string;
  name: string;
  category: TestCategory;
}

export interface TestResult {
  testId: string;
  testName: string;
  category: TestCategory;
  checkerA: CheckerResult;
  checkerB: CheckerResult;
  checkerC: CheckerResult;
  majorityDecision: MajorityDecision;
  reproResult: ReproResult;
  severity: Severity;
  notes: string;
  rerunResults?: CheckerResult[][];
}

export interface RunMetrics {
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  criticalInconsistencies: number;
  checkerAgreementRate: number;
  checkerADivergence: number;
  checkerBDivergence: number;
  checkerCDivergence: number;
  reproducibilityScore: number;
  reliabilityScore: number;
  confidence: Confidence;
  deployRecommendation: DeployRecommendation;
  categoryBreakdown: Record<TestCategory, { total: number; passed: number; failed: number; warnings: number }>;
}

export interface TestSettings {
  totalTests: number;
  numCheckers: number;
  rerunCount: number;
  weights: { passRate: number; agreement: number; reproducibility: number; edgeCase: number; stress: number };
  categoryDistribution: Record<TestCategory, number>;
}

export const DEFAULT_SETTINGS: TestSettings = {
  totalTests: 300,
  numCheckers: 3,
  rerunCount: 3,
  weights: { passRate: 50, agreement: 20, reproducibility: 15, edgeCase: 10, stress: 5 },
  categoryDistribution: { smoke: 30, core: 120, edge: 60, stress: 40, regression: 50 },
};

export const CATEGORY_LABELS: Record<TestCategory, string> = {
  smoke: "Smoke Tests",
  core: "Core Functional",
  edge: "Edge Cases",
  stress: "Stress / Load",
  regression: "Regression",
};

// ── Test Generation ────────────────────────────────────────────────────────
const SMOKE_NAMES = ["App startup", "Auth load", "Config parse", "DB connection", "Cache init", "API health", "Env vars check", "Logger init", "Route load", "Session init"];
const CORE_NAMES = ["CRUD create", "CRUD read", "CRUD update", "CRUD delete", "Search query", "Pagination", "Sort order", "Filter logic", "Validation", "Auth flow", "Token refresh", "Role check"];
const EDGE_NAMES = ["Empty input", "Max length", "Unicode chars", "Null value", "Negative num", "Zero division", "Concurrent write", "Timeout boundary", "Large payload", "Special chars"];
const STRESS_NAMES = ["100 concurrent", "500 concurrent", "1000 concurrent", "Memory spike", "CPU saturation", "Disk I/O burst", "Network latency", "Queue overflow"];
const REGRESSION_NAMES = ["Login flow v2", "Payment calc", "Report gen", "Email send", "Webhook fire", "Batch process", "Data export", "Import parse", "Notification", "Audit log"];

function pickName(cat: TestCategory, i: number): string {
  const lists: Record<TestCategory, string[]> = { smoke: SMOKE_NAMES, core: CORE_NAMES, edge: EDGE_NAMES, stress: STRESS_NAMES, regression: REGRESSION_NAMES };
  const list = lists[cat];
  return `${list[i % list.length]} #${Math.floor(i / list.length) + 1}`;
}

export function generateTestCases(settings: TestSettings): TestCase[] {
  const cases: TestCase[] = [];
  const cats: TestCategory[] = ["smoke", "core", "edge", "stress", "regression"];
  for (const cat of cats) {
    const count = settings.categoryDistribution[cat];
    for (let i = 0; i < count; i++) {
      cases.push({ id: `${cat.toUpperCase()}-${String(i + 1).padStart(3, "0")}`, name: pickName(cat, i), category: cat });
    }
  }
  return cases;
}

// ── Simulation ─────────────────────────────────────────────────────────────
function rand() { return Math.random(); }

function simulateChecker(cat: TestCategory): CheckerResult {
  const r = rand();
  const rates: Record<TestCategory, { pass: number; warn: number }> = {
    smoke: { pass: 0.96, warn: 0.02 },
    core: { pass: 0.92, warn: 0.04 },
    edge: { pass: 0.82, warn: 0.08 },
    stress: { pass: 0.78, warn: 0.10 },
    regression: { pass: 0.90, warn: 0.05 },
  };
  const { pass, warn } = rates[cat];
  if (r < pass) return "pass";
  if (r < pass + warn) return "warning";
  return "fail";
}

function majorityOf(a: CheckerResult, b: CheckerResult, c: CheckerResult): MajorityDecision {
  const vals = [a, b, c];
  if (a === b && b === c) return a as MajorityDecision;
  if (a !== b && b !== c && a !== c) return "critical_inconsistency";
  // 2-out-of-3
  for (const v of ["pass", "fail", "warning"] as CheckerResult[]) {
    if (vals.filter(x => x === v).length >= 2) return v as MajorityDecision;
  }
  return "critical_inconsistency";
}

function classifySeverity(decision: MajorityDecision, cat: TestCategory): Severity {
  if (decision === "critical_inconsistency") return "critical";
  if (decision === "fail") return cat === "smoke" ? "critical" : cat === "core" ? "high" : "medium";
  if (decision === "warning") return "low";
  return "low";
}

function simulateRerun(cat: TestCategory): CheckerResult[] {
  return [simulateChecker(cat), simulateChecker(cat), simulateChecker(cat)];
}

function classifyRepro(rerunResults: CheckerResult[][], originalDecision: MajorityDecision): ReproResult {
  if (originalDecision === "pass") return "not_applicable";
  const rerunDecisions = rerunResults.map(r => majorityOf(r[0], r[1], r[2]));
  const allSame = rerunDecisions.every(d => d === originalDecision);
  const noneSame = rerunDecisions.every(d => d !== originalDecision);
  if (allSame) return "stable_failure";
  if (noneSame) return "non_reproducible";
  return "intermittent_failure";
}

function generateNotes(decision: MajorityDecision, repro: ReproResult, a: CheckerResult, b: CheckerResult, c: CheckerResult): string {
  if (decision === "critical_inconsistency") return "All 3 checkers diverged — requires manual review";
  const diverged = [a !== decision ? "A" : "", b !== decision ? "B" : "", c !== decision ? "C" : ""].filter(Boolean);
  if (diverged.length > 0 && decision !== "pass") {
    const reproNote = repro === "stable_failure" ? "Failure is reproducible" : repro === "intermittent_failure" ? "Failure is intermittent" : repro === "non_reproducible" ? "Could not reproduce on rerun" : "";
    return `Checker ${diverged.join(",")} diverged. ${reproNote}`.trim();
  }
  if (diverged.length > 0) return `Isolated divergence from Checker ${diverged.join(",")}`;
  return decision === "pass" ? "All checkers agree — PASS" : "";
}

export function runTestSuite(cases: TestCase[], settings: TestSettings): TestResult[] {
  return cases.map(tc => {
    const a = simulateChecker(tc.category);
    const b = simulateChecker(tc.category);
    const c = simulateChecker(tc.category);
    const decision = majorityOf(a, b, c);
    const needsRerun = decision !== "pass" || a !== b || b !== c;
    const reruns = needsRerun ? Array.from({ length: settings.rerunCount }, () => simulateRerun(tc.category)) : undefined;
    const repro = reruns ? classifyRepro(reruns, decision) : "not_applicable" as ReproResult;
    const severity = classifySeverity(decision, tc.category);
    const notes = generateNotes(decision, repro, a, b, c);
    return { testId: tc.id, testName: tc.name, category: tc.category, checkerA: a, checkerB: b, checkerC: c, majorityDecision: decision, reproResult: repro, severity, notes, rerunResults: reruns };
  });
}

// ── Metrics Calculation ────────────────────────────────────────────────────
export function calculateMetrics(results: TestResult[], settings: TestSettings): RunMetrics {
  const total = results.length;
  const passed = results.filter(r => r.majorityDecision === "pass").length;
  const failed = results.filter(r => r.majorityDecision === "fail").length;
  const warnings = results.filter(r => r.majorityDecision === "warning").length;
  const criticals = results.filter(r => r.majorityDecision === "critical_inconsistency").length;

  const allAgree = results.filter(r => r.checkerA === r.checkerB && r.checkerB === r.checkerC).length;
  const agreementRate = total > 0 ? (allAgree / total) * 100 : 0;

  const divergeA = results.filter(r => {
    const m = r.majorityDecision; return m !== "critical_inconsistency" && r.checkerA !== m;
  }).length;
  const divergeB = results.filter(r => {
    const m = r.majorityDecision; return m !== "critical_inconsistency" && r.checkerB !== m;
  }).length;
  const divergeC = results.filter(r => {
    const m = r.majorityDecision; return m !== "critical_inconsistency" && r.checkerC !== m;
  }).length;

  const nonPass = results.filter(r => r.majorityDecision !== "pass");
  const reproCount = nonPass.length;
  const stableOrNA = results.filter(r => r.reproResult === "not_applicable" || r.reproResult === "stable_failure").length;
  const reproducibilityScore = total > 0 ? (stableOrNA / total) * 100 : 100;

  const passRate = total > 0 ? (passed / total) * 100 : 0;

  const edgeTests = results.filter(r => r.category === "edge");
  const edgePass = edgeTests.length > 0 ? (edgeTests.filter(r => r.majorityDecision === "pass").length / edgeTests.length) * 100 : 100;
  const stressTests = results.filter(r => r.category === "stress");
  const stressPass = stressTests.length > 0 ? (stressTests.filter(r => r.majorityDecision === "pass").length / stressTests.length) * 100 : 100;

  const w = settings.weights;
  const reliabilityScore = Math.min(100, Math.max(0,
    (passRate * w.passRate / 100) +
    (agreementRate * w.agreement / 100) +
    (reproducibilityScore * w.reproducibility / 100) +
    (edgePass * w.edgeCase / 100) +
    (stressPass * w.stress / 100)
  ));

  const confidence: Confidence = reliabilityScore >= 90 ? "Excellent" : reliabilityScore >= 80 ? "Good" : reliabilityScore >= 65 ? "Moderate" : reliabilityScore >= 50 ? "Weak" : "Critical";

  const deployRecommendation: DeployRecommendation =
    reliabilityScore >= 90 ? "Approve" :
    reliabilityScore >= 80 ? "Approve with Monitoring" :
    reliabilityScore >= 65 ? "Retest After Fixes" :
    "Reject Deployment";

  const cats: TestCategory[] = ["smoke", "core", "edge", "stress", "regression"];
  const categoryBreakdown = {} as RunMetrics["categoryBreakdown"];
  for (const cat of cats) {
    const catResults = results.filter(r => r.category === cat);
    categoryBreakdown[cat] = {
      total: catResults.length,
      passed: catResults.filter(r => r.majorityDecision === "pass").length,
      failed: catResults.filter(r => r.majorityDecision === "fail" || r.majorityDecision === "critical_inconsistency").length,
      warnings: catResults.filter(r => r.majorityDecision === "warning").length,
    };
  }

  return {
    totalTests: total, passed, failed, warnings, criticalInconsistencies: criticals,
    checkerAgreementRate: agreementRate,
    checkerADivergence: total > 0 ? (divergeA / total) * 100 : 0,
    checkerBDivergence: total > 0 ? (divergeB / total) * 100 : 0,
    checkerCDivergence: total > 0 ? (divergeC / total) * 100 : 0,
    reproducibilityScore, reliabilityScore, confidence, deployRecommendation, categoryBreakdown,
  };
}
