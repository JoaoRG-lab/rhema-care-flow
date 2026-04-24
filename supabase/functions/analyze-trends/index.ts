 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
 
 import { errorResponse } from "../_shared/errors.ts";
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 // Rate limit: 20 requests per hour per user
 const RATE_LIMIT_MAX_REQUESTS = 20;
 const RATE_LIMIT_WINDOW_MINUTES = 60;
 
 // Zod schemas for input validation
 const ScoreSchema = z.object({
   score_type: z.string().min(1).max(100),
   calculated_score: z.number().nullable(),
   created_at: z.string().min(1).max(50),
 });
 
 const AnalyzeTrendsRequestSchema = z.object({
   scores: z.array(ScoreSchema).min(1, "At least one score is required").max(1000, "Maximum 1000 scores allowed"),
   patientCode: z.string().min(1, "Patient code is required").max(100, "Patient code too long"),
   diagnosisTags: z.array(z.string().max(100)).max(50).optional(),
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
     console.log("Analyze trends request from user:", userId);
 
     // Check rate limit
     const { data: rateLimitAllowed, error: rateLimitError } = await supabaseAdmin.rpc(
       "check_rate_limit",
       {
         p_user_id: userId,
         p_endpoint: "analyze-trends",
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
           error: "Rate limit exceeded. Maximum 20 requests per hour. Please try again later.",
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
     const validationResult = AnalyzeTrendsRequestSchema.safeParse(body);
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
 
     const { scores, patientCode, diagnosisTags } = validationResult.data;
 
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY is not configured");
     }
 
     // Build context about the patient's scores
     const scoresSummary = scores.map((s) =>
       `${s.score_type}: ${s.calculated_score} on ${s.created_at}`
     ).join("\n");
 
     const systemPrompt = `You are a clinical decision support assistant for rheumatology. You analyze disease activity scores and trends to provide evidence-based insights for healthcare professionals.
 
 IMPORTANT GUIDELINES:
 - Provide clinical insights based on the score trends
 - Reference standard thresholds for each score type (e.g., DAS28-ESR remission <2.6, low activity 2.6-3.2, moderate 3.2-5.1, high >5.1)
 - Note any concerning trends (increasing scores, sudden changes)
 - Suggest potential next steps or monitoring considerations
 - Be concise but thorough
 - Always remind that this is decision support, not a replacement for clinical judgment
 - Format response with clear sections using markdown`;
 
     const userPrompt = `Analyze the following disease activity score trends for a patient:
 
 Patient Code: ${patientCode}
 Diagnoses: ${diagnosisTags?.join(", ") || "Not specified"}
 
 Score History:
 ${scoresSummary || "No scores recorded yet"}
 
 Please provide:
 1. A summary of the current disease activity status based on the most recent scores
 2. Analysis of trends over time (improving, stable, worsening)
 3. Key observations or concerns
 4. Suggested monitoring considerations`;
 
     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${LOVABLE_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-3-flash-preview",
         messages: [
           { role: "system", content: systemPrompt },
           { role: "user", content: userPrompt },
         ],
         stream: true,
       }),
     });
 
     if (!response.ok) {
       if (response.status === 429) {
         return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
           status: 429,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       if (response.status === 402) {
         return new Response(JSON.stringify({ error: "AI service quota exceeded. Please add credits." }), {
           status: 402,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       const errorText = await response.text();
       console.error("AI gateway error:", response.status, errorText);
       return new Response(JSON.stringify({ error: "AI analysis failed" }), {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     return new Response(response.body, {
       headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
     });
   } catch (error) {
     console.error("analyze-trends error:", error);
     return errorResponse(error, { status: 500, code: "INTERNAL_ERROR", headers: corsHeaders });
   }
 });