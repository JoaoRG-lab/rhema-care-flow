 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 // Rate limit: 30 requests per hour per user
 const RATE_LIMIT_MAX_REQUESTS = 30;
 const RATE_LIMIT_WINDOW_MINUTES = 60;
 
 // Zod schemas for input validation
 const MessageSchema = z.object({
   role: z.enum(["system", "user", "assistant"]),
   content: z.string().min(1).max(32000),
 });
 
 const OpenAIChatRequestSchema = z.object({
   messages: z.array(MessageSchema).min(1).max(100),
   model: z.enum([
     "gpt-4o",
     "gpt-4o-mini",
     "gpt-4-turbo",
     "gpt-4",
     "gpt-3.5-turbo",
   ]).optional().default("gpt-4o-mini"),
   temperature: z.number().min(0).max(2).optional(),
   max_tokens: z.number().min(1).max(4096).optional(),
   stream: z.boolean().optional().default(true),
 });
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     // Validate JWT authentication
     const authHeader = req.headers.get("Authorization");
     if (!authHeader?.startsWith("Bearer ")) {
       return new Response(JSON.stringify({ error: "Unauthorized" }), {
         status: 401,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     // Create service role client for rate limiting (bypasses RLS)
     const supabaseAdmin = createClient(
       Deno.env.get("SUPABASE_URL") ?? "",
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
     );
 
     // Create user client for authenticated operations
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
     console.log("OpenAI chat request from user:", userId);
 
     // Check rate limit
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
       console.log("Rate limit exceeded for user:", userId);
       return new Response(
         JSON.stringify({
           error: "Rate limit exceeded. Maximum 30 requests per hour. Please try again later.",
         }),
         {
           status: 429,
           headers: {
             ...corsHeaders,
             "Content-Type": "application/json",
             "Retry-After": "3600",
           },
         }
       );
     }
 
     // Parse and validate request body
     let body: unknown;
     try {
       body = await req.json();
     } catch {
       return new Response(
         JSON.stringify({ error: "Invalid JSON body" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Validate with Zod
     const validationResult = OpenAIChatRequestSchema.safeParse(body);
     if (!validationResult.success) {
       console.warn("Validation error:", validationResult.error.errors);
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
 
     const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
     if (!OPENAI_API_KEY) {
       throw new Error("OPENAI_API_KEY is not configured");
     }
 
     // Call OpenAI API
     const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${OPENAI_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model,
         messages,
         temperature,
         max_tokens,
         stream,
       }),
     });
 
     if (!openaiResponse.ok) {
       const errorText = await openaiResponse.text();
       console.error("OpenAI API error:", openaiResponse.status, errorText);
       
       if (openaiResponse.status === 429) {
         return new Response(
           JSON.stringify({ error: "OpenAI rate limit exceeded. Please try again later." }),
           { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
       if (openaiResponse.status === 401) {
         return new Response(
           JSON.stringify({ error: "OpenAI API key invalid or expired." }),
           { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
       
       return new Response(
         JSON.stringify({ error: "OpenAI request failed" }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Return streaming or non-streaming response
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
     console.error("openai-chat error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });