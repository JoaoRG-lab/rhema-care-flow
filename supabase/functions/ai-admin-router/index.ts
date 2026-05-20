/**
 * ai-admin-router — Roteador central de IAs para admins
 *
 * Recebe { provider: "openai" | "grok", ...payload } e roteia
 * internamente para o conector correto, aplicando validações de admin.
 *
 * Variáveis de ambiente necessárias:
 *   OPENAI_API_KEY
 *   GROK_API_KEY  (ou XAI_API_KEY)
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPABASE_ANON_KEY
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(32000),
});

const AdminRouterRequestSchema = z.object({
  provider: z.enum(["openai", "grok"]),
  messages: z.array(MessageSchema).min(1).max(100),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).max(8192).optional(),
  stream: z.boolean().optional().default(false),
});

// Modelos padrão por provider para admins
const DEFAULT_ADMIN_MODELS: Record<string, string> = {
  openai: "gpt-4o",
  grok: "grok-3",
};

// Modelos permitidos por provider
const ALLOWED_MODELS: Record<string, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo", "o1", "o1-mini", "o3-mini"],
  grok: ["grok-3", "grok-3-mini", "grok-2", "grok-2-vision"],
};

async function callOpenAI(
  messages: z.infer<typeof MessageSchema>[],
  model: string,
  temperature?: number,
  max_tokens?: number,
  stream?: boolean
): Promise<Response> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurada");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens, stream }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[ai-admin-router] OpenAI error:", res.status, err);
    throw new Error(`OpenAI error ${res.status}: ${err.slice(0, 200)}`);
  }
  return res;
}

async function callGrok(
  messages: z.infer<typeof MessageSchema>[],
  model: string,
  temperature?: number,
  max_tokens?: number,
  stream?: boolean
): Promise<Response> {
  const GROK_API_KEY = Deno.env.get("GROK_API_KEY") ?? Deno.env.get("XAI_API_KEY");
  if (!GROK_API_KEY) throw new Error("GROK_API_KEY (ou XAI_API_KEY) não configurada");

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens, stream }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[ai-admin-router] Grok error:", res.status, err);
    throw new Error(`Grok error ${res.status}: ${err.slice(0, 200)}`);
  }
  return res;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // 2. Apenas admins podem usar este router
    if (!isAdmin) {
      console.warn(`[ai-admin-router] acesso negado para user=${userId} role=${userRole}`);
      return new Response(
        JSON.stringify({ error: "Forbidden: apenas administradores podem usar este endpoint." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[ai-admin-router] admin request from user=${userId}`);

    // 3. Valida payload
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = AdminRouterRequestSchema.safeParse(body);
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          details: result.error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { provider, messages, model, temperature, max_tokens, stream } = result.data;

    // 4. Resolve modelo
    const allowedForProvider = ALLOWED_MODELS[provider];
    const requestedModel = model ?? DEFAULT_ADMIN_MODELS[provider];
    const effectiveModel = allowedForProvider.includes(requestedModel)
      ? requestedModel
      : DEFAULT_ADMIN_MODELS[provider];

    console.log(`[ai-admin-router] routing to provider=${provider} model=${effectiveModel}`);

    // 5. Roteia para o provider
    let providerResponse: Response;
    if (provider === "openai") {
      providerResponse = await callOpenAI(messages, effectiveModel, temperature, max_tokens, stream);
    } else {
      providerResponse = await callGrok(messages, effectiveModel, temperature, max_tokens, stream);
    }

    // 6. Retorna resposta
    if (stream) {
      return new Response(providerResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await providerResponse.json();
    return new Response(
      JSON.stringify({ provider, model: effectiveModel, ...data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ai-admin-router] unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
