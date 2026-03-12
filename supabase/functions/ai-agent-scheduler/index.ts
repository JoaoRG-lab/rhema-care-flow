import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Configuration — runs 23h/day, maintenance at 07:00 UTC (4 AM UTC-3)
const MAINTENANCE_HOUR_UTC = 7; // 4 AM UTC-3 = 7 AM UTC
const PEAK_HOURS_START = 1;     // 01:00 UTC
const PEAK_HOURS_END = 6;       // 06:00 UTC
const INACTIVITY_THRESHOLD_HOURS = 3;

interface SchedulerConfig {
  force_run?: boolean;
  task_type?: string;
  agents?: string[]; // which agents to run: "site", "research", "verification", "all"
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body: SchedulerConfig = await req.json().catch(() => ({}));
    const forceRun = body.force_run || false;
    const agentsToRun = body.agents || ["all"];

    const now = new Date();
    const currentHour = now.getUTCHours();

    console.log(`[Scheduler] Checking at ${now.toISOString()} (UTC hour: ${currentHour})`);

    // Check quiet hours
    const isQuietHours = currentHour >= QUIET_HOURS_START && currentHour < QUIET_HOURS_END;
    
    if (isQuietHours && !forceRun) {
      console.log(`[Scheduler] Quiet hours. Skipping.`);
      return new Response(
        JSON.stringify({ success: true, action: "skipped", reason: "quiet_hours", current_hour: currentHour }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check recent site activity
    const threeHoursAgo = new Date(now.getTime() - INACTIVITY_THRESHOLD_HOURS * 60 * 60 * 1000);
    const { count: activityCount } = await supabase
      .from("site_activity_log")
      .select("*", { count: "exact", head: true })
      .gte("created_at", threeHoursAgo.toISOString());

    const hasRecentActivity = (activityCount || 0) > 0;
    const isPeakHours = currentHour >= PEAK_HOURS_START && currentHour < PEAK_HOURS_END;

    let shouldRun = false;
    let runReason = "";

    if (forceRun) { shouldRun = true; runReason = "force_run"; }
    else if (isPeakHours) { shouldRun = true; runReason = "peak_hours"; }
    else if (hasRecentActivity) { shouldRun = true; runReason = "recent_activity"; }
    else { runReason = "no_activity"; }

    console.log(`[Scheduler] Decision: shouldRun=${shouldRun}, reason=${runReason}`);

    if (!shouldRun) {
      return new Response(
        JSON.stringify({ success: true, action: "skipped", reason: runReason, activity_count: activityCount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Record<string, any> = {};
    const runAll = agentsToRun.includes("all");

    // ─── 1. AI Site Agent (trending topics, content gaps, quality) ───
    if (runAll || agentsToRun.includes("site")) {
      const runLog = await logAgentStart(supabase, "ai-site-agent");
      try {
        console.log("[Scheduler] Running AI Site Agent...");
        const resp = await fetch(`${supabaseUrl}/functions/v1/ai-site-agent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify({ task_type: body.task_type || "all" }),
        });
        const result = await resp.json();
        results.site_agent = result;
        await logAgentEnd(supabase, runLog?.id, result.success, result);
      } catch (err) {
        results.site_agent = { error: err instanceof Error ? err.message : "Unknown" };
        await logAgentEnd(supabase, runLog?.id, false, null, results.site_agent.error);
      }
    }

    // ─── 2. AI Research Engine (batch process: generate articles + verify) ───
    if (runAll || agentsToRun.includes("research")) {
      const runLog = await logAgentStart(supabase, "ai-research-engine");
      try {
        console.log("[Scheduler] Running AI Research Engine batch...");
        
        // Seed queue if empty
        const { count: queueCount } = await supabase
          .from("research_topic_queue")
          .select("*", { count: "exact", head: true })
          .eq("status", "queued");

        if ((queueCount || 0) === 0) {
          console.log("[Scheduler] Queue empty, seeding trending topics...");
          await seedResearchQueue(supabase, supabaseUrl, supabaseKey);
        }

        // Process queued topics using service role (bypass auth)
        const resp = await fetch(`${supabaseUrl}/functions/v1/ai-research-engine`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${supabaseKey}` 
          },
          body: JSON.stringify({ action: "batch_process" }),
        });
        const result = await resp.json();
        results.research_engine = result;
        await logAgentEnd(supabase, runLog?.id, result.success !== false, result);
      } catch (err) {
        results.research_engine = { error: err instanceof Error ? err.message : "Unknown" };
        await logAgentEnd(supabase, runLog?.id, false, null, results.research_engine.error);
      }
    }

    // ─── 3. AI Sentinel (verify existing content for factual drift) ───
    if (runAll || agentsToRun.includes("verification")) {
      const runLog = await logAgentStart(supabase, "ai-sentinel");
      try {
        console.log("[Scheduler] Running AI Sentinel content check...");
        const resp = await fetch(`${supabaseUrl}/functions/v1/ai-sentinel`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify({ action: "patrol" }),
        });
        const result = await resp.json();
        results.sentinel = result;
        await logAgentEnd(supabase, runLog?.id, result.success !== false, result);
      } catch (err) {
        results.sentinel = { error: err instanceof Error ? err.message : "Unknown" };
        await logAgentEnd(supabase, runLog?.id, false, null, results.sentinel.error);
      }
    }

    console.log("[Scheduler] All agents completed.");

    return new Response(
      JSON.stringify({
        success: true,
        action: "executed",
        reason: runReason,
        is_peak_hours: isPeakHours,
        activity_count: activityCount,
        current_hour: currentHour,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Scheduler] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── Helper: Log agent run start ───
async function logAgentStart(supabase: any, agentName: string) {
  const { data, error } = await supabase
    .from("agent_run_log")
    .insert({ agent_name: agentName, status: "running" })
    .select()
    .single();
  if (error) console.error(`[Scheduler] Failed to log start for ${agentName}:`, error);
  return data;
}

// ─── Helper: Log agent run end ───
async function logAgentEnd(supabase: any, runId: string | undefined, success: boolean, result: any, errorMsg?: string) {
  if (!runId) return;
  await supabase
    .from("agent_run_log")
    .update({
      status: success ? "completed" : "failed",
      results: result || {},
      completed_at: new Date().toISOString(),
      error_message: errorMsg || null,
    })
    .eq("id", runId);
}

// ─── Helper: Seed research queue with AI-discovered topics ───
async function seedResearchQueue(supabase: any, supabaseUrl: string, supabaseKey: string) {
  const seedTopics = [
    { topic: "JAK Inhibitor Safety Updates 2026", category: "Treatment Safety", disease_area: "Rheumatoid Arthritis", priority: 9 },
    { topic: "IL-17 vs IL-23 Inhibitors in Psoriatic Arthritis", category: "Treatment Comparison", disease_area: "Psoriatic Arthritis", priority: 8 },
    { topic: "Treat-to-Target in Axial Spondyloarthritis", category: "Treatment Strategy", disease_area: "Axial SpA", priority: 8 },
    { topic: "Lupus Nephritis Classification and Treatment 2026", category: "Classification", disease_area: "SLE", priority: 9 },
    { topic: "Biologic Tapering Strategies in Rheumatoid Arthritis", category: "Treatment Management", disease_area: "Rheumatoid Arthritis", priority: 7 },
    { topic: "Cardiovascular Risk in Inflammatory Arthritis", category: "Comorbidity", disease_area: "General Rheumatology", priority: 8 },
    { topic: "Ultrasound-Guided Joint Injections Best Practices", category: "Procedures", disease_area: "General Rheumatology", priority: 6 },
    { topic: "Pregnancy Management in Autoimmune Diseases", category: "Special Populations", disease_area: "General Rheumatology", priority: 9 },
  ];

  for (const t of seedTopics) {
    const { data: existing } = await supabase
      .from("research_topic_queue")
      .select("id")
      .eq("topic", t.topic)
      .single();
    
    if (!existing) {
      await supabase.from("research_topic_queue").insert({
        ...t,
        source: "ai_agent",
        status: "queued",
      });
    }
  }
  console.log("[Scheduler] Seeded research queue with initial topics.");
}
