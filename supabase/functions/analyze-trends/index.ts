 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { scores, patientCode, diagnosisTags } = await req.json();
     
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY is not configured");
     }
 
     // Build context about the patient's scores
     const scoresSummary = scores.map((s: any) => 
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
     return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });