import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Sumsub API configuration
const SUMSUB_BASE_URL = "https://api.sumsub.com";

interface TokenRequest {
  levelName: string;
  ttlInSecs?: number;
}

function createSignature(
  ts: number,
  httpMethod: string,
  path: string,
  body: string | null,
  secretKey: string
): string {
  const data = ts + httpMethod.toUpperCase() + path + (body || "");
  const hmac = createHmac("sha256", secretKey);
  hmac.update(data);
  return hmac.digest("hex");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Sumsub credentials
    const SUMSUB_APP_TOKEN = Deno.env.get("SUMSUB_APP_TOKEN");
    const SUMSUB_SECRET_KEY = Deno.env.get("SUMSUB_SECRET_KEY");

    if (!SUMSUB_APP_TOKEN) {
      throw new Error("SUMSUB_APP_TOKEN is not configured");
    }
    if (!SUMSUB_SECRET_KEY) {
      throw new Error("SUMSUB_SECRET_KEY is not configured");
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized: Invalid or expired token");
    }

    // Check rate limit (5 requests per hour for verification tokens)
    const { data: rateLimitOk } = await supabase.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_endpoint: "sumsub-token",
      p_max_requests: 5,
      p_window_minutes: 60,
    });

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: TokenRequest = await req.json();
    const levelName = body.levelName || "basic-kyc-level";
    const ttlInSecs = body.ttlInSecs || 1200; // 20 minutes default

    // Use user ID as external user ID for Sumsub
    const externalUserId = user.id;

    // Create access token via Sumsub API
    const ts = Math.floor(Date.now() / 1000);
    const path = `/resources/accessTokens?userId=${encodeURIComponent(externalUserId)}&levelName=${encodeURIComponent(levelName)}&ttlInSecs=${ttlInSecs}`;
    
    const signature = createSignature(ts, "POST", path, null, SUMSUB_SECRET_KEY);

    const response = await fetch(`${SUMSUB_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-App-Token": SUMSUB_APP_TOKEN,
        "X-App-Access-Sig": signature,
        "X-App-Access-Ts": ts.toString(),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sumsub API error:", response.status, errorText);
      throw new Error(`Sumsub API error [${response.status}]: ${errorText}`);
    }

    const tokenData = await response.json();

    // Log verification attempt
    console.log(`Sumsub token generated for user ${user.id}, level: ${levelName}`);

    return new Response(
      JSON.stringify({
        token: tokenData.token,
        userId: externalUserId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error generating Sumsub token:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const status = errorMessage.includes("Unauthorized") ? 401 : 
                   errorMessage.includes("Rate limit") ? 429 : 500;
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
