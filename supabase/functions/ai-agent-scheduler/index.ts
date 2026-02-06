import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Configuration
const QUIET_HOURS_START = 18; // 18:00 UTC
const QUIET_HOURS_END = 22;   // 22:00 UTC
const PEAK_HOURS_START = 1;   // 01:00 UTC
const PEAK_HOURS_END = 6;     // 06:00 UTC
const INACTIVITY_THRESHOLD_HOURS = 3;

interface SchedulerConfig {
  force_run?: boolean;
  task_type?: string;
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

    // Current time in UTC
    const now = new Date();
    const currentHour = now.getUTCHours();

    // Log this scheduler check
    console.log(`[Scheduler] Checking at ${now.toISOString()} (UTC hour: ${currentHour})`);

    // 1. Check if we're in quiet hours (18:00-22:00 UTC)
    const isQuietHours = currentHour >= QUIET_HOURS_START && currentHour < QUIET_HOURS_END;
    
    if (isQuietHours && !forceRun) {
      console.log(`[Scheduler] Quiet hours (${QUIET_HOURS_START}:00-${QUIET_HOURS_END}:00 UTC). Skipping.`);
      return new Response(
        JSON.stringify({
          success: true,
          action: "skipped",
          reason: "quiet_hours",
          current_hour: currentHour,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check recent site activity (last 3 hours)
    const threeHoursAgo = new Date(now.getTime() - INACTIVITY_THRESHOLD_HOURS * 60 * 60 * 1000);
    const { count: activityCount } = await supabase
      .from("site_activity_log")
      .select("*", { count: "exact", head: true })
      .gte("created_at", threeHoursAgo.toISOString());

    const hasRecentActivity = (activityCount || 0) > 0;

    // 3. Check if we're in peak hours (01:00-06:00 UTC) - run more aggressively
    const isPeakHours = currentHour >= PEAK_HOURS_START && currentHour < PEAK_HOURS_END;

    // Decision logic
    let shouldRun = false;
    let runReason = "";

    if (forceRun) {
      shouldRun = true;
      runReason = "force_run";
    } else if (isPeakHours) {
      shouldRun = true;
      runReason = "peak_hours";
    } else if (hasRecentActivity) {
      shouldRun = true;
      runReason = "recent_activity";
    } else {
      runReason = "no_activity";
    }

    console.log(`[Scheduler] Decision: shouldRun=${shouldRun}, reason=${runReason}, activityCount=${activityCount}`);

    if (!shouldRun) {
      return new Response(
        JSON.stringify({
          success: true,
          action: "skipped",
          reason: runReason,
          activity_count: activityCount,
          current_hour: currentHour,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log agent run start
    const { data: runLog, error: logError } = await supabase
      .from("agent_run_log")
      .insert({
        agent_name: "ai-site-agent",
        status: "running",
      })
      .select()
      .single();

    if (logError) {
      console.error("[Scheduler] Failed to create run log:", logError);
    }

    // Call the AI Site Agent
    console.log("[Scheduler] Triggering AI Site Agent...");
    
    const agentResponse = await fetch(`${supabaseUrl}/functions/v1/ai-site-agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ task_type: body.task_type || "all" }),
    });

    const agentResult = await agentResponse.json();

    // Update run log with results
    if (runLog) {
      await supabase
        .from("agent_run_log")
        .update({
          status: agentResult.success ? "completed" : "failed",
          results: agentResult,
          completed_at: new Date().toISOString(),
          error_message: agentResult.error || null,
        })
        .eq("id", runLog.id);
    }

    console.log("[Scheduler] Agent completed:", agentResult.success);

    return new Response(
      JSON.stringify({
        success: true,
        action: "executed",
        reason: runReason,
        is_peak_hours: isPeakHours,
        activity_count: activityCount,
        current_hour: currentHour,
        agent_result: agentResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Scheduler] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
