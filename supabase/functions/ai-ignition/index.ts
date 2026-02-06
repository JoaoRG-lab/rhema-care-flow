import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// High-impact sources for medical literature search
const AUTHORITATIVE_SOURCES = [
  'eular.org',
  'rheumatology.org', // ACR
  'thelancet.com',
  'nature.com',
  'nejm.org',
  'reumatologia.org.br', // SBR
  'ard.bmj.com', // Annals of Rheumatic Diseases
  'arthritis-research.biomedcentral.com',
  'pubmed.ncbi.nlm.nih.gov',
];

// Comprehensive seed topics for rheumatology knowledge base
const SEED_TOPICS = [
  // Rheumatoid Arthritis - High Priority from Major Journals
  { topic: 'ACR/EULAR 2024 Rheumatoid Arthritis Classification Criteria', category: 'Guidelines', disease_area: 'Rheumatoid Arthritis', priority: 10, sources: ['ACR', 'EULAR'] },
  { topic: 'Treat-to-Target Strategy in Rheumatoid Arthritis', category: 'Treatment Protocols', disease_area: 'Rheumatoid Arthritis', priority: 9, sources: ['NEJM', 'Lancet Rheumatology'] },
  { topic: 'Methotrexate Optimization in RA: Dosing and Monitoring', category: 'Pharmacology', disease_area: 'Rheumatoid Arthritis', priority: 9, sources: ['ACR', 'EULAR'] },
  { topic: 'JAK Inhibitors Comparative Efficacy and Safety in Rheumatoid Arthritis', category: 'Pharmacology', disease_area: 'Rheumatoid Arthritis', priority: 10, sources: ['NEJM', 'Lancet'] },
  { topic: 'Biologic DMARDs Selection Algorithm for RA', category: 'Treatment Protocols', disease_area: 'Rheumatoid Arthritis', priority: 8, sources: ['ACR', 'EULAR'] },
  { topic: 'RA Remission Criteria: DAS28 vs CDAI vs Boolean', category: 'Clinical Assessment', disease_area: 'Rheumatoid Arthritis', priority: 8, sources: ['EULAR', 'ACR'] },
  
  // Systemic Lupus Erythematosus - High Impact Studies
  { topic: 'EULAR/ACR 2019 SLE Classification Criteria Update 2024', category: 'Guidelines', disease_area: 'Systemic Lupus Erythematosus', priority: 10, sources: ['EULAR', 'ACR'] },
  { topic: 'Lupus Nephritis: ISN/RPS Classification and KDIGO Management', category: 'Guidelines', disease_area: 'Systemic Lupus Erythematosus', priority: 10, sources: ['NEJM', 'Nature Reviews'] },
  { topic: 'Voclosporin in Lupus Nephritis: AURORA Trial Evidence', category: 'Pharmacology', disease_area: 'Systemic Lupus Erythematosus', priority: 9, sources: ['NEJM', 'Lancet'] },
  { topic: 'Belimumab and Anifrolumab: Type I Interferon Pathway in SLE', category: 'Pharmacology', disease_area: 'Systemic Lupus Erythematosus', priority: 9, sources: ['NEJM', 'Nature Medicine'] },
  { topic: 'SLEDAI-2K and BILAG in SLE Disease Activity Monitoring', category: 'Clinical Assessment', disease_area: 'Systemic Lupus Erythematosus', priority: 8, sources: ['ACR', 'EULAR'] },
  { topic: 'Hydroxychloroquine Retinopathy Screening: AAO Guidelines', category: 'Safety', disease_area: 'Systemic Lupus Erythematosus', priority: 8, sources: ['ACR', 'AAO'] },
  
  // Spondyloarthritis - ASAS and EULAR Focus
  { topic: 'ASAS Classification Criteria for Axial Spondyloarthritis 2024', category: 'Guidelines', disease_area: 'Spondyloarthritis', priority: 10, sources: ['ASAS', 'EULAR'] },
  { topic: 'Non-Radiographic Axial SpA: Early Diagnosis and Treatment', category: 'Clinical Assessment', disease_area: 'Spondyloarthritis', priority: 9, sources: ['EULAR', 'Lancet Rheumatology'] },
  { topic: 'IL-17 Inhibitors vs TNF Inhibitors in Ankylosing Spondylitis', category: 'Pharmacology', disease_area: 'Spondyloarthritis', priority: 9, sources: ['NEJM', 'Lancet'] },
  { topic: 'BASDAI and ASDAS: Disease Activity Monitoring Standards', category: 'Clinical Assessment', disease_area: 'Spondyloarthritis', priority: 8, sources: ['ASAS', 'EULAR'] },
  { topic: 'Extra-Articular Manifestations in Spondyloarthritis', category: 'Clinical Assessment', disease_area: 'Spondyloarthritis', priority: 8, sources: ['EULAR', 'ACR'] },
  
  // Psoriatic Arthritis - ACR/EULAR/GRAPPA
  { topic: 'CASPAR Criteria and ACR/EULAR PsA Treatment Recommendations', category: 'Guidelines', disease_area: 'Psoriatic Arthritis', priority: 10, sources: ['ACR', 'EULAR', 'GRAPPA'] },
  { topic: 'Minimal Disease Activity in Psoriatic Arthritis: MDA Criteria', category: 'Clinical Assessment', disease_area: 'Psoriatic Arthritis', priority: 9, sources: ['GRAPPA', 'ACR'] },
  { topic: 'IL-23 and IL-17 Pathway Inhibition in PsA: Head-to-Head Trials', category: 'Pharmacology', disease_area: 'Psoriatic Arthritis', priority: 9, sources: ['NEJM', 'Lancet'] },
  { topic: 'Nail Psoriasis and Enthesitis Assessment in PsA', category: 'Clinical Assessment', disease_area: 'Psoriatic Arthritis', priority: 7, sources: ['GRAPPA', 'EULAR'] },
  
  // Vasculitis - ACR/EULAR Classification 2022
  { topic: 'ANCA-Associated Vasculitis: ACR/EULAR 2022 Classification and Treatment', category: 'Guidelines', disease_area: 'Vasculitis', priority: 10, sources: ['ACR', 'EULAR', 'NEJM'] },
  { topic: 'Giant Cell Arteritis Fast-Track Pathway and Tocilizumab', category: 'Treatment Protocols', disease_area: 'Vasculitis', priority: 9, sources: ['NEJM', 'Lancet'] },
  { topic: 'Rituximab vs Cyclophosphamide in ANCA Vasculitis: RAVE and RITUXVAS', category: 'Pharmacology', disease_area: 'Vasculitis', priority: 9, sources: ['NEJM', 'Lancet'] },
  { topic: 'Avacopan in ANCA Vasculitis: ADVOCATE Trial', category: 'Pharmacology', disease_area: 'Vasculitis', priority: 9, sources: ['NEJM'] },
  { topic: 'Takayasu Arteritis: Imaging and Biologics', category: 'Clinical Assessment', disease_area: 'Vasculitis', priority: 8, sources: ['ACR', 'EULAR'] },
  
  // Connective Tissue Diseases
  { topic: 'Myositis-Specific Antibodies: Clinical Phenotypes and Prognosis', category: 'Clinical Assessment', disease_area: 'Inflammatory Myopathies', priority: 9, sources: ['EULAR', 'Nature Reviews'] },
  { topic: 'Systemic Sclerosis: Modified Rodnan Skin Score and ILD Screening', category: 'Clinical Assessment', disease_area: 'Systemic Sclerosis', priority: 9, sources: ['EULAR', 'ACR'] },
  { topic: 'Nintedanib in SSc-ILD: SENSCIS Trial', category: 'Pharmacology', disease_area: 'Systemic Sclerosis', priority: 9, sources: ['NEJM', 'Lancet'] },
  { topic: 'Interstitial Lung Disease in Autoimmune Diseases: Screening and Management', category: 'Treatment Protocols', disease_area: 'Connective Tissue Diseases', priority: 10, sources: ['EULAR', 'NEJM'] },
  { topic: 'Sjögren Syndrome Classification and Novel Therapies', category: 'Guidelines', disease_area: 'Connective Tissue Diseases', priority: 8, sources: ['ACR', 'EULAR'] },
  
  // Osteoarthritis - OARSI Focus
  { topic: 'OARSI Guidelines for Knee Osteoarthritis 2024', category: 'Guidelines', disease_area: 'Osteoarthritis', priority: 9, sources: ['OARSI', 'ACR'] },
  { topic: 'GLP-1 Agonists and Weight Management in Osteoarthritis', category: 'Pharmacology', disease_area: 'Osteoarthritis', priority: 8, sources: ['NEJM', 'Lancet'] },
  { topic: 'Intra-articular Therapies: Evidence Review 2024', category: 'Treatment Protocols', disease_area: 'Osteoarthritis', priority: 7, sources: ['OARSI', 'ACR'] },
  
  // Gout - ACR Guidelines
  { topic: 'ACR Guidelines for Gout Management 2024', category: 'Guidelines', disease_area: 'Gout', priority: 10, sources: ['ACR'] },
  { topic: 'Treat-to-Target Urate Lowering Therapy: Evidence and Practice', category: 'Treatment Protocols', disease_area: 'Gout', priority: 9, sources: ['ACR', 'EULAR'] },
  { topic: 'Pegloticase with Immunomodulation in Refractory Gout: MIRROR Trial', category: 'Pharmacology', disease_area: 'Gout', priority: 8, sources: ['NEJM', 'Lancet'] },
  { topic: 'Gout and Cardiovascular Risk: Management Strategies', category: 'Safety', disease_area: 'Gout', priority: 8, sources: ['NEJM', 'Nature'] },
  
  // Safety and Monitoring - High Priority
  { topic: 'Cardiovascular Safety of JAK Inhibitors: ORAL Surveillance and Beyond', category: 'Safety', disease_area: 'General Rheumatology', priority: 10, sources: ['NEJM', 'Lancet', 'FDA'] },
  { topic: 'Infection Risk Stratification with Immunosuppressive Therapy', category: 'Safety', disease_area: 'General Rheumatology', priority: 9, sources: ['ACR', 'EULAR'] },
  { topic: 'Pregnancy and Lactation in Rheumatic Diseases: ACR Guideline', category: 'Treatment Protocols', disease_area: 'General Rheumatology', priority: 9, sources: ['ACR'] },
  { topic: 'COVID-19 Vaccination in Immunocompromised Patients: ACR Guidance', category: 'Guidelines', disease_area: 'General Rheumatology', priority: 9, sources: ['ACR', 'EULAR'] },
  { topic: 'Biosimilar Transition in Rheumatology: Evidence and Practice', category: 'Pharmacology', disease_area: 'General Rheumatology', priority: 8, sources: ['ACR', 'EULAR'] },
  
  // Pediatric Rheumatology
  { topic: 'Juvenile Idiopathic Arthritis: ILAR Classification and ACR Treatment', category: 'Guidelines', disease_area: 'Pediatric Rheumatology', priority: 9, sources: ['ACR', 'PRES'] },
  { topic: 'Macrophage Activation Syndrome: HLH-2024 Criteria and Treatment', category: 'Clinical Assessment', disease_area: 'Pediatric Rheumatology', priority: 10, sources: ['ACR', 'PRES'] },
  { topic: 'Pediatric SLE Management: Unique Considerations', category: 'Treatment Protocols', disease_area: 'Pediatric Rheumatology', priority: 8, sources: ['ACR', 'EULAR'] },
  
  // Brazilian/Latin American Rheumatology
  { topic: 'SBR Consensus on Rheumatoid Arthritis Treatment 2024', category: 'Guidelines', disease_area: 'Rheumatoid Arthritis', priority: 9, sources: ['SBR'] },
  { topic: 'Endemic Rheumatic Diseases in Latin America', category: 'Clinical Assessment', disease_area: 'General Rheumatology', priority: 7, sources: ['SBR', 'PANLAR'] },
  { topic: 'Chikungunya Arthropathy: Diagnosis and Management', category: 'Clinical Assessment', disease_area: 'General Rheumatology', priority: 8, sources: ['SBR', 'Lancet'] },
];

// Search authoritative sources using Perplexity
async function searchMedicalLiterature(topic: string, diseaseArea: string): Promise<{
  citations: string[];
  searchResults: string;
  keyFindings: string[];
}> {
  const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
  
  if (!perplexityKey) {
    console.log('⚠️ Perplexity API key not found, using synthetic search');
    return {
      citations: [],
      searchResults: '',
      keyFindings: []
    };
  }

  const searchQuery = `${topic} rheumatology clinical guidelines evidence-based medicine 2024`;
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are a medical research librarian specializing in rheumatology. Search for the latest evidence-based information from authoritative sources including:
- EULAR (European Alliance of Associations for Rheumatology)
- ACR (American College of Rheumatology)  
- Lancet Rheumatology
- Nature Reviews Rheumatology
- New England Journal of Medicine
- Annals of Rheumatic Diseases
- Brazilian Society of Rheumatology (SBR)
- OARSI (Osteoarthritis Research Society International)

Focus on:
1. Current classification criteria and guidelines
2. High-impact clinical trials (RCTs, meta-analyses)
3. Treatment recommendations
4. Safety data and monitoring protocols`
          },
          {
            role: 'user',
            content: `Search for the most current and authoritative medical literature on: "${topic}" in ${diseaseArea}. 

Provide:
1. Key findings from major trials and guidelines
2. Evidence level (Oxford OCEBM)
3. Practical clinical recommendations
4. Recent updates or changes in practice`
          }
        ],
        search_domain_filter: AUTHORITATIVE_SOURCES,
        search_recency_filter: 'year',
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status);
      return { citations: [], searchResults: '', keyFindings: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const citations = data.citations || [];

    // Extract key findings
    const keyFindings = content
      .split('\n')
      .filter((line: string) => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
      .slice(0, 10);

    return {
      citations,
      searchResults: content,
      keyFindings
    };
  } catch (err) {
    console.error('Perplexity search error:', err);
    return { citations: [], searchResults: '', keyFindings: [] };
  }
}

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
            topic: t.topic,
            category: t.category,
            disease_area: t.disease_area,
            priority: t.priority,
            status: 'queued',
            source: 'system_seed'
          })));

        if (error) throw error;
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Seeded ${newTopics.length} new topics from authoritative sources`,
        total_topics: SEED_TOPICS.length,
        new_topics: newTopics.length,
        sources: ['EULAR', 'ACR', 'NEJM', 'Lancet', 'Nature', 'SBR', 'OARSI']
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'ignite') {
      // Full ignition: seed + trigger batch processing with real literature search
      console.log('🔥 IGNITION SEQUENCE STARTED - Mining authoritative medical literature');

      // Step 1: Seed topics
      const { data: existingTopics } = await supabase
        .from('research_topic_queue')
        .select('topic');
      
      const existingTopicNames = new Set(existingTopics?.map(t => t.topic) || []);
      const newTopics = SEED_TOPICS.filter(t => !existingTopicNames.has(t.topic));

      if (newTopics.length > 0) {
        await supabase.from('research_topic_queue').insert(
          newTopics.map(t => ({
            topic: t.topic,
            category: t.category,
            disease_area: t.disease_area,
            priority: t.priority,
            status: 'queued',
            source: 'system_seed'
          }))
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

      // Step 3: Process each topic with real literature search
      const results = [];
      const geminiKey = Deno.env.get('GEMINI_API_KEY');

      for (const topic of queuedTopics) {
        try {
          // Mark as processing
          await supabase
            .from('research_topic_queue')
            .update({ status: 'processing', last_processed_at: new Date().toISOString() })
            .eq('id', topic.id);

          console.log(`📚 Researching: ${topic.topic}`);

          // Search authoritative literature first
          const literature = await searchMedicalLiterature(topic.topic, topic.disease_area || 'Rheumatology');
          
          const citationsText = literature.citations.length > 0 
            ? `\n\nAuthoritative Sources Found:\n${literature.citations.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
            : '';

          const literatureContext = literature.searchResults 
            ? `\n\nRecent Literature Evidence:\n${literature.searchResults.substring(0, 3000)}`
            : '';

          // Generate article content enhanced with real literature
          const articlePrompt = `You are a medical content expert specializing in rheumatology writing for the UHS Health OS knowledge library. Generate a comprehensive, evidence-based article on: "${topic.topic}"

Category: ${topic.category}
Disease Area: ${topic.disease_area}
${literatureContext}
${citationsText}

CRITICAL REQUIREMENTS:
1. Write in academic medical style suitable for practicing rheumatologists
2. MUST include specific evidence from major trials and guidelines (cite by name)
3. Reference current guidelines: ACR (American College of Rheumatology), EULAR, ASAS, GRAPPA, OARSI, SBR
4. Include practical clinical pearls that can be applied immediately
5. Structure with clear sections: 
   - Clinical Overview
   - Key Evidence (cite specific trials: e.g., ORAL Surveillance, RAVE, AURORA, etc.)
   - Current Guideline Recommendations  
   - Practical Application & Clinical Pearls
   - Safety Considerations
   - References
6. Be factually accurate with 2024 medical knowledge
7. Minimum 2500 words for comprehensive coverage
8. Include specific drug names, dosages, and monitoring parameters where relevant

Respond in JSON format:
{
  "title": "Article title",
  "summary": "2-3 sentence summary highlighting key takeaways",
  "content": "Full markdown article content (2500+ words)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "evidence_level": "1a|1b|2a|2b|3a|3b|4|5",
  "evidence_grade": "A|B|C|D|I",
  "key_references": ["Reference 1", "Reference 2"]
}`;

          const genResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: articlePrompt }] }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 12000 }
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

          // Create pipeline entry with research sources
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
              priority: topic.priority,
              research_sources: literature.citations.length > 0 ? literature.citations : [],
              source_count: literature.citations.length
            })
            .select()
            .single();

          if (pipelineError) {
            console.error('Pipeline insert error:', pipelineError);
            results.push({ topic: topic.topic, status: 'pipeline_error' });
            continue;
          }

          // Run AI Judge evaluation with stricter criteria
          const judgePrompt = `You are a senior medical peer-reviewer evaluating rheumatology content for the UHS Health OS knowledge library.

ARTICLE TO REVIEW:
Title: ${article.title}
Disease Area: ${topic.disease_area}
Content Preview: ${article.content?.substring(0, 4000)}...

Number of Authoritative Citations: ${literature.citations.length}
${literature.citations.length > 0 ? `Citations: ${literature.citations.slice(0, 5).join(', ')}` : 'No external citations available'}

EVALUATION CRITERIA (Oxford OCEBM / GRADE):

1. EVIDENCE QUALITY (40 points)
   - Are specific trials/studies cited by name?
   - Is the evidence level appropriate for recommendations?
   - Are major society guidelines (ACR/EULAR) referenced?

2. CLINICAL ACCURACY (30 points)
   - Are drug names, dosages, and protocols correct?
   - Are contraindications and safety warnings included?
   - Is the information current (2024)?

3. PRACTICAL UTILITY (20 points)
   - Can a rheumatologist apply this immediately?
   - Are clinical pearls actionable?
   - Is the structure clear and navigable?

4. SAFETY (10 points)
   - Any potential for patient harm if followed?
   - Are appropriate warnings included?
   - Red flags for outdated or dangerous advice?

AUTO-APPROVE THRESHOLD: Score ≥85 AND Grade A/B AND Level 1-2 AND no safety concerns

Respond in JSON:
{
  "decision": "auto_approve" | "needs_human_review" | "reject",
  "confidence": 0-100,
  "evidence_level": "1a|1b|2a|2b|3a|3b|4|5",
  "grade": "A|B|C|D|I",
  "reasoning": "Detailed explanation of decision",
  "requires_human_review": true/false,
  "safety_concerns": [],
  "quality_scores": {
    "evidence": 0-40,
    "accuracy": 0-30,
    "utility": 0-20,
    "safety": 0-10
  }
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

          // Stricter auto-approve criteria with literature backing
          const hasGoodEvidence = literature.citations.length >= 2 || judgment.confidence >= 90;
          const highGrade = ['A', 'B'].includes(judgment.grade);
          const goodLevel = ['1a', '1b', '2a', '2b'].includes(judgment.evidence_level);
          const noSafetyConcerns = !judgment.safety_concerns || judgment.safety_concerns.length === 0;
          
          const autoApprove = 
            judgment.decision === 'auto_approve' && 
            judgment.confidence >= 85 && 
            hasGoodEvidence &&
            highGrade &&
            goodLevel &&
            noSafetyConcerns;

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
              requires_human_review: !autoApprove,
              auto_approved: autoApprove
            })
            .eq('id', pipelineEntry.id);

          // Log the review with detailed scores
          await supabase.from('ai_review_logs').insert({
            pipeline_id: pipelineEntry.id,
            reviewer_type: 'ai_judge',
            action: 'initial_review',
            decision: judgment.decision,
            confidence_score: judgment.confidence,
            evidence_level: judgment.evidence_level,
            evidence_grade: judgment.grade,
            reasoning: judgment.reasoning,
            metadata: {
              quality_scores: judgment.quality_scores,
              citations_count: literature.citations.length,
              auto_approved: autoApprove
            }
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
              
            console.log(`✅ Auto-published: ${article.title}`);
          } else {
            console.log(`⏳ Pending review: ${article.title} (Score: ${judgment.confidence})`);
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
            evidence_grade: judgment.grade,
            citations: literature.citations.length
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
        message: '🔥 Ignition complete! Mining authoritative medical literature from EULAR, ACR, NEJM, Lancet, Nature & SBR',
        seeded_topics: newTopics.length,
        processed: results.length,
        results,
        stats: {
          total_published: totalPublished,
          pending_review: pendingReview,
          topics_remaining: queuedCount
        },
        sources_used: AUTHORITATIVE_SOURCES
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      error: 'Invalid action. Use "seed_topics" or "ignite"'
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Ignition error:', error);
    return new Response(JSON.stringify({
      error: String(error)
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
