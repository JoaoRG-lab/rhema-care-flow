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
 const VisitSchema = z.object({
   visit_date: z.string().min(1).max(50),
   disease_activity: z.record(z.unknown()).optional().nullable(),
   actions: z.array(z.string().max(200)).max(50).optional().nullable(),
   labs_ordered: z.array(z.string().max(100)).max(50).optional().nullable(),
   imaging: z.array(z.string().max(100)).max(50).optional().nullable(),
   next_steps: z.string().max(5000).optional().nullable(),
 });
 
 const SummarizeVisitsRequestSchema = z.object({
   visits: z.array(VisitSchema).min(1, "At least one visit is required").max(100, "Maximum 100 visits allowed"),
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
     console.log("Summarize visits request from user:", userId);
 
     // Check rate limit
     const { data: rateLimitAllowed, error: rateLimitError } = await supabaseAdmin.rpc(
       "check_rate_limit",
       {
         p_user_id: userId,
         p_endpoint: "summarize-visits",
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
     const validationResult = SummarizeVisitsRequestSchema.safeParse(body);
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
 
     const { visits, patientCode, diagnosisTags } = validationResult.data;
 
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY is not configured");
     }
 
     const visitsSummary = visits.map((v) => {
       const parts = [`Date: ${v.visit_date}`];
       if (v.disease_activity && Object.keys(v.disease_activity).length > 0) {
         parts.push(`Disease Activity: ${JSON.stringify(v.disease_activity)}`);
       }
       if (v.actions?.length) parts.push(`Actions: ${v.actions.join(", ")}`);
       if (v.labs_ordered?.length) parts.push(`Labs: ${v.labs_ordered.join(", ")}`);
       if (v.imaging?.length) parts.push(`Imaging: ${v.imaging.join(", ")}`);
       if (v.next_steps) parts.push(`Next Steps: ${v.next_steps.replace(/<[^>]*>/g, " ").trim()}`);
       return parts.join("\n");
     }).join("\n\n---\n\n");
 
     const systemPrompt = `You are a clinical documentation assistant for rheumatology. You summarize patient visit histories to help physicians quickly understand a patient's care journey.
 
 GUIDELINES:
 - Create a concise chronological summary of the patient's visits
 - Highlight key clinical decisions, medication changes, and test results
 - Note any patterns in disease activity or treatment response
 - Identify pending items or follow-up needs
 - Use clear medical terminology appropriate for physicians
 - Format with markdown for readability
 - Be thorough but concise`;
 
     const userPrompt = `Summarize the following visit history for a rheumatology patient:
 
 Patient Code: ${patientCode}
 Diagnoses: ${diagnosisTags?.join(", ") || "Not specified"}
 
 Visit Records:
 ${visitsSummary || "No visits recorded"}
 
 Please provide:
 1. Brief patient overview
 2. Key clinical timeline highlights
 3. Current treatment status
 4. Outstanding items or pending follow-ups`;
 
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
       return new Response(JSON.stringify({ error: "AI summarization failed" }), {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     return new Response(response.body, {
       headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
     });
   } catch (error) {
     console.error("summarize-visits error:", error);
     return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });