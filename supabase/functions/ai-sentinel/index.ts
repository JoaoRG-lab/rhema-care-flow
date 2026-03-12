import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Sentinel monitoring criteria
const MONITORING_CRITERIA = {
  factual_accuracy: 'Check for outdated information or contradictions with current guidelines',
  internal_consistency: 'Verify claims are consistent throughout the article',
  source_validity: 'Ensure referenced studies/guidelines are valid and current',
  safety_claims: 'Flag any potentially dangerous medical advice',
  bias_detection: 'Identify unsubstantiated claims or promotional content',
  guideline_alignment: 'Compare with ACR, EULAR, and other society guidelines',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, content_id, pipeline_id } = await req.json();

    if (action === 'monitor') {
      // Fetch published content to monitor
      let content: any;
      let pipelineItem: any;

      if (content_id) {
        const { data } = await supabase
          .from('education_content')
          .select('*')
          .eq('id', content_id)
          .single();
        content = data;
      } else if (pipeline_id) {
        const { data } = await supabase
          .from('ai_research_pipeline')
          .select('*')
          .eq('id', pipeline_id)
          .single();
        pipelineItem = data;
        content = {
          title: data?.generated_title,
          content: data?.generated_content,
          summary: data?.generated_summary,
        };
      }

      if (!content) {
        throw new Error('Content not found');
      }

      // Sentinel AI analysis
      const monitorPrompt = `You are the SENTINEL - a vigilant AI monitor for medical content quality.
Your role is to continuously review published rheumatology content for inconsistencies, errors, or outdated information.

CONTENT TO REVIEW:
TITLE: ${content.title}
CONTENT: ${content.content || content.summary}

MONITORING CRITERIA:
${Object.entries(MONITORING_CRITERIA).map(([k, v]) => `- ${k.toUpperCase()}: ${v}`).join('\n')}

Perform a thorough review and identify ANY issues. Be strict but fair.

For each issue found, determine:
- SEVERITY: low | medium | high | critical
  - critical: Patient safety risk, dangerous misinformation
  - high: Significant factual error, contradicts major guidelines
  - medium: Outdated info, minor inconsistencies
  - low: Style issues, minor clarifications needed

Respond in JSON:
{
  "status": "clean" | "flagged",
  "overall_quality": 0-100,
  "issues": [
    {
      "type": "factual_accuracy|internal_consistency|source_validity|safety_claims|bias_detection|guideline_alignment",
      "severity": "low|medium|high|critical",
      "description": "specific issue description",
      "location": "where in content",
      "suggested_fix": "how to resolve",
      "reclassification_needed": boolean
    }
  ],
  "strengths": ["what's good about this content"],
  "recommendation": "keep_published|flag_for_review|immediate_unpublish",
  "reasoning": "explanation"
}`;

      const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [{ role: 'user', content: monitorPrompt }],
          temperature: 0.2, // Low temperature for consistent monitoring
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('Sentinel analysis failed');
      }

      const aiData = await aiResponse.json();
      const analysisText = aiData.choices[0]?.message?.content || '';

      // Parse result
      let analysis;
      try {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { status: 'clean', issues: [] };
      } catch {
        analysis = { status: 'clean', issues: [], recommendation: 'keep_published' };
      }

      // Process issues and create alerts
      const hasIssues = analysis.issues && analysis.issues.length > 0;
      const hasCriticalIssue = analysis.issues?.some((i: any) => 
        i.severity === 'critical' || i.severity === 'high'
      );

      // Update pipeline item if exists
      if (pipeline_id || pipelineItem) {
        const updatePipelineId = pipeline_id || pipelineItem?.id;
        await supabase
          .from('ai_research_pipeline')
          .update({
            sentinel_flagged: hasCriticalIssue,
            sentinel_last_check: new Date().toISOString(),
            sentinel_flags: analysis.issues || [],
          })
          .eq('id', updatePipelineId);
      }

      // Create alerts for significant issues
      for (const issue of (analysis.issues || [])) {
        if (['medium', 'high', 'critical'].includes(issue.severity)) {
          await supabase.from('sentinel_alerts').insert({
            pipeline_id: pipeline_id || pipelineItem?.id || null,
            content_id: content_id || null,
            alert_type: issue.type,
            severity: issue.severity,
            description: issue.description,
            suggested_action: issue.suggested_fix,
          });
        }
      }

      // Log sentinel review
      await supabase.from('ai_review_logs').insert({
        pipeline_id: pipeline_id || pipelineItem?.id || null,
        reviewer_type: 'sentinel',
        action: 'monitor',
        confidence_score: analysis.overall_quality,
        reasoning: analysis.reasoning,
        decision: analysis.recommendation,
        metadata: {
          issues: analysis.issues,
          strengths: analysis.strengths,
        },
      });

      // If critical, trigger reclassification
      if (analysis.recommendation === 'immediate_unpublish' && content_id) {
        await supabase
          .from('education_content')
          .update({ is_published: false })
          .eq('id', content_id);
      }

      return new Response(JSON.stringify({
        success: true,
        status: analysis.status,
        quality_score: analysis.overall_quality,
        issues_found: analysis.issues?.length || 0,
        recommendation: analysis.recommendation,
        flagged: hasCriticalIssue,
        details: analysis,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'patrol') {
      // Routine patrol - check all published content that hasn't been checked recently
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get content not checked in last week
      const { data: staleContent } = await supabase
        .from('ai_research_pipeline')
        .select('id')
        .eq('status', 'published')
        .or(`sentinel_last_check.is.null,sentinel_last_check.lt.${oneWeekAgo.toISOString()}`)
        .limit(5);

      const results = [];
      for (const item of staleContent || []) {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/ai-sentinel`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ action: 'monitor', pipeline_id: item.id }),
          });
          const result = await response.json();
          results.push({ id: item.id, ...result });
        } catch (e) {
          results.push({ id: item.id, error: (e as Error).message });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        patrolled: results.length,
        results,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'get_alerts') {
      // Get active alerts
      const { data: alerts } = await supabase
        .from('sentinel_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(50);

      return new Response(JSON.stringify({
        success: true,
        alerts: alerts || [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sentinel error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
