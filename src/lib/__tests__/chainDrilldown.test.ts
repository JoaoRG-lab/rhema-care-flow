import { describe, it, expect } from "vitest";
import { buildDomainDiffs, buildDrilldownReport } from "../chainDrilldown";

describe("chainDrilldown.buildDomainDiffs", () => {
  it("flags added records when current > stored", () => {
    const diffs = buildDomainDiffs(
      { visits: 5, scores: 3 },
      { visits: 3, scores: 3 },
    );
    const visits = diffs.find((d) => d.key === "visits")!;
    expect(visits.delta).toBe(2);
    expect(visits.direction).toBe("added");
    const scores = diffs.find((d) => d.key === "scores")!;
    expect(scores.direction).toBe("unchanged");
  });

  it("flags removed records when current < stored", () => {
    const diffs = buildDomainDiffs(
      { infusions: 1 },
      { infusions: 4 },
    );
    const infusions = diffs.find((d) => d.key === "infusions")!;
    expect(infusions.delta).toBe(-3);
    expect(infusions.direction).toBe("removed");
  });

  it("treats missing keys as zero", () => {
    const diffs = buildDomainDiffs({}, { monitoring: 2 });
    const monitoring = diffs.find((d) => d.key === "monitoring")!;
    expect(monitoring.stored).toBe(2);
    expect(monitoring.current).toBe(0);
    expect(monitoring.direction).toBe("removed");
  });

  it("always returns all four canonical domains", () => {
    const diffs = buildDomainDiffs({}, {});
    expect(diffs.map((d) => d.key).sort()).toEqual([
      "infusions",
      "monitoring",
      "scores",
      "visits",
    ]);
  });
});

describe("chainDrilldown.buildDrilldownReport", () => {
  it("identifies multiple changed domains and sums total delta", () => {
    const report = buildDrilldownReport(
      { visits: 6, scores: 2, infusions: 1, monitoring: 0 },
      { visits: 4, scores: 3, infusions: 1, monitoring: 0 },
      false,
    );
    expect(report.changedDomainCount).toBe(2);
    expect(report.changed.map((c) => c.key).sort()).toEqual(["scores", "visits"]);
    expect(report.totalDelta).toBe(3); // |+2| + |-1|
    expect(report.contentEditedFallback).toBe(false);
  });

  it("activates content-edited fallback when counts match but hashes differ", () => {
    const report = buildDrilldownReport(
      { visits: 5, scores: 5, infusions: 2, monitoring: 1 },
      { visits: 5, scores: 5, infusions: 2, monitoring: 1 },
      false,
    );
    expect(report.changedDomainCount).toBe(0);
    expect(report.totalDelta).toBe(0);
    expect(report.contentEditedFallback).toBe(true);
  });

  it("does NOT activate fallback when hashes match", () => {
    const report = buildDrilldownReport(
      { visits: 5 },
      { visits: 5 },
      true,
    );
    expect(report.contentEditedFallback).toBe(false);
  });

  it("does NOT activate fallback when there are real count changes", () => {
    const report = buildDrilldownReport(
      { visits: 6 },
      { visits: 5 },
      false,
    );
    expect(report.contentEditedFallback).toBe(false);
    expect(report.changed[0]).toMatchObject({ key: "visits", direction: "added", delta: 1 });
  });

  it("handles a pure-removal scenario (e.g., visit deleted)", () => {
    const report = buildDrilldownReport(
      { visits: 2, scores: 1 },
      { visits: 3, scores: 1 },
      false,
    );
    expect(report.changedDomainCount).toBe(1);
    expect(report.changed[0].direction).toBe("removed");
    expect(report.totalDelta).toBe(1);
  });
});
