import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { errorResponse } from "../_shared/errors.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMPROVEMENT_AREAS = [
  {
    id: "trending_topics",
    name: "Trending Topics Discovery",
    prompt: `You are a medical research analyst. Identify the top 5 most important trending topics in rheumatology and autoimmune disease research from the last month that would be valuable for healthcare professionals.

For each topic, provide:
1. Topic name
2. Why it's trending (new study, guideline update, drug approval, etc.)
3. Priority score (1-10)
4. Suggested article angle

Return as JSON array with fields: topic, reason, priority, angle`,
  },
  {
    id: "content_gaps",
    name: "Content Gap Analysis",
    prompt: `You are a medical education specialist. Based on current rheumatology practice, identify 5 important clinical topics that are commonly searched but often lack clear, evidence-based guidance.

For each gap, provide:
1. Topic name
2. Why it's important
3. Target audience (specialists, residents, patients)
4. Suggested format (article, calculator, guideline summary)

Return as JSON array with fields: topic, importance, audience, format`,
  },
  {
    id: "quality_check",
    name: "Quality Standards Check",
    prompt: `You are a medical content quality auditor. Suggest 5 quality improvement initiatives for a medical education platform that would enhance:
1. Clinical accuracy
2. User engagement
3. Evidence currency
4. Accessibility

For each initiative, provide the improvement, implementation difficulty (easy/medium/hard), and expected impact (high/medium/low).

Return as JSON array with fields: initiative, difficulty, impact, category`,
  },
];

interface AgentTask {
  id: string;
  task_type: string;
  status: string;
  result: any;
  created_at: string;
}

async function callAI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: "You are an AI agent that helps improve a healthcare education platform. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("AI API error:", error);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "{}";
}

function parseAIResponse(content: string): any[] {
  try {
    // Try to extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    return [];
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { task_type = "all" } = await req.json().catch(() => ({}));

    const results: { [key: string]: any } = {};
    const tasksToRun = task_type === "all" 
      ? IMPROVEMENT_AREAS 
      : IMPROVEMENT_AREAS.filter(a => a.id === task_type);

    console.log(`AI Site Agent running ${tasksToRun.length} improvement tasks...`);

    for (const area of tasksToRun) {
      console.log(`Running: ${area.name}`);
      
      try {
        const aiResponse = await callAI(area.prompt, lovableKey);
        const parsed = parseAIResponse(aiResponse);
        
        results[area.id] = {
          name: area.name,
          suggestions: parsed,
          timestamp: new Date().toISOString(),
        };

        // If we found trending topics, add them to the research queue
        if (area.id === "trending_topics" && parsed.length > 0) {
          for (const topic of parsed.slice(0, 3)) { // Top 3 only
            // Check if topic already exists
            const { data: existing } = await supabase
              .from("research_topic_queue")
              .select("id")
              .eq("topic", topic.topic)
              .single();

            if (!existing && topic.topic) {
              await supabase.from("research_topic_queue").insert({
                topic: topic.topic,
                category: "AI Agent Discovery",
                priority: Math.min(10, topic.priority || 5),
                disease_area: "Rheumatology",
                source: "ai_agent",
                status: "queued",
              });
              console.log(`Added to queue: ${topic.topic}`);
            }
          }
        }
      } catch (err) {
        console.error(`Error in ${area.name}:`, err);
        results[area.id] = {
          name: area.name,
          error: err instanceof Error ? err.message : "Unknown error",
          timestamp: new Date().toISOString(),
        };
      }
    }

    // Log agent activity (non-critical)
    try {
      await supabase.from("audit_logs").insert({
        user_id: "00000000-0000-0000-0000-000000000000",
        action: "ai_agent_run",
        resource_type: "site_improvement",
        resource_id: null,
        metadata: {
          tasks_run: tasksToRun.map(t => t.id),
          results_summary: Object.keys(results).map(k => ({
            task: k,
            suggestions_count: results[k].suggestions?.length || 0,
            has_error: !!results[k].error,
          })),
        },
      });
    } catch (_) { /* non-critical logging */ }

    return new Response(
      JSON.stringify({
        success: true,
        agent: "UHS Site Improvement Agent",
        run_at: new Date().toISOString(),
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("AI Site Agent error:", error);
    return errorResponse(error, { status: 500, code: "INTERNAL_ERROR", headers: corsHeaders });
  }
};

serve(handler);
