import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Ultimate User Standards - The identity and mission of orienta@novusoriens.org
const ULTIMATE_USER_STANDARDS = {
  identity: {
    email: "orienta@novusoriens.org",
    name: "Novus Oriens",
    title: "Universal Health System Ambassador",
    verification_tier: "ultimate",
    role: "Global healthcare transformation catalyst",
  },
  mission: {
    platform: "UHS Health OS - Universal Health Operating System",
    vision: "Transform how healthcare knowledge flows across the globe",
    tagline: "Where Evidence Meets Innovation",
    principles: [
      "Privacy-First: No PHI/PII on-chain, only cryptographic proofs",
      "Blockchain-Verified: Immutable audit trails on Solana",
      "Clinically Validated: Evidence-based with Oxford OCEBM levels",
      "AI-Augmented: Dual AI system for quality assurance",
      "Globally Accessible: Multi-language, multi-specialty support",
    ],
  },
  authority: {
    capabilities: [
      "Full platform access across all features",
      "Manage verification requests for medical professionals",
      "Control outreach campaigns to global institutions",
      "Access all analytics and blockchain registries",
      "Override AI decisions when necessary",
    ],
    restrictions: [
      "Must maintain ethical standards in all communications",
      "Cannot bypass security protocols",
      "Must respect patient privacy at all times",
      "All actions are auditable and logged",
    ],
  },
  outreach_standards: {
    sender_name: "Novus Oriens",
    sender_email: "orienta@novusoriens.org",
    tone: "Professional, visionary, transformative",
    target_audiences: ["HealthTech Investors", "Academic Institutions", "Medical Associations"],
    messaging_pillars: [
      "Healthcare transformation is inevitable",
      "Early adopters shape the future",
      "Free access window is limited",
      "Convergence of AI + Blockchain + Healthcare",
    ],
  },
  technical_standards: {
    urv_scoring: "Universal Risk Value - quantifies outcomes, processes, infrastructure, experience",
    blockchain: "Solana-based audit ledger with chained score updates",
    ai_pipeline: "Perplexity for research, Gemini/GPT for generation, dual AI for QA",
    evidence_levels: "Oxford OCEBM (1a-5) with GRADE recommendations (A-I)",
  },
};

const SYSTEM_PROMPT = `You are the AI Guardian Agent for the Ultimate User of UHS Health OS.

## Your Identity
You serve ${ULTIMATE_USER_STANDARDS.identity.name} (${ULTIMATE_USER_STANDARDS.identity.email}), the ${ULTIMATE_USER_STANDARDS.identity.title}.

## Platform Mission
${ULTIMATE_USER_STANDARDS.mission.platform}: ${ULTIMATE_USER_STANDARDS.mission.vision}

## Core Principles
${ULTIMATE_USER_STANDARDS.mission.principles.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## Ultimate User Authority
Capabilities:
${ULTIMATE_USER_STANDARDS.authority.capabilities.map(c => `- ${c}`).join('\n')}

Restrictions:
${ULTIMATE_USER_STANDARDS.authority.restrictions.map(r => `- ${r}`).join('\n')}

## Outreach Standards
- Sender: ${ULTIMATE_USER_STANDARDS.outreach_standards.sender_name} <${ULTIMATE_USER_STANDARDS.outreach_standards.sender_email}>
- Tone: ${ULTIMATE_USER_STANDARDS.outreach_standards.tone}
- Targets: ${ULTIMATE_USER_STANDARDS.outreach_standards.target_audiences.join(', ')}
- Key Messages: ${ULTIMATE_USER_STANDARDS.outreach_standards.messaging_pillars.join('; ')}

## Technical Standards
- URV: ${ULTIMATE_USER_STANDARDS.technical_standards.urv_scoring}
- Blockchain: ${ULTIMATE_USER_STANDARDS.technical_standards.blockchain}
- AI Pipeline: ${ULTIMATE_USER_STANDARDS.technical_standards.ai_pipeline}
- Evidence: ${ULTIMATE_USER_STANDARDS.technical_standards.evidence_levels}

## Your Responsibilities
1. **Identity Verification**: Confirm and validate actions align with Ultimate User standards
2. **Standard Enforcement**: Ensure all platform activities follow established protocols
3. **Confirmation Generation**: Provide formal confirmations when requested
4. **Guidance**: Advise on proper procedures and best practices
5. **Audit Support**: Document decisions and provide rationale

When asked for confirmations, provide structured responses with:
- Confirmation ID (timestamp-based)
- Action being confirmed
- Standards alignment check
- Authorization level
- Any conditions or notes

Always maintain the dignity and authority of the Ultimate User role while ensuring ethical compliance.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is the Ultimate User
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has ultimate tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('verification_tier')
      .eq('user_id', user.id)
      .single();

    if (profile?.verification_tier !== 'ultimate') {
      return new Response(
        JSON.stringify({ error: 'Access restricted to Ultimate User only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, message, context } = await req.json();

    // Handle different actions
    if (action === 'get_standards') {
      return new Response(
        JSON.stringify({
          success: true,
          standards: ULTIMATE_USER_STANDARDS,
          retrieved_at: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'generate_confirmation') {
      const confirmationId = `CONF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('OPENAI_API_KEY');
      const useGemini = !!Deno.env.get('GEMINI_API_KEY');

      let aiResponse: string;

      if (useGemini) {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `${SYSTEM_PROMPT}\n\nUser Request: ${message}\n\nContext: ${JSON.stringify(context || {})}\n\nGenerate a formal confirmation document with ID: ${confirmationId}`
                }]
              }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048,
              },
            }),
          }
        );

        const geminiData = await geminiResponse.json();
        aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Confirmation generated.';
      } else {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: `Request: ${message}\n\nContext: ${JSON.stringify(context || {})}\n\nGenerate a formal confirmation document with ID: ${confirmationId}` }
            ],
            temperature: 0.3,
            max_tokens: 2048,
          }),
        });

        const openaiData = await openaiResponse.json();
        aiResponse = openaiData.choices?.[0]?.message?.content || 'Confirmation generated.';
      }

      return new Response(
        JSON.stringify({
          success: true,
          confirmation_id: confirmationId,
          confirmation: aiResponse,
          issued_by: ULTIMATE_USER_STANDARDS.identity.name,
          issued_at: new Date().toISOString(),
          authority_level: 'ultimate',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'chat') {
      const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('OPENAI_API_KEY');
      const useGemini = !!Deno.env.get('GEMINI_API_KEY');

      let aiResponse: string;

      if (useGemini) {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${message}` }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
              },
            }),
          }
        );

        const geminiData = await geminiResponse.json();
        aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'I am here to assist you.';
      } else {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 2048,
          }),
        });

        const openaiData = await openaiResponse.json();
        aiResponse = openaiData.choices?.[0]?.message?.content || 'I am here to assist you.';
      }

      return new Response(
        JSON.stringify({
          success: true,
          response: aiResponse,
          agent: 'AI Guardian',
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: get_standards, generate_confirmation, or chat' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI Guardian Agent error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
