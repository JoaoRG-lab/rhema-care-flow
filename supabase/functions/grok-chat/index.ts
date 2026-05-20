import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit para usuários normais (admins têm bypass)
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_WINDOW_MINUTES = 60;

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(32000),
});

const GrokChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100),
  model: z.enum([
    "grok-3",
    "grok-3-mini",
    "grok-2",
    "grok-2-vision",
  ]).optional().default("grok-3-mini"),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).max(8192).optional(),
  stream: z.boolean().optional().default(true),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const userRole = claimsData.claims.user_metadata?.role ?? claimsData.claims.role ?? "user";
    const isAdmin = userRole === "admin" || userRole === "super_admin";

    console.log(`[grok-chat] user=${userId} role=${userRole} isAdmin=${isAdmin}`);

    // Apenas aplica rate limit para não-admins
    if (!isAdmin) {
      const { data: rateLimitAllowed, error: rateLimitError } = await supabaseAdmin.rpc(
        "check_rate_limit",
        {
          p_user_id: userId,
          p_endpoint: "grok-chat",
          p_max_requests: RATE_LIMIT_MAX_REQUESTS,
          p_window_minutes: RATE_LIMIT_WINDOW_MINUTES,
        }
      );

      if (rateLimitError) {
        console.error("Rate limit check error:", rateLimitError);
      } else if (!rateLimitAllowed) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Maximum 20 requests per hour." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" },
          }
        );
      }
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validationResult = GrokChatRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request format",
          details: validationResult.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, model, temperature, max_tokens, stream } = validationResult.data;

    // Admins podem usar modelos mais poderosos
    const effectiveModel = isAdmin && model === "grok-3-mini" ? "grok-3" : model;

    const GROK_API_KEY = Deno.env.get("GROK_API_KEY") ?? Deno.env.get("XAI_API_KEY");
    if (!GROK_API_KEY) {
      throw new Error("GROK_API_KEY (ou XAI_API_KEY) não configurada no ambiente Supabase");
    }

    console.log(`[grok-chat] calling model=${effectiveModel} stream=${stream}`);

    const grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: effectiveModel,
        messages,
        temperature,
        max_tokens,
        stream,
      }),
    });

    if (!grokResponse.ok) {
      const errorText = await grokResponse.text();
      console.error("[grok-chat] xAI API error:", grokResponse.status, errorText);

      if (grokResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Grok rate limit exceeded. Try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (grokResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: "Grok API key inválida ou expirada." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Grok request failed", status: grokResponse.status }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (stream) {
      return new Response(grokResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      const data = await grokResponse.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("[grok-chat] unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
