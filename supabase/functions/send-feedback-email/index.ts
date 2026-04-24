import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createResendClient, sendEmail } from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, name, email, message } = await req.json();

    if (!category || !message) {
      return new Response(
        JSON.stringify({ error: "Category and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const categoryEmoji: Record<string, string> = {
      criticism: "🔥 Criticism",
      suggestion: "💡 Suggestion",
      praise: "🌟 Praise",
      lottery: "🎰 Lottery Numbers",
      kidding: "😜 Just Kidding",
    };

    const subject = `[UHS Tell Us] ${categoryEmoji[category] || category} from ${name || "Anonymous"}`;
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New Feedback Received</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Category:</td><td style="padding: 8px;">${categoryEmoji[category] || category}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Name:</td><td style="padding: 8px;">${name || "Anonymous"}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Email:</td><td style="padding: 8px;">${email || "Not provided"}</td></tr>
        </table>
        <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
          <p style="margin: 0; white-space: pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        </div>
        <p style="margin-top: 24px; color: #999; font-size: 12px;">Sent from UHS Health OS — Tell Us section</p>
      </div>
    `;

    const result = await sendEmail(createResendClient(), {
      from: "UHS Feedback <onboarding@resend.dev>",
      to: "novvsoriens@gmail.com",
      subject,
      html: htmlBody,
    });

    if (!result.ok) {
      console.error("Resend error:", result.error, result.details);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: result.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
