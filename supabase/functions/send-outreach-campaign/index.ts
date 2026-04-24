import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend, sendEmail } from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendCampaignRequest {
  campaignId: string;
  testMode?: boolean;
  testEmail?: string;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(resendApiKey);
    const { campaignId, testMode, testEmail }: SendCampaignRequest = await req.json();

    if (!campaignId) {
      return new Response(JSON.stringify({ error: "Campaign ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("outreach_campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .single();

    if (campaignError || !campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Test mode - send to single email
    if (testMode && testEmail) {
      const result = await sendEmail(resend, {
        from: `${campaign.sender_name} <${campaign.sender_email}>`,
        to: testEmail,
        subject: `[TEST] ${campaign.email_subject}`,
        html: campaign.email_body,
      });

      return new Response(JSON.stringify({
        success: result.ok,
        testMode: true,
        messageId: result.id,
        error: result.error,
      }), {
        status: result.ok ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get contacts for the campaign based on target audience
    let contactsQuery = supabase
      .from("outreach_contacts")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active");

    // Filter by organization type if specified in target_audience
    const targetAudience = campaign.target_audience || [];
    if (targetAudience.length > 0) {
      contactsQuery = contactsQuery.in("organization_type", targetAudience);
    }

    const { data: contacts, error: contactsError } = await contactsQuery;

    if (contactsError) {
      return new Response(JSON.stringify({ error: "Failed to fetch contacts" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!contacts || contacts.length === 0) {
      return new Response(JSON.stringify({ error: "No contacts found for this campaign" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update campaign status to active
    await supabase
      .from("outreach_campaigns")
      .update({ status: "active", started_at: new Date().toISOString() })
      .eq("id", campaignId);

    // Send emails and track
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const contact of contacts) {
      try {
        // Replace placeholders in email
        let emailBody = campaign.email_body;
        let emailSubject = campaign.email_subject;
        
        const replacements: Record<string, string> = {
          "{{name}}": contact.name || "Dear Professional",
          "{{organization}}": contact.organization || "your organization",
          "{{position}}": contact.position || "",
          "{{email}}": contact.email,
        };

        for (const [placeholder, value] of Object.entries(replacements)) {
          emailBody = emailBody.replace(new RegExp(placeholder, "g"), value);
          emailSubject = emailSubject.replace(new RegExp(placeholder, "g"), value);
        }

        // Send email
        const emailResult = await sendEmail(resend, {
          from: `${campaign.sender_name} <${campaign.sender_email}>`,
          to: contact.email,
          subject: emailSubject,
          html: emailBody,
        });

        if (!emailResult.ok) throw new Error(emailResult.error ?? "send failed");

        // Create send record
        await supabase.from("outreach_sends").insert({
          campaign_id: campaignId,
          contact_id: contact.id,
          status: "sent",
          sent_at: new Date().toISOString(),
          resend_message_id: emailResult.id,
        });

        results.sent++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`${contact.email}: ${err.message}`);

        // Record failed send
        await supabase.from("outreach_sends").insert({
          campaign_id: campaignId,
          contact_id: contact.id,
          status: "failed",
          error_message: err.message,
        });
      }
    }

    // Update campaign status based on results
    const finalStatus = results.failed === contacts.length ? "failed" : "completed";
    await supabase
      .from("outreach_campaigns")
      .update({ 
        status: finalStatus, 
        completed_at: new Date().toISOString() 
      })
      .eq("id", campaignId);

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      totalContacts: contacts.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in send-outreach-campaign:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);