import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

const FUNCTION_VERSION = "rhema-care-v2.1";
const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MINUTES = 60;

const USER_MODELS = ["gpt-4o-mini", "gpt-3.5-turbo"] as const;
const ADMIN_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-4",
  "gpt-3.5-turbo",
  "o1",
  "o1-mini",
  "o3-mini",
] as const;

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(32000),
});

const OpenAIChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100),
  model: z.string().optional().default("gpt-4o"),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).max(8192).optional(),
  stream: z.boolean().optional().default(true),
});

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ ok: true, function: "openai-chat", version: FUNCTION_VERSION }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const userRole = user.user_metadata?.role ?? user.role ?? "user";
    const isAdmin = userRole === "admin" || userRole === "super_admin";

    console.log(`[openai-chat] user=${userId} role=${userRole} isAdmin=${isAdmin} version=${FUNCTION_VERSION}`);

    if (!isAdmin) {
      const { data: rateLimitAllowed, error: rateLimitError } = await supabaseAdmin.rpc(
        "check_rate_limit",
        {
          p_user_id: userId,
          p_endpoint: "openai-chat",
          p_max_requests: RATE_LIMIT_MAX_REQUESTS,
          p_window_minutes: RATE_LIMIT_WINDOW_MINUTES,
        }
      );
      if (rateLimitError) {
        console.error("Rate limit check error:", rateLimitError);
      } else if (!rateLimitAllowed) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }),
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

    const validationResult = OpenAIChatRequestSchema.safeParse(body);
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
    const allowedModels: readonly string[] = isAdmin ? ADMIN_MODELS : USER_MODELS;
    const effectiveModel = allowedModels.includes(model) ? model : (isAdmin ? "gpt-4o" : "gpt-4o-mini");

    if (model !== effectiveModel) {
      console.warn(`[openai-chat] model '${model}' not allowed for role '${userRole}', using '${effectiveModel}'`);
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY não configurada no ambiente Supabase");
    }

    console.log(`[openai-chat] calling model=${effectiveModel} stream=${stream}`);

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: effectiveModel, messages, temperature, max_tokens, stream }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("[openai-chat] OpenAI API error:", openaiResponse.status, errorText);
      if (openaiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "OpenAI rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "OpenAI request failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (stream) {
      return new Response(openaiResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    } else {
      const data = await openaiResponse.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("[openai-chat] unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
