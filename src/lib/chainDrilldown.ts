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

/**
 * Suggests which record attributes most likely changed for a given domain,
 * based on the direction of the count delta (added vs removed) and known
 * canonical fields included in the on-chain hash. When counts are unchanged
 * but the hash differs, every domain is treated as a potential edit target.
 */
export function getFieldHints(
  key: DomainKey,
  direction: "added" | "removed" | "unchanged",
): string[] {
  const FIELDS: Record<DomainKey, string[]> = {
    visits: ["visit_date", "disease_activity", "actions", "labs_ordered", "imaging", "next_steps"],
    scores: ["score_type", "calculated_score", "data_json (inputs)", "created_at"],
    infusions: ["drug", "next_date", "interval_days", "pre_checklist"],
    monitoring: ["event_type", "due_date", "status", "completed_at"],
  };
  return FIELDS[key];
}

export interface FieldHintGroup {
  key: DomainKey;
  direction: "added" | "removed" | "unchanged" | "edited";
  fields: string[];
}

/**
 * Produces field-level hint groups suitable for UI rendering, covering both
 * added/removed domains and the content-edited fallback (counts identical,
 * hash mismatch — likely an in-place value edit).
 */
export function buildFieldHints(report: DrilldownReport): FieldHintGroup[] {
  if (report.contentEditedFallback) {
    return DOMAIN_KEYS.map((key) => ({
      key,
      direction: "edited" as const,
      fields: getFieldHints(key, "unchanged"),
    }));
  }
  return report.changed.map((d) => ({
    key: d.key,
    direction: d.direction,
    fields: getFieldHints(d.key, d.direction),
  }));
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
