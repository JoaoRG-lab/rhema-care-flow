import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive seed topics for rheumatology knowledge base
const SEED_TOPICS = [
  // Rheumatoid Arthritis
  { topic: 'ACR/EULAR 2024 Rheumatoid Arthritis Classification Criteria', category: 'Guidelines', disease_area: 'Rheumatoid Arthritis', priority: 10 },
  { topic: 'Treat-to-Target Strategy in Rheumatoid Arthritis', category: 'Treatment Protocols', disease_area: 'Rheumatoid Arthritis', priority: 9 },
  { topic: 'Methotrexate Optimization in RA: Dosing and Monitoring', category: 'Pharmacology', disease_area: 'Rheumatoid Arthritis', priority: 9 },
  { topic: 'JAK Inhibitors Comparative Efficacy in Rheumatoid Arthritis', category: 'Pharmacology', disease_area: 'Rheumatoid Arthritis', priority: 9 },
  { topic: 'Biologic DMARDs Selection Algorithm for RA', category: 'Treatment Protocols', disease_area: 'Rheumatoid Arthritis', priority: 8 },
  { topic: 'RA Remission Criteria: DAS28 vs CDAI vs Boolean', category: 'Clinical Assessment', disease_area: 'Rheumatoid Arthritis', priority: 8 },
  
  // Systemic Lupus Erythematosus
  { topic: 'EULAR/ACR 2019 SLE Classification Criteria', category: 'Guidelines', disease_area: 'Systemic Lupus Erythematosus', priority: 10 },
  { topic: 'Lupus Nephritis: ISN/RPS Classification and Management', category: 'Guidelines', disease_area: 'Systemic Lupus Erythematosus', priority: 9 },
  { topic: 'Hydroxychloroquine in SLE: Beyond Immunomodulation', category: 'Pharmacology', disease_area: 'Systemic Lupus Erythematosus', priority: 8 },
  { topic: 'Belimumab and Anifrolumab: Targeted Therapies in SLE', category: 'Pharmacology', disease_area: 'Systemic Lupus Erythematosus', priority: 8 },
  { topic: 'SLEDAI-2K Score: Practical Application', category: 'Clinical Assessment', disease_area: 'Systemic Lupus Erythematosus', priority: 7 },
  
  // Spondyloarthritis
  { topic: 'ASAS Classification Criteria for Axial Spondyloarthritis', category: 'Guidelines', disease_area: 'Spondyloarthritis', priority: 10 },
  { topic: 'Non-Radiographic Axial SpA: Diagnosis and Management', category: 'Clinical Assessment', disease_area: 'Spondyloarthritis', priority: 8 },
  { topic: 'IL-17 Inhibitors in Ankylosing Spondylitis', category: 'Pharmacology', disease_area: 'Spondyloarthritis', priority: 8 },
  { topic: 'BASDAI and ASDAS: Disease Activity Monitoring', category: 'Clinical Assessment', disease_area: 'Spondyloarthritis', priority: 7 },
  
  // Psoriatic Arthritis
  { topic: 'CASPAR Criteria for Psoriatic Arthritis', category: 'Guidelines', disease_area: 'Psoriatic Arthritis', priority: 10 },
  { topic: 'Minimal Disease Activity in Psoriatic Arthritis', category: 'Clinical Assessment', disease_area: 'Psoriatic Arthritis', priority: 8 },
  { topic: 'Dual IL-23/IL-17 Pathway Inhibition in PsA', category: 'Pharmacology', disease_area: 'Psoriatic Arthritis', priority: 8 },
  
  // Vasculitis
  { topic: 'ANCA-Associated Vasculitis: 2024 Treatment Guidelines', category: 'Guidelines', disease_area: 'Vasculitis', priority: 9 },
  { topic: 'Giant Cell Arteritis: Fast-Track Pathway', category: 'Clinical Assessment', disease_area: 'Vasculitis', priority: 8 },
  { topic: 'Rituximab in ANCA Vasculitis: Induction and Maintenance', category: 'Pharmacology', disease_area: 'Vasculitis', priority: 8 },
  
  // Connective Tissue Diseases
  { topic: 'Myositis-Specific Antibodies: Clinical Correlations', category: 'Clinical Assessment', disease_area: 'Inflammatory Myopathies', priority: 8 },
  { topic: 'Systemic Sclerosis: Modified Rodnan Skin Score', category: 'Clinical Assessment', disease_area: 'Systemic Sclerosis', priority: 8 },
  { topic: 'Interstitial Lung Disease in CTD: Screening and Management', category: 'Treatment Protocols', disease_area: 'Connective Tissue Diseases', priority: 9 },
  
  // Osteoarthritis
  { topic: 'OARSI Guidelines for Knee Osteoarthritis Management', category: 'Guidelines', disease_area: 'Osteoarthritis', priority: 8 },
  { topic: 'Intra-articular Therapies: Hyaluronic Acid vs PRP', category: 'Treatment Protocols', disease_area: 'Osteoarthritis', priority: 7 },
  
  // Gout
  { topic: 'ACR Guidelines for Gout Management 2024', category: 'Guidelines', disease_area: 'Gout', priority: 9 },
  { topic: 'Treat-to-Target Urate in Gout: Evidence and Practice', category: 'Treatment Protocols', disease_area: 'Gout', priority: 8 },
  { topic: 'Pegloticase in Refractory Gout', category: 'Pharmacology', disease_area: 'Gout', priority: 7 },
  
  // Safety and Monitoring
  { topic: 'Cardiovascular Risk in Rheumatic Diseases', category: 'Safety', disease_area: 'General Rheumatology', priority: 9 },
  { topic: 'Infection Risk with Immunosuppressive Therapy', category: 'Safety', disease_area: 'General Rheumatology', priority: 9 },
  { topic: 'Pregnancy Planning in Rheumatic Diseases', category: 'Treatment Protocols', disease_area: 'General Rheumatology', priority: 8 },
  { topic: 'Vaccination Guidelines for Immunocompromised Patients', category: 'Guidelines', disease_area: 'General Rheumatology', priority: 8 },
  
  // Pediatric Rheumatology
  { topic: 'Juvenile Idiopathic Arthritis Classification', category: 'Guidelines', disease_area: 'Pediatric Rheumatology', priority: 8 },
  { topic: 'Macrophage Activation Syndrome: Recognition and Treatment', category: 'Clinical Assessment', disease_area: 'Pediatric Rheumatology', priority: 9 },
  
  // Emerging Topics
  { topic: 'Machine Learning in Rheumatology Diagnosis', category: 'Research', disease_area: 'General Rheumatology', priority: 6 },
  { topic: 'Biomarkers for Treatment Response Prediction', category: 'Research', disease_area: 'General Rheumatology', priority: 7 },
  { topic: 'Microbiome and Autoimmunity: Current Evidence', category: 'Research', disease_area: 'General Rheumatology', priority: 6 },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();

    if (action === 'seed_topics') {
      // Seed the topic queue with comprehensive topics
      const { data: existingTopics } = await supabase
        .from('research_topic_queue')
        .select('topic');
      
      const existingTopicNames = new Set(existingTopics?.map(t => t.topic) || []);
      const newTopics = SEED_TOPICS.filter(t => !existingTopicNames.has(t.topic));

      if (newTopics.length > 0) {
        const { error } = await supabase
          .from('research_topic_queue')
          .insert(newTopics.map(t => ({
            ...t,
            status: 'queued',
            source: 'system_seed'
          })));

        if (error) throw error;
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Seeded ${newTopics.length} new topics`,
        total_topics: SEED_TOPICS.length,
        new_topics: newTopics.length
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'ignite') {
      // Full ignition: seed + trigger batch processing
      console.log('🔥 IGNITION SEQUENCE STARTED');

      // Step 1: Seed topics
      const { data: existingTopics } = await supabase
        .from('research_topic_queue')
        .select('topic');
      
      const existingTopicNames = new Set(existingTopics?.map(t => t.topic) || []);
      const newTopics = SEED_TOPICS.filter(t => !existingTopicNames.has(t.topic));

      if (newTopics.length > 0) {
        await supabase.from('research_topic_queue').insert(
          newTopics.map(t => ({ ...t, status: 'queued', source: 'system_seed' }))
        );
      }

      // Step 2: Get queued topics (prioritized)
      const { data: queuedTopics } = await supabase
        .from('research_topic_queue')
        .select('*')
        .eq('status', 'queued')
        .order('priority', { ascending: false })
        .limit(5); // Process 5 at a time

      if (!queuedTopics || queuedTopics.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: 'No queued topics to process',
          seeded: newTopics.length
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Step 3: Process each topic through the research engine
      const results = [];
      const geminiKey = Deno.env.get('GEMINI_API_KEY');

      for (const topic of queuedTopics) {
        try {
          // Mark as processing
          await supabase
            .from('research_topic_queue')
            .update({ status: 'processing', last_processed_at: new Date().toISOString() })
            .eq('id', topic.id);

          // Generate article content
          const articlePrompt = `You are a medical content expert specializing in rheumatology. Generate a comprehensive, evidence-based article on: "${topic.topic}"

Category: ${topic.category}
Disease Area: ${topic.disease_area}

Requirements:
1. Write in academic medical style suitable for rheumatologists
2. Include relevant clinical pearls and practical applications
3. Reference current guidelines (ACR, EULAR, APLAR)
4. Structure with clear sections: Overview, Key Points, Clinical Application, Evidence Summary
5. Be factually accurate and current with 2024 medical knowledge

Respond in JSON format:
{
  "title": "Article title",
  "summary": "2-3 sentence summary",
  "content": "Full markdown article content (2000+ words)",
  "tags": ["tag1", "tag2", "tag3"],
  "evidence_level": "1a|1b|2a|2b|3a|3b|4|5",
  "evidence_grade": "A|B|C|D|I"
}`;

          const genResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: articlePrompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 8000 }
              })
            }
          );

          const genData = await genResponse.json();
          const genText = genData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          // Parse the generated content
          let article;
          try {
            const jsonMatch = genText.match(/\{[\s\S]*\}/);
            article = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
          } catch {
            article = null;
          }

          if (!article) {
            results.push({ topic: topic.topic, status: 'generation_failed' });
            continue;
          }

          // Create pipeline entry
          const { data: pipelineEntry, error: pipelineError } = await supabase
            .from('ai_research_pipeline')
            .insert({
              user_id: '00000000-0000-0000-0000-000000000000', // System user
              topic: topic.topic,
              disease_area: topic.disease_area,
              generated_title: article.title,
              generated_summary: article.summary,
              generated_content: article.content,
              generated_tags: article.tags || [],
              evidence_level: article.evidence_level || 'pending',
              evidence_grade: article.evidence_grade || 'pending',
              status: 'ai_reviewing',
              priority: topic.priority
            })
            .select()
            .single();

          if (pipelineError) {
            console.error('Pipeline insert error:', pipelineError);
            results.push({ topic: topic.topic, status: 'pipeline_error' });
            continue;
          }

          // Run AI Judge evaluation
          const judgePrompt = `You are a medical peer-review expert. Evaluate this rheumatology article for publication.

ARTICLE:
Title: ${article.title}
Content: ${article.content?.substring(0, 3000)}...

Evaluate using Oxford OCEBM evidence levels and GRADE system. Consider:
1. Scientific accuracy and current evidence
2. Clinical relevance and applicability
3. Methodology rigor (if applicable)
4. Potential for patient harm if information is wrong
5. Alignment with major society guidelines (ACR, EULAR)

Respond in JSON:
{
  "decision": "auto_approve" | "needs_human_review" | "reject",
  "confidence": 0-100,
  "evidence_level": "1a|1b|2a|2b|3a|3b|4|5",
  "grade": "A|B|C|D|I",
  "reasoning": "Brief explanation",
  "requires_human_review": true/false,
  "safety_concerns": []
}`;

          const judgeResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: judgePrompt }] }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
              })
            }
          );

          const judgeData = await judgeResponse.json();
          const judgeText = judgeData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          let judgment;
          try {
            const jsonMatch = judgeText.match(/\{[\s\S]*\}/);
            judgment = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
          } catch {
            judgment = { decision: 'needs_human_review', confidence: 50 };
          }

          // Update pipeline with judgment
          const autoApprove = judgment.decision === 'auto_approve' && judgment.confidence >= 85;
          const newStatus = autoApprove ? 'approved' : 'pending_review';

          await supabase
            .from('ai_research_pipeline')
            .update({
              status: newStatus,
              ai_verification_score: judgment.confidence,
              ai_factcheck_passed: judgment.decision !== 'reject',
              judge_decision: judgment.decision,
              judge_confidence: judgment.confidence,
              judge_reasoning: judgment.reasoning,
              evidence_level: judgment.evidence_level || article.evidence_level,
              evidence_grade: judgment.grade || article.evidence_grade,
              requires_human_review: judgment.requires_human_review !== false,
              auto_approved: autoApprove
            })
            .eq('id', pipelineEntry.id);

          // Log the review
          await supabase.from('ai_review_logs').insert({
            pipeline_id: pipelineEntry.id,
            reviewer_type: 'ai_judge',
            action: 'initial_review',
            decision: judgment.decision,
            confidence_score: judgment.confidence,
            evidence_level: judgment.evidence_level,
            evidence_grade: judgment.grade,
            reasoning: judgment.reasoning
          });

          // If auto-approved, publish to education_content
          if (autoApprove) {
            const slug = article.title
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .slice(0, 100);

            await supabase.from('education_content').insert({
              author_id: '00000000-0000-0000-0000-000000000000',
              title: article.title,
              summary: article.summary,
              content: article.content,
              slug: `${slug}-${Date.now()}`,
              category: topic.category,
              content_type: 'article',
              is_published: true,
              published_at: new Date().toISOString(),
              diagnosis_tags: article.tags || []
            });

            await supabase
              .from('ai_research_pipeline')
              .update({ status: 'published' })
              .eq('id', pipelineEntry.id);
          }

          // Update queue status
          await supabase
            .from('research_topic_queue')
            .update({
              status: 'completed',
              articles_generated: 1
            })
            .eq('id', topic.id);

          results.push({
            topic: topic.topic,
            status: autoApprove ? 'auto_published' : 'pending_review',
            confidence: judgment.confidence,
            evidence_grade: judgment.grade
          });

        } catch (err) {
          console.error('Error processing topic:', topic.topic, err);
          results.push({ topic: topic.topic, status: 'error', error: String(err) });
        }
      }

      // Get updated stats
      const { count: totalPublished } = await supabase
        .from('education_content')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      const { count: pendingReview } = await supabase
        .from('ai_research_pipeline')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review');

      const { count: queuedCount } = await supabase
        .from('research_topic_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'queued');

      return new Response(JSON.stringify({
        success: true,
        message: '🔥 Ignition complete!',
        seeded_topics: newTopics.length,
        processed: results.length,
        results,
        stats: {
          total_published: totalPublished,
          pending_review: pendingReview,
          topics_remaining: queuedCount
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      error: 'Invalid action. Use "seed_topics" or "ignite"'
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Ignition error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
