import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { errorResponse } from "../_shared/errors.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResearchRequest {
  action: "research" | "generate" | "verify" | "suggest_topics" | "batch_process";
  topic?: string;
  pipelineId?: string;
  content?: string;
  diseaseArea?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") || "";
    
    // Check if called with service role key (scheduler/cron) or user token
    let userId: string;
    const isServiceRole = token === supabaseServiceKey;
    
    if (isServiceRole) {
      // Called by scheduler - use system user ID
      userId = "00000000-0000-0000-0000-000000000000";
      console.log("[Research Engine] Called by scheduler (service role)");
    } else if (authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = user.id;
    } else {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, topic, pipelineId, content, diseaseArea }: ResearchRequest = await req.json();

    let result;

    switch (action) {
      case "research":
        result = await performResearch(topic!, diseaseArea, LOVABLE_API_KEY);
        break;
      case "generate":
        result = await generateArticle(topic!, diseaseArea, LOVABLE_API_KEY);
        break;
      case "verify":
        result = await verifyContent(content!, LOVABLE_API_KEY);
        break;
      case "suggest_topics":
        result = await suggestRelatedTopics(topic!, diseaseArea, LOVABLE_API_KEY);
        break;
      case "batch_process":
        result = await batchProcessQueue(supabase, userId, LOVABLE_API_KEY);
        break;
      default:
        throw new Error("Invalid action");
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Research Engine error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function callAI(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 402) {
      throw new Error("Payment required. Please add credits.");
    }
    const text = await response.text();
    throw new Error(`AI request failed: ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function performResearch(topic: string, diseaseArea: string | undefined, apiKey: string) {
  const systemPrompt = `You are a medical research specialist focusing on rheumatology. Your task is to compile comprehensive research on medical topics.

CRITICAL RULES:
- Only cite real, verifiable medical sources (PubMed, ACR, EULAR, UpToDate, etc.)
- Include publication years and authors when possible
- Focus on evidence-based medicine
- Distinguish between guidelines, studies, and expert opinions
- Note the level of evidence for each finding

Output format as JSON:
{
  "key_findings": ["finding1", "finding2", ...],
  "sources": [{"title": "...", "type": "guideline|study|review", "year": "...", "organization": "..."}],
  "evidence_levels": {"high": [], "moderate": [], "low": []},
  "related_topics": ["topic1", "topic2"],
  "clinical_pearls": ["pearl1", "pearl2"]
}`;

  const userPrompt = `Research the following rheumatology topic thoroughly: "${topic}"${diseaseArea ? ` (Disease area: ${diseaseArea})` : ""}

Provide comprehensive findings from current guidelines and literature.`;

  const result = await callAI(systemPrompt, userPrompt, apiKey);
  
  try {
    // Try to parse as JSON
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Return as structured text if not valid JSON
  }
  
  return { raw_research: result };
}

async function generateArticle(topic: string, diseaseArea: string | undefined, apiKey: string) {
  const systemPrompt = `You are a medical education content writer specializing in rheumatology. Create educational articles for healthcare professionals.

REQUIREMENTS:
1. Title: Clear, specific, searchable
2. Summary: 2-3 sentences capturing the essence
3. Content: Comprehensive markdown article with:
   - Introduction with clinical relevance
   - Evidence-based content with citations
   - Clinical pearls and practical tips
   - Tables/lists for easy reference
   - Key takeaways
4. Tags: Relevant diagnostic, treatment, and disease tags

FORMAT your response as JSON:
{
  "title": "Article Title",
  "summary": "Brief summary...",
  "content": "# Full Markdown Content...",
  "tags": ["tag1", "tag2"],
  "reading_time_minutes": 5,
  "references": ["ref1", "ref2"]
}`;

  const userPrompt = `Create a comprehensive educational article on: "${topic}"${diseaseArea ? ` (Disease area: ${diseaseArea})` : ""}

This should be suitable for rheumatologists and rheumatology trainees. Include current guidelines and evidence-based recommendations.`;

  const result = await callAI(systemPrompt, userPrompt, apiKey);
  
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Parse structured content manually
  }
  
  return { raw_content: result };
}

async function verifyContent(content: string, apiKey: string) {
  const systemPrompt = `You are a medical fact-checker and quality assurance specialist for rheumatology content.

Your task is to verify medical content for:
1. ACCURACY: Are the medical facts correct and up-to-date?
2. EVIDENCE: Are claims supported by cited evidence?
3. COMPLETENESS: Are there important omissions?
4. CLARITY: Is the content clear for the target audience?
5. SAFETY: Could any statements lead to patient harm?

Score each dimension 0-100 and provide an overall score.
Flag any critical errors that must be fixed before publication.

FORMAT as JSON:
{
  "overall_score": 85,
  "accuracy_score": 90,
  "evidence_score": 80,
  "completeness_score": 85,
  "clarity_score": 90,
  "safety_score": 95,
  "passed": true,
  "critical_issues": [],
  "suggestions": ["suggestion1", "suggestion2"],
  "verification_notes": "Summary of verification..."
}`;

  const userPrompt = `Verify the following rheumatology educational content:

${content}

Provide detailed verification results.`;

  const result = await callAI(systemPrompt, userPrompt, apiKey);
  
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Return default verification
  }
  
  return { 
    overall_score: 70, 
    passed: false, 
    verification_notes: result,
    needs_review: true 
  };
}

async function suggestRelatedTopics(topic: string, diseaseArea: string | undefined, apiKey: string) {
  const systemPrompt = `You are a rheumatology knowledge graph expert. Given a topic, suggest related topics that would expand the knowledge base systematically.

Consider:
1. Subtopics that drill deeper
2. Related conditions and differential diagnoses
3. Treatment comparisons
4. Monitoring and safety topics
5. Patient education angles
6. Emerging research areas

FORMAT as JSON:
{
  "subtopics": [{"topic": "...", "priority": 1-10, "category": "..."}],
  "related_conditions": [{"topic": "...", "priority": 1-10}],
  "treatment_topics": [{"topic": "...", "priority": 1-10}],
  "safety_topics": [{"topic": "...", "priority": 1-10}],
  "research_frontiers": [{"topic": "...", "priority": 1-10}]
}`;

  const userPrompt = `Based on the topic "${topic}"${diseaseArea ? ` in the area of ${diseaseArea}` : ""}, suggest related topics to expand our rheumatology knowledge library.`;

  const result = await callAI(systemPrompt, userPrompt, apiKey);
  
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Return structured suggestions
  }
  
  return { raw_suggestions: result };
}

async function batchProcessQueue(supabase: any, userId: string, apiKey: string) {
  // Get next topic from queue
  const { data: topics, error: fetchError } = await supabase
    .from("research_topic_queue")
    .select("*")
    .eq("status", "queued")
    .order("priority", { ascending: false })
    .limit(3);

  if (fetchError || !topics?.length) {
    return { processed: 0, message: "No topics in queue" };
  }

  const results = [];

  for (const topic of topics) {
    try {
      // Mark as processing
      await supabase
        .from("research_topic_queue")
        .update({ status: "processing", last_processed_at: new Date().toISOString() })
        .eq("id", topic.id);

      // Generate article
      const article = await generateArticle(topic.topic, topic.disease_area, apiKey);
      
      // Verify content
      const verification = await verifyContent(
        article.content || article.raw_content || "", 
        apiKey
      );

      // Create pipeline entry
      const { data: pipelineEntry, error: pipelineError } = await supabase
        .from("ai_research_pipeline")
        .insert({
          user_id: userId,
          topic: topic.topic,
          disease_area: topic.disease_area,
          generated_title: article.title,
          generated_summary: article.summary,
          generated_content: article.content || article.raw_content,
          generated_tags: article.tags || [],
          status: verification.passed ? "pending_review" : "ai_reviewing",
          ai_verification_score: verification.overall_score,
          ai_verification_notes: verification.verification_notes,
          ai_factcheck_passed: verification.passed,
          research_sources: article.references || [],
        })
        .select()
        .single();

      // Suggest related topics
      const suggestions = await suggestRelatedTopics(topic.topic, topic.disease_area, apiKey);
      
      // Add suggested topics to queue
      const newTopics = [
        ...(suggestions.subtopics || []),
        ...(suggestions.related_conditions || []),
        ...(suggestions.treatment_topics || []),
      ].slice(0, 5);

      for (const newTopic of newTopics) {
        await supabase.from("research_topic_queue").insert({
          topic: newTopic.topic,
          category: newTopic.category || "ai_suggested",
          disease_area: topic.disease_area,
          priority: newTopic.priority || 5,
          source: "ai_suggested",
          parent_topic_id: topic.id,
        });
      }

      // Mark topic as completed
      await supabase
        .from("research_topic_queue")
        .update({ 
          status: "completed", 
          articles_generated: 1 
        })
        .eq("id", topic.id);

      results.push({
        topic: topic.topic,
        status: "success",
        pipelineId: pipelineEntry?.id,
        verificationScore: verification.overall_score,
        newTopicsSuggested: newTopics.length,
      });
    } catch (error) {
      console.error(`Failed to process topic ${topic.topic}:`, error);
      
      await supabase
        .from("research_topic_queue")
        .update({ status: "failed" })
        .eq("id", topic.id);

      results.push({
        topic: topic.topic,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return { processed: results.length, results };
}
