import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { errorResponse } from "../_shared/errors.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Evidence grading based on Oxford Centre for Evidence-Based Medicine (OCEBM)
const EVIDENCE_LEVELS = {
  '1a': 'Systematic reviews of RCTs with homogeneity',
  '1b': 'Individual RCT with narrow confidence interval',
  '1c': 'All or none case-series',
  '2a': 'Systematic reviews of cohort studies with homogeneity',
  '2b': 'Individual cohort study or low quality RCT',
  '2c': 'Outcomes research; ecological studies',
  '3a': 'Systematic review of case-control studies with homogeneity',
  '3b': 'Individual case-control study',
  '4': 'Case-series, poor quality cohort/case-control',
  '5': 'Expert opinion without critical appraisal',
};

// GRADE system for recommendation strength
const GRADE_LEVELS = {
  'A': 'Strong recommendation, high-quality evidence',
  'B': 'Moderate recommendation, moderate-quality evidence',
  'C': 'Weak recommendation, low-quality evidence',
  'D': 'Very weak recommendation, very low-quality evidence',
  'I': 'Insufficient evidence to make recommendation',
};

// Peer review criteria simulation
const PEER_REVIEW_CRITERIA = [
  { name: 'methodology', weight: 0.25, description: 'Study design and methodology rigor' },
  { name: 'sample_size', weight: 0.15, description: 'Adequate sample size and power' },
  { name: 'bias_control', weight: 0.20, description: 'Control of confounders and bias' },
  { name: 'statistical_validity', weight: 0.15, description: 'Appropriate statistical analysis' },
  { name: 'clinical_relevance', weight: 0.15, description: 'Clinical applicability and relevance' },
  { name: 'reproducibility', weight: 0.10, description: 'Reproducibility of findings' },
];

// Thresholds for auto-approval
const AUTO_APPROVE_THRESHOLD = 85; // Confidence score threshold
const HUMAN_REVIEW_THRESHOLD = 70; // Below this always needs human review

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, pipeline_id, admin_email } = await req.json();

    if (action === 'judge') {
      // Fetch the pipeline item
      const { data: item, error: fetchError } = await supabase
        .from('ai_research_pipeline')
        .select('*')
        .eq('id', pipeline_id)
        .single();

      if (fetchError || !item) {
        throw new Error('Pipeline item not found');
      }

      // Analyze content using AI
      const analysisPrompt = `You are an expert medical peer reviewer specialized in rheumatology. 
Analyze this article using evidence-based medicine criteria.

TITLE: ${item.generated_title || item.topic}
SUMMARY: ${item.generated_summary || 'N/A'}
CONTENT: ${item.generated_content || 'N/A'}

Evaluate against these criteria (score 0-100 each):
1. METHODOLOGY: Study design rigor, appropriate methods
2. EVIDENCE_QUALITY: Source quality, citations, data validity  
3. BIAS_CONTROL: Confounders addressed, objectivity
4. STATISTICAL_VALIDITY: Appropriate analysis, significant findings
5. CLINICAL_RELEVANCE: Practical applicability for rheumatologists
6. REPRODUCIBILITY: Can findings be replicated

Also determine:
- EVIDENCE_LEVEL: ${Object.entries(EVIDENCE_LEVELS).map(([k, v]) => `${k}: ${v}`).join('; ')}
- GRADE: ${Object.entries(GRADE_LEVELS).map(([k, v]) => `${k}: ${v}`).join('; ')}
- REQUIRES_HUMAN_REVIEW: true if article discusses experimental treatments, contradicts guidelines, or has uncertainty

Respond in JSON format:
{
  "scores": { "methodology": N, "evidence_quality": N, "bias_control": N, "statistical_validity": N, "clinical_relevance": N, "reproducibility": N },
  "overall_score": N,
  "evidence_level": "1a-5",
  "grade": "A-I",
  "requires_human_review": boolean,
  "decision": "auto_approve" | "human_review",
  "reasoning": "detailed explanation",
  "concerns": ["list of any concerns"],
  "strengths": ["list of strengths"]
}`;

      const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [{ role: 'user', content: analysisPrompt }],
          temperature: 0.3,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('AI analysis failed');
      }

      const aiData = await aiResponse.json();
      const analysisText = aiData.choices[0]?.message?.content || '';
      
      // Parse JSON from response
      let analysis;
      try {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch {
        analysis = {
          overall_score: 50,
          evidence_level: '5',
          grade: 'I',
          requires_human_review: true,
          decision: 'human_review',
          reasoning: 'Unable to parse AI analysis, defaulting to human review',
        };
      }

      // Determine final decision
      const confidenceScore = analysis.overall_score || 0;
      const requiresHumanReview = analysis.requires_human_review || 
        confidenceScore < HUMAN_REVIEW_THRESHOLD ||
        ['D', 'I'].includes(analysis.grade) ||
        ['4', '5'].includes(analysis.evidence_level);

      const autoApprove = !requiresHumanReview && confidenceScore >= AUTO_APPROVE_THRESHOLD;

      const decision = autoApprove ? 'auto_approve' : 'human_review';

      // Update pipeline item
      const updateData: any = {
        evidence_level: analysis.evidence_level || 'pending',
        evidence_grade: analysis.grade || 'pending',
        requires_human_review: requiresHumanReview,
        auto_approved: autoApprove,
        judge_decision: decision,
        judge_confidence: confidenceScore,
        judge_reasoning: analysis.reasoning,
        status: autoApprove ? 'approved' : 'pending_review',
        ai_verification_score: confidenceScore,
      };

      if (requiresHumanReview && admin_email) {
        updateData.academic_reviewer_email = admin_email;
        updateData.academic_review_requested_at = new Date().toISOString();
      }

      await supabase
        .from('ai_research_pipeline')
        .update(updateData)
        .eq('id', pipeline_id);

      // Log the review
      await supabase.from('ai_review_logs').insert({
        pipeline_id,
        reviewer_type: 'judge',
        action: 'evaluate',
        evidence_level: analysis.evidence_level,
        evidence_grade: analysis.grade,
        confidence_score: confidenceScore,
        reasoning: analysis.reasoning,
        decision,
        metadata: {
          scores: analysis.scores,
          concerns: analysis.concerns,
          strengths: analysis.strengths,
        },
      });

      // If auto-approved, also publish to education_content
      if (autoApprove && item.generated_title && item.generated_content) {
        const slug = item.generated_title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .slice(0, 100);

        await supabase.from('education_content').insert({
          author_id: item.user_id,
          title: item.generated_title,
          summary: item.generated_summary,
          content: item.generated_content,
          slug: `${slug}-${Date.now()}`,
          category: 'Clinical Knowledge',
          content_type: 'article',
          is_published: true,
          published_at: new Date().toISOString(),
          diagnosis_tags: item.generated_tags || [],
        });

        await supabase
          .from('ai_research_pipeline')
          .update({ status: 'published' })
          .eq('id', pipeline_id);
      }

      return new Response(JSON.stringify({
        success: true,
        decision,
        evidence_level: analysis.evidence_level,
        grade: analysis.grade,
        confidence: confidenceScore,
        requires_human_review: requiresHumanReview,
        auto_approved: autoApprove,
        reasoning: analysis.reasoning,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'batch_judge') {
      // Process multiple items pending judgment
      const { data: items } = await supabase
        .from('ai_research_pipeline')
        .select('id')
        .eq('status', 'ai_reviewing')
        .is('judge_decision', null)
        .limit(10);

      const results = [];
      for (const item of items || []) {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/ai-judge`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ action: 'judge', pipeline_id: item.id, admin_email }),
          });
          const result = await response.json();
          results.push({ id: item.id, ...result });
        } catch (e) {
          results.push({ id: item.id, error: (e as Error).message });
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Judge error:', error);
    return errorResponse(error, { status: 500, code: "INTERNAL_ERROR", headers: corsHeaders });
  }
});
