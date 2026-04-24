import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createResendClient, sendEmail } from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SystemStats {
  totalPatients: number;
  totalVisits: number;
  totalEducationArticles: number;
  publishedArticles: number;
  pipelineItems: number;
  pendingReviews: number;
  approvedResearch: number;
  sentinelAlerts: number;
  resolvedAlerts: number;
  totalContributions: number;
  totalFocusSessions: number;
  recentAgentRuns: any[];
  topicQueueSize: number;
  activeUsers: number;
}

async function gatherStats(supabase: any): Promise<SystemStats> {
  const [
    patients,
    visits,
    education,
    publishedEd,
    pipeline,
    pendingPipeline,
    approvedPipeline,
    sentinelAll,
    sentinelResolved,
    contributions,
    focusSessions,
    agentRuns,
    topicQueue,
    activity,
  ] = await Promise.all([
    supabase.from("patient_cards").select("id", { count: "exact", head: true }),
    supabase.from("visits").select("id", { count: "exact", head: true }),
    supabase.from("education_content").select("id", { count: "exact", head: true }),
    supabase.from("education_content").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("ai_research_pipeline").select("id", { count: "exact", head: true }),
    supabase.from("ai_research_pipeline").select("id", { count: "exact", head: true }).eq("status", "pending_review"),
    supabase.from("ai_research_pipeline").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("sentinel_alerts").select("id", { count: "exact", head: true }),
    supabase.from("sentinel_alerts").select("id", { count: "exact", head: true }).eq("is_resolved", true),
    supabase.from("knowledge_contributions").select("id", { count: "exact", head: true }),
    supabase.from("focus_sessions").select("id", { count: "exact", head: true }),
    supabase.from("agent_run_log").select("*").order("started_at", { ascending: false }).limit(10),
    supabase.from("research_topic_queue").select("id", { count: "exact", head: true }).eq("status", "queued"),
    supabase.from("site_activity_log").select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  return {
    totalPatients: patients.count || 0,
    totalVisits: visits.count || 0,
    totalEducationArticles: education.count || 0,
    publishedArticles: publishedEd.count || 0,
    pipelineItems: pipeline.count || 0,
    pendingReviews: pendingPipeline.count || 0,
    approvedResearch: approvedPipeline.count || 0,
    sentinelAlerts: sentinelAll.count || 0,
    resolvedAlerts: sentinelResolved.count || 0,
    totalContributions: contributions.count || 0,
    totalFocusSessions: focusSessions.count || 0,
    recentAgentRuns: agentRuns.data || [],
    topicQueueSize: topicQueue.count || 0,
    activeUsers: activity.count || 0,
  };
}

function getDigestConfig(digestType: string) {
  switch (digestType) {
    case "daily":
      return {
        complexity: "medium",
        maxTokens: 1500,
        prompt: `Write a MEDIUM-length professional newsletter digest (300-500 words). 
Focus on: key metrics changes, notable events, AI agent activity, and brief highlights.
Tone: professional, informative, engaging. Like a daily briefing from a tech-health platform.
Include sections: 📊 Key Metrics | 🤖 AI Engine Status | 📚 Content Pipeline | 💡 Highlights`,
      };
    case "weekly":
      return {
        complexity: "high",
        maxTokens: 3000,
        prompt: `Write a LONG, COMPREHENSIVE weekly newsletter digest (800-1200 words).
Include: detailed analytics, trend analysis, AI research pipeline deep-dive, content quality metrics,
sentinel security report, community contributions, and strategic insights.
Tone: authoritative, data-driven, with actionable insights. Like an official weekly report.
Include sections: 📊 Weekly Dashboard | 📈 Trend Analysis | 🤖 AI Operations Report | 
🔬 Research Pipeline | 🛡️ Security & Sentinel | 👥 Community | 🎯 Key Achievements | 📋 Coming Up`,
      };
    case "monthly":
      return {
        complexity: "very_high",
        maxTokens: 5000,
        prompt: `Write an EXTENSIVE monthly newsletter report (1500-2500 words).
Include: comprehensive month-over-month analysis, strategic milestones, deep research analysis,
platform growth metrics, AI system performance review, content quality evolution, 
security audit summary, community growth, and forward-looking roadmap highlights.
Tone: executive summary meets newsletter. Official, polished, data-rich.
Include sections: 🏥 Executive Summary | 📊 Monthly Metrics Dashboard | 📈 Growth Analysis |
🤖 AI Systems Performance | 🔬 Research & Knowledge | 🛡️ Security Report |
👥 Community & Contributions | 🏆 Milestones | 🗓️ Month Ahead Preview`,
      };
    case "quarterly":
      return {
        complexity: "maximum",
        maxTokens: 8000,
        prompt: `Write a COMPREHENSIVE quarterly report newsletter (3000-5000 words).
This is the most detailed report. Include: full quarter analysis, strategic review,
platform evolution, AI capability assessment, research impact metrics, 
content ecosystem health, security posture review, community statistics,
partnership updates, and strategic planning outlook.
Tone: official publication quality. This is the flagship quarterly newsletter.
Include sections: 📋 Quarterly Executive Brief | 📊 Platform Metrics (detailed) |
📈 Growth & Adoption | 🤖 AI & Automation Review | 🔬 Research Impact |
📚 Knowledge Base Evolution | 🛡️ Security & Compliance | 👥 Community Report |
🏆 Quarter Highlights | 📐 Architecture & Tech | 🗺️ Strategic Roadmap | 🔮 Next Quarter`,
      };
    default:
      return getDigestConfig("daily");
  }
}

async function generateDigest(stats: SystemStats, digestType: string): Promise<{ subject: string; html: string; text: string }> {
  const config = getDigestConfig(digestType);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const agentSummary = stats.recentAgentRuns.map((r: any) =>
    `  - ${r.agent_name}: ${r.status} ${r.error_message ? `(⚠️ ${r.error_message.substring(0, 60)})` : "✅"}`
  ).join("\n");

  const systemContext = `
SYSTEM: UHS Health OS — Rheumatology Clinical Intelligence Platform
DATE: ${dateStr}
DIGEST TYPE: ${digestType.toUpperCase()}

CURRENT SYSTEM STATS:
- Patient Cards: ${stats.totalPatients}
- Total Visits: ${stats.totalVisits}
- Education Articles: ${stats.totalEducationArticles} (${stats.publishedArticles} published)
- AI Research Pipeline Items: ${stats.pipelineItems} (${stats.pendingReviews} pending review, ${stats.approvedResearch} approved)
- Sentinel Alerts: ${stats.sentinelAlerts} total (${stats.resolvedAlerts} resolved)
- Knowledge Contributions: ${stats.totalContributions}
- Focus Sessions: ${stats.totalFocusSessions}
- Research Topic Queue: ${stats.topicQueueSize} topics queued
- Active Users (24h): ${stats.activeUsers}

RECENT AI AGENT RUNS:
${agentSummary || "  No recent runs"}
`;

  // Try multiple AI providers with fallback
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

  const systemPrompt = `You are the official newsletter editor for UHS Health OS, a cutting-edge rheumatology clinical intelligence platform. 
You write professional, engaging digests that make complex system data accessible and interesting.
Always use emojis for section headers. Be data-driven but human-readable.
Output in markdown format. The subject line should be on the first line prefixed with "SUBJECT: "`;

  const userPrompt = `${config.prompt}\n\n${systemContext}`;
  let content = "";

  // Try Perplexity first
  if (PERPLEXITY_API_KEY) {
    try {
      const res = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        },
        body: JSON.stringify({
          model: "sonar",
          max_tokens: config.maxTokens,
          temperature: 0.7,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        content = data.choices?.[0]?.message?.content || "";
      } else {
        console.warn("Perplexity failed:", res.status, await res.text());
      }
    } catch (e) {
      console.warn("Perplexity error:", e);
    }
  }

  if (!content) {
    throw new Error("All AI providers failed or are unavailable. Check API keys.");
  }

  // Extract subject
  let subject = `UHS Health OS — ${digestType.charAt(0).toUpperCase() + digestType.slice(1)} Digest — ${dateStr}`;
  const subjectMatch = content.match(/^SUBJECT:\s*(.+)$/m);
  if (subjectMatch) subject = subjectMatch[1].trim();

  const bodyMarkdown = content.replace(/^SUBJECT:.*\n?/m, "").trim();

  // Convert markdown to simple HTML
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; background: #f0f4ff; color: #1a2332; }
  .header { background: linear-gradient(135deg, #1e40af, #3b82f6, #60a5fa); padding: 32px; border-radius: 16px 16px 0 0; text-align: center; color: white; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
  .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
  .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-top: 12px; }
  .content { background: white; padding: 32px; border-radius: 0 0 16px 16px; line-height: 1.7; }
  h2 { color: #1e40af; border-bottom: 2px solid #dbeafe; padding-bottom: 8px; margin-top: 28px; }
  h3 { color: #2563eb; }
  code { background: #eff6ff; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
  .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0; }
  .stat-card { background: #f0f4ff; padding: 16px; border-radius: 12px; text-align: center; }
  .stat-card .value { font-size: 28px; font-weight: 700; color: #1e40af; }
  .stat-card .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 12px; }
  .footer a { color: #3b82f6; }
  ul { padding-left: 20px; }
  li { margin: 4px 0; }
  strong { color: #1e3a5f; }
  blockquote { border-left: 4px solid #3b82f6; padding: 12px 16px; background: #f0f7ff; margin: 16px 0; border-radius: 0 8px 8px 0; }
</style></head><body>
<div class="header">
  <h1>🏥 UHS Health OS</h1>
  <p>${dateStr}</p>
  <div class="badge">${digestType} digest</div>
</div>
<div class="content">
  <div class="stats-grid">
    <div class="stat-card"><div class="value">${stats.totalPatients}</div><div class="label">Patients</div></div>
    <div class="stat-card"><div class="value">${stats.publishedArticles}</div><div class="label">Published</div></div>
    <div class="stat-card"><div class="value">${stats.pipelineItems}</div><div class="label">Pipeline Items</div></div>
    <div class="stat-card"><div class="value">${stats.activeUsers}</div><div class="label">Active (24h)</div></div>
  </div>
  ${bodyMarkdown.replace(/\n/g, "<br>")}
</div>
<div class="footer">
  <p>UHS Health OS — Rheumatology Clinical Intelligence Platform</p>
  <p>Powered by AI Autonomous Research Engine</p>
  <p><a href="https://rhema-care-flow.lovable.app">Visit Platform</a></p>
  <p style="font-size:10px;margin-top:16px;">This is an automated digest from UHS Health OS. Do not reply to this email.</p>
</div>
</body></html>`;

  return { subject, html, text: bodyMarkdown };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Determine digest type from body or auto-detect
    let digestType = "daily";
    let recipientEmail = "novvsoriens@gmail.com";
    let forceRun = false;

    try {
      const body = await req.json();
      if (body.digest_type) digestType = body.digest_type;
      if (body.email) recipientEmail = body.email;
      if (body.force) forceRun = true;
    } catch {
      // Auto-detect based on day
      const now = new Date();
      const dayOfWeek = now.getUTCDay();
      const dayOfMonth = now.getUTCDate();

      if (dayOfMonth === 1 && [1, 4, 7, 10].includes(now.getUTCMonth())) {
        digestType = "quarterly";
      } else if (dayOfMonth === 1) {
        digestType = "monthly";
      } else if (dayOfWeek === 0) {
        digestType = "weekly";
      } else {
        digestType = "daily";
      }
    }

    console.log(`📰 Generating ${digestType} newsletter digest...`);

    // Gather system stats
    const stats = await gatherStats(supabase);
    console.log("📊 Stats gathered:", JSON.stringify(stats, null, 2));

    // Generate AI digest
    const { subject, html, text } = await generateDigest(stats, digestType);
    console.log(`✅ Digest generated: "${subject}"`);

    // Store in database
    const { data: digest, error: insertError } = await supabase
      .from("newsletter_digests")
      .insert({
        digest_type: digestType,
        subject,
        content_html: html,
        content_text: text,
        stats_snapshot: stats,
        sent_to: [recipientEmail],
        status: "generated",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to save digest:", insertError);
      throw new Error(`Failed to save digest: ${insertError.message}`);
    }

    // Send via Resend if configured
    let emailSent = false;
    if (RESEND_API_KEY) {
      try {
        const emailResult = await sendEmail(createResendClient(), {
          from: "UHS Health OS <onboarding@resend.dev>",
          to: recipientEmail,
          subject,
          html,
          text,
        });

        if (emailResult.ok) {
          emailSent = true;
          await supabase
            .from("newsletter_digests")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", digest.id);
          console.log(`📧 Email sent to ${recipientEmail} (id=${emailResult.id})`);
        } else {
          console.error(`Email send failed:`, emailResult.error, emailResult.details);
          await supabase
            .from("newsletter_digests")
            .update({ status: "failed" })
            .eq("id", digest.id);
        }
      } catch (emailErr) {
        console.error("Email error:", emailErr);
      }
    } else {
      console.warn("⚠️ RESEND_API_KEY not configured — digest saved but not emailed");
    }

    return new Response(
      JSON.stringify({
        success: true,
        digest_type: digestType,
        subject,
        email_sent: emailSent,
        digest_id: digest.id,
        stats_summary: {
          patients: stats.totalPatients,
          articles: stats.publishedArticles,
          pipeline: stats.pipelineItems,
          active_users_24h: stats.activeUsers,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Newsletter digest error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
