// Pure helpers for analyzing patient-anchor verification mismatches.
// Extracted so they can be unit-tested independently of UI/Supabase.

export type DomainKey = "visits" | "scores" | "infusions" | "monitoring";

export const DOMAIN_KEYS: readonly DomainKey[] = [
  "visits",
  "scores",
  "infusions",
  "monitoring",
] as const;

export interface DomainCounts {
  visits?: number;
  scores?: number;
  infusions?: number;
  monitoring?: number;
}

export interface DomainDiff {
  key: DomainKey;
  stored: number;
  current: number;
  delta: number;
  direction: "added" | "removed" | "unchanged";
}

export interface DrilldownReport {
  diffs: DomainDiff[];
  changed: DomainDiff[];
  totalDelta: number;
  changedDomainCount: number;
  /** True when hashes differ but every domain count is identical. */
  contentEditedFallback: boolean;
}

export function buildDomainDiffs(
  current: DomainCounts,
  stored: DomainCounts,
): DomainDiff[] {
  return DOMAIN_KEYS.map((key) => {
    const c = current[key] ?? 0;
    const s = stored[key] ?? 0;
    const delta = c - s;
    return {
      key,
      stored: s,
      current: c,
      delta,
      direction: delta === 0 ? "unchanged" : delta > 0 ? "added" : "removed",
    };
  });
}

export function buildDrilldownReport(
  current: DomainCounts,
  stored: DomainCounts,
  hashesMatch: boolean,
): DrilldownReport {
  const diffs = buildDomainDiffs(current, stored);
  const changed = diffs.filter((d) => d.direction !== "unchanged");
  const totalDelta = changed.reduce((sum, d) => sum + Math.abs(d.delta), 0);
  return {
    diffs,
    changed,
    totalDelta,
    changedDomainCount: changed.length,
    contentEditedFallback: !hashesMatch && changed.length === 0,
  };
}
