// Patient timeline canonical hashing for on-chain anchoring.
// PHI stays off-chain — only SHA-256 of canonical JSON is anchored.
import { canonicalize, sha256 } from "@/lib/crypto";
import { supabase } from "@/integrations/supabase/client";

export const PATIENT_TIMELINE_VARIABLES = [
  // Core clinical
  "patient_code",
  "diagnosis_tags",
  "therapy_tags",
  "risk_flags",
  "last_visit_date",
  "next_followup_date",
  // Visits
  "visit.visit_date",
  "visit.disease_activity",
  "visit.actions",
  "visit.labs_ordered",
  "visit.imaging",
  "visit.next_steps",
  // Scores
  "score.score_type",
  "score.calculated_score",
  "score.data_json",
  "score.created_at",
  // Infusions
  "infusion.drug",
  "infusion.next_date",
  "infusion.interval_days",
  "infusion.pre_checklist",
  // Monitoring
  "monitoring.event_type",
  "monitoring.due_date",
  "monitoring.status",
  "monitoring.completed_at",
] as const;

export interface PatientTimelineSnapshot {
  patient_card_id: string;
  schema_version: 1;
  variable_codes: string[];
  core: Record<string, unknown>;
  visits: unknown[];
  scores: unknown[];
  infusions: unknown[];
  monitoring: unknown[];
}

export interface BuiltAnchor {
  snapshot: PatientTimelineSnapshot;
  canonical: string;
  hashHex: string;
  hashBytes: Uint8Array;
  counts: { visits: number; scores: number; infusions: number; monitoring: number };
}

function toHex(u8: Uint8Array): string {
  return Array.from(u8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Builds a deterministic, PHI-free hash of the full patient timeline owned by
 * the current authenticated doctor. Returns the canonical JSON, hash and counts.
 *
 * RLS on patient_cards / visits / score_entries / infusion_events / monitoring_events
 * guarantees this only returns the calling doctor's own data.
 */
export async function buildPatientTimelineAnchor(
  patientCardId: string
): Promise<BuiltAnchor> {
  const [
    { data: patient, error: pErr },
    { data: visits, error: vErr },
    { data: scores, error: sErr },
    { data: infusions, error: iErr },
    { data: monitoring, error: mErr },
  ] = await Promise.all([
    supabase
      .from("patient_cards_secure")
      .select(
        "id, patient_code, diagnosis_tags, therapy_tags, risk_flags, last_visit_date, next_followup_date"
      )
      .eq("id", patientCardId)
      .maybeSingle(),
    supabase
      .from("visits_secure" as any)
      .select(
        "id, visit_date, disease_activity, actions, labs_ordered, imaging, next_steps"
      )
      .eq("patient_card_id", patientCardId)
      .order("visit_date", { ascending: true }),
    supabase
      .from("score_entries_secure")
      .select("id, score_type, calculated_score, data_json, created_at, visit_id")
      .eq("patient_card_id", patientCardId)
      .order("created_at", { ascending: true }),
    supabase
      .from("infusion_events_secure")
      .select("id, drug, next_date, interval_days, pre_checklist")
      .eq("patient_card_id", patientCardId)
      .order("next_date", { ascending: true }),
    supabase
      .from("monitoring_events_secure")
      .select("id, event_type, due_date, status, completed_at")
      .eq("patient_card_id", patientCardId)
      .order("due_date", { ascending: true }),
  ]);

  const firstErr = pErr || vErr || sErr || iErr || mErr;
  if (firstErr) throw new Error(firstErr.message);
  if (!patient) throw new Error("Patient not found or access denied");

  const snapshot: PatientTimelineSnapshot = {
    patient_card_id: patientCardId,
    schema_version: 1,
    variable_codes: [...PATIENT_TIMELINE_VARIABLES],
    core: patient as Record<string, unknown>,
    visits: visits ?? [],
    scores: scores ?? [],
    infusions: infusions ?? [],
    monitoring: monitoring ?? [],
  };

  const canonical = canonicalize(snapshot);
  const hashBytes = await sha256(new TextEncoder().encode(canonical));

  return {
    snapshot,
    canonical,
    hashHex: toHex(hashBytes),
    hashBytes,
    counts: {
      visits: snapshot.visits.length,
      scores: snapshot.scores.length,
      infusions: snapshot.infusions.length,
      monitoring: snapshot.monitoring.length,
    },
  };
}
