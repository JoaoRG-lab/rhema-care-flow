import { describe, it, expect } from "vitest";
import { canonicalize, sha256 } from "@/lib/crypto";
import { hashPatientCode, PATIENT_TIMELINE_VARIABLES } from "@/lib/patientChainAnchor";

function toHex(u8: Uint8Array): string {
  return Array.from(u8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashOf(obj: unknown): Promise<string> {
  const canonical = canonicalize(obj);
  const bytes = await sha256(new TextEncoder().encode(canonical));
  return toHex(bytes);
}

// Mirrors the structural shape produced by buildPatientTimelineAnchor without
// hitting Supabase. This lets us assert determinism of the canonical hashing
// pipeline that is the basis of every on-chain patient anchor.
function makeSnapshot(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    patient_card_id: "card-123",
    schema_version: 1 as const,
    variable_codes: [...PATIENT_TIMELINE_VARIABLES],
    core: {
      id: "card-123",
      diagnosis_tags: ["RA", "PsA"],
      therapy_tags: ["MTX"],
      risk_flags: ["smoker"],
      last_visit_date: "2026-01-10",
      next_followup_date: "2026-04-10",
      patient_code_hash: "deadbeef".repeat(8),
    },
    visits: [
      {
        id: "v1",
        visit_date: "2026-01-10",
        disease_activity: "moderate",
        actions: ["adjust_dose"],
        labs_ordered: ["CBC"],
        imaging: [],
        next_steps: "follow up 3mo",
      },
    ],
    scores: [
      {
        id: "s1",
        score_type: "DAS28",
        calculated_score: 3.2,
        data_json: { tjc: 2, sjc: 1, vas: 30, crp: 5 },
        created_at: "2026-01-10T10:00:00Z",
        visit_id: "v1",
      },
    ],
    infusions: [],
    monitoring: [],
    ...overrides,
  };
}

describe("canonical JSON hashing — determinism", () => {
  it("produces the same SHA-256 for the exact same snapshot", async () => {
    const snap = makeSnapshot();
    const h1 = await hashOf(snap);
    const h2 = await hashOf(snap);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is independent of object key insertion order", async () => {
    const a = {
      patient_card_id: "card-123",
      schema_version: 1,
      core: { a: 1, b: 2, c: 3 },
    };
    const b = {
      core: { c: 3, b: 2, a: 1 },
      schema_version: 1,
      patient_card_id: "card-123",
    };
    expect(await hashOf(a)).toBe(await hashOf(b));
  });

  it("is independent of nested key order across visits and scores", async () => {
    const ordered = makeSnapshot();
    const reordered = makeSnapshot({
      // Reorder top-level keys
      monitoring: [],
      infusions: [],
      scores: [
        {
          visit_id: "v1",
          created_at: "2026-01-10T10:00:00Z",
          data_json: { crp: 5, vas: 30, sjc: 1, tjc: 2 },
          calculated_score: 3.2,
          score_type: "DAS28",
          id: "s1",
        },
      ],
      visits: [
        {
          next_steps: "follow up 3mo",
          imaging: [],
          labs_ordered: ["CBC"],
          actions: ["adjust_dose"],
          disease_activity: "moderate",
          visit_date: "2026-01-10",
          id: "v1",
        },
      ],
    });
    expect(await hashOf(ordered)).toBe(await hashOf(reordered));
  });

  it("changes the hash when any clinical value changes", async () => {
    const base = makeSnapshot();
    const mutated = makeSnapshot({
      scores: [
        {
          id: "s1",
          score_type: "DAS28",
          calculated_score: 5.1, // changed
          data_json: { tjc: 2, sjc: 1, vas: 30, crp: 5 },
          created_at: "2026-01-10T10:00:00Z",
          visit_id: "v1",
        },
      ],
    });
    expect(await hashOf(base)).not.toBe(await hashOf(mutated));
  });

  it("changes the hash when array order changes (arrays are order-sensitive by design)", async () => {
    const a = makeSnapshot({ visits: [{ id: "v1" }, { id: "v2" }] });
    const b = makeSnapshot({ visits: [{ id: "v2" }, { id: "v1" }] });
    expect(await hashOf(a)).not.toBe(await hashOf(b));
  });
});

describe("hashPatientCode", () => {
  it("is deterministic for the same input", async () => {
    const h1 = await hashPatientCode("PAT-001");
    const h2 = await hashPatientCode("PAT-001");
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  it("uses the v1 domain-separated prefix (non-identifying)", async () => {
    const expectedBytes = await sha256(
      new TextEncoder().encode("patient_code:v1|PAT-001"),
    );
    expect(await hashPatientCode("PAT-001")).toBe(toHex(expectedBytes));
  });

  it("produces different digests for different codes", async () => {
    const a = await hashPatientCode("PAT-001");
    const b = await hashPatientCode("PAT-002");
    expect(a).not.toBe(b);
  });
});
