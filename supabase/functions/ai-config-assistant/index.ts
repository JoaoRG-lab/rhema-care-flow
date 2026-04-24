import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { errorResponse } from "../_shared/errors.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-idempotency-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are RheumaFlow's AI Configuration Assistant - an expert in helping healthcare providers optimize their rheumatology practice management platform.

Your capabilities include:
1. **App Configuration Guidance**: Help users set up patients, monitoring plans, infusion schedules, and education content
2. **Best Practices**: Suggest improvements for workflow efficiency, patient engagement, and clinical documentation
3. **Feature Discovery**: Explain available features and how to use them effectively
4. **Troubleshooting**: Help resolve common issues and guide users through solutions

Key features you can help configure:
- Patient Cards: patient tracking with diagnosis tags, therapy tags, and risk flags
- Monitoring Events: lab work, imaging, and follow-up scheduling
- Infusion Management: biologic infusion scheduling and pre-checklists
- Score Calculators: DAS28, CDAI, RAPID3, HAQ-DI, and more
- Education Content: patient education articles and resources
- Consultation Sessions: 1:1 patient education booking
- SMS Reminders: automated appointment reminders

Always be helpful, concise, and professional. When suggesting improvements, be specific and actionable.
Format responses with markdown for readability.`;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1) Require authenticated user
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Authentication required to use the AI assistant." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid session. Please sign in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = userData.user.id;

    // 2) Server-side credit/quota gate using service role (bypasses RLS, atomic)
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: row } = await admin
      .from("user_ai_credits")
      .select("credits_balance, free_quota_used, free_quota_limit")
      .eq("user_id", userId)
      .maybeSingle();

    let useFreeQuota = false;
    let useCredits = false;

    if (!row) {
      // First-time user — initialize and consume 1 free use
      await admin.from("user_ai_credits").insert({
        user_id: userId,
        free_quota_used: 1,
      });
      useFreeQuota = true;
    } else if (row.free_quota_used < row.free_quota_limit) {
      useFreeQuota = true;
    } else if (row.credits_balance > 0) {
      useCredits = true;
    } else {
      return new Response(
        JSON.stringify({
          error: "Free quota exhausted. Purchase credits via PIX to continue.",
          code: "PAYMENT_REQUIRED",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3) Call AI gateway
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      // AI call failed — do NOT consume the user's credit
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service unavailable. Please try again later." }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4) AI call succeeded — deduct now (only existing users; new users already incremented)
    if (row) {
      if (useFreeQuota) {
        await admin
          .from("user_ai_credits")
          .update({ free_quota_used: row.free_quota_used + 1 })
          .eq("user_id", userId);
      } else if (useCredits) {
        await admin
          .from("user_ai_credits")
          .update({ credits_balance: row.credits_balance - 1 })
          .eq("user_id", userId);
      }
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    return errorResponse(error, { status: 500, code: "INTERNAL_ERROR", headers: corsHeaders });
  }
});
