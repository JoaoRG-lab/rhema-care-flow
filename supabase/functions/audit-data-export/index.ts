import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptSecret, encodeBase64, generateKey } from "../_shared/crypto.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PII field names that must be encrypted
const PII_FIELDS = new Set([
  "email", "full_name", "phone_number", "patient_phone", "patient_email",
  "institutional_email", "license_number", "certification_credential",
  "orcid_id", "linkedin_url", "avatar_url", "ip_address", "user_agent",
  "notes", "provider_notes", "patient_notes", "reviewer_notes",
  "description", "content", "message", "body", "subject",
  "name", "organization", "position", "department", "institution",
  "mrn_last4", "patient_code", "portfolio_url", "github_username",
  "expertise_statement", "clinical_trial_roles", "guideline_contributions",
  "moc_status", "sender_email", "sender_name", "company_name",
  "hardware_pubkey", "hardware_serial_hash", "seed_hash",
  "twilio_phone_number", "error_message",
]);

// Tables to export with their sensitivity level
const TABLES_CONFIG: Array<{
  table: string;
  sensitivity: "high" | "medium" | "low";
  description: string;
}> = [
  { table: "profiles", sensitivity: "high", description: "User profiles" },
  { table: "patient_cards", sensitivity: "high", description: "Patient cards (de-identified)" },
  { table: "visits", sensitivity: "high", description: "Patient visits" },
  { table: "score_entries", sensitivity: "medium", description: "Clinical score entries" },
  { table: "monitoring_events", sensitivity: "medium", description: "Monitoring events" },
  { table: "infusion_events", sensitivity: "medium", description: "Infusion events" },
  { table: "tasks", sensitivity: "low", description: "User tasks" },
  { table: "shifts", sensitivity: "low", description: "Work shifts" },
  { table: "focus_sessions", sensitivity: "low", description: "Focus sessions" },
  { table: "consultation_sessions", sensitivity: "high", description: "Consultation sessions" },
  { table: "audit_logs", sensitivity: "medium", description: "Audit trail" },
  { table: "custody_audit_log", sensitivity: "medium", description: "Custody audit log" },
  { table: "ultimate_user_custody", sensitivity: "high", description: "Hardware custody records" },
  { table: "user_roles", sensitivity: "low", description: "User roles" },
  { table: "verification_requests", sensitivity: "high", description: "Verification requests" },
  { table: "knowledge_contributions", sensitivity: "medium", description: "Knowledge contributions" },
  { table: "contribution_comments", sensitivity: "medium", description: "Comments" },
  { table: "contribution_votes", sensitivity: "low", description: "Votes" },
  { table: "education_content", sensitivity: "medium", description: "Education content" },
  { table: "ai_research_pipeline", sensitivity: "medium", description: "AI research pipeline" },
  { table: "ai_review_logs", sensitivity: "low", description: "AI review logs" },
  { table: "sentinel_alerts", sensitivity: "low", description: "Sentinel alerts" },
  { table: "research_topic_queue", sensitivity: "low", description: "Research topic queue" },
  { table: "agent_run_log", sensitivity: "low", description: "Agent run logs" },
  { table: "site_activity_log", sensitivity: "low", description: "Site activity log" },
  { table: "rate_limits", sensitivity: "low", description: "Rate limits" },
  { table: "outreach_contacts", sensitivity: "high", description: "Outreach contacts" },
  { table: "outreach_campaigns", sensitivity: "medium", description: "Outreach campaigns" },
  { table: "outreach_sends", sensitivity: "low", description: "Outreach sends" },
  { table: "outreach_templates", sensitivity: "medium", description: "Outreach templates" },
  { table: "scheduled_sms", sensitivity: "high", description: "Scheduled SMS" },
  { table: "sms_preferences", sensitivity: "medium", description: "SMS preferences" },
  { table: "sms_templates", sensitivity: "medium", description: "SMS templates" },
  { table: "monitoring_plans", sensitivity: "medium", description: "Monitoring plans" },
];

async function encryptValue(value: string, encKey: string): Promise<string> {
  if (!value || value.trim() === "") return "";
  const result = await encryptSecret(value, encKey);
  return `ENC:${result.iv_b64}:${result.ciphertext_b64}`;
}

async function encryptRow(row: Record<string, unknown>, encKey: string): Promise<Record<string, unknown>> {
  const encrypted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (PII_FIELDS.has(key) && typeof value === "string" && value.length > 0) {
      encrypted[key] = await encryptValue(value, encKey);
    } else if (key === "metadata" && typeof value === "object" && value !== null) {
      // Encrypt entire metadata blob
      encrypted[key] = await encryptValue(JSON.stringify(value), encKey);
    } else if (key.endsWith("_encrypted")) {
      // Already encrypted at DB level, redact
      encrypted[key] = value ? "[DB_ENCRYPTED]" : null;
    } else {
      encrypted[key] = value;
    }
  }
  return encrypted;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Generate a one-time encryption key for this export
    const encKey = await generateKey();

    const exportTimestamp = new Date().toISOString();
    const tables: Record<string, {
      description: string;
      sensitivity: string;
      row_count: number;
      data: Record<string, unknown>[];
    }> = {};

    // Export each table with encrypted PII
    for (const config of TABLES_CONFIG) {
      try {
        const { data, error } = await adminClient
          .from(config.table)
          .select("*")
          .limit(10000);

        if (error) {
          tables[config.table] = {
            description: config.description,
            sensitivity: config.sensitivity,
            row_count: 0,
            data: [{ _error: error.message }],
          };
          continue;
        }

        const rows = data || [];
        const encryptedRows: Record<string, unknown>[] = [];
        for (const row of rows) {
          encryptedRows.push(await encryptRow(row as Record<string, unknown>, encKey));
        }

        tables[config.table] = {
          description: config.description,
          sensitivity: config.sensitivity,
          row_count: rows.length,
          data: encryptedRows,
        };
      } catch (tableErr) {
        tables[config.table] = {
          description: config.description,
          sensitivity: config.sensitivity,
          row_count: 0,
          data: [{ _error: String(tableErr) }],
        };
      }
    }

    // Build export manifest
    const totalRows = Object.values(tables).reduce((sum, t) => sum + t.row_count, 0);
    const manifest = {
      export_metadata: {
        version: "1.0.0",
        generated_at: exportTimestamp,
        generated_by: user.id,
        platform: "UHS Health OS",
        encryption: {
          algorithm: "AES-256-GCM",
          key_delivery: "included_in_export",
          pii_fields_encrypted: Array.from(PII_FIELDS),
          note: "Use the decryption_key below with AES-256-GCM to decrypt fields prefixed with 'ENC:'",
        },
        statistics: {
          total_tables: Object.keys(tables).length,
          total_rows: totalRows,
          high_sensitivity_tables: TABLES_CONFIG.filter(t => t.sensitivity === "high").length,
          medium_sensitivity_tables: TABLES_CONFIG.filter(t => t.sensitivity === "medium").length,
          low_sensitivity_tables: TABLES_CONFIG.filter(t => t.sensitivity === "low").length,
        },
      },
      decryption_key: encKey,
      tables,
    };

    // Log this audit export
    await adminClient.from("audit_logs").insert({
      user_id: user.id,
      action: "export",
      resource_type: "audit_data_export",
      metadata: {
        total_tables: Object.keys(tables).length,
        total_rows: totalRows,
        export_timestamp: exportTimestamp,
      },
      user_agent: req.headers.get("user-agent"),
    });

    return new Response(JSON.stringify(manifest, null, 2), {
      status: 200,
      headers: {
        ...CORS,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="uhs-audit-export-${exportTimestamp.slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
