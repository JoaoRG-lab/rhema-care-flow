import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createResendClient, sendEmail } from "../_shared/resend.ts";

const resend = createResendClient();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendReportRequest {
  recipientEmail: string;
  recipientName: string;
  recipientType: 'patient' | 'physician';
  patientName: string;
  reportType: string;
  pdfBase64: string;
  senderName?: string;
  additionalMessage?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid session" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const {
      recipientEmail,
      recipientName,
      recipientType,
      patientName,
      reportType,
      pdfBase64,
      senderName,
      additionalMessage,
    }: SendReportRequest = await req.json();

    // Validate required fields
    if (!recipientEmail || !patientName || !reportType || !pdfBase64) {
      throw new Error("Missing required fields: recipientEmail, patientName, reportType, pdfBase64");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      throw new Error("Invalid email format");
    }

    // Build email subject and body based on recipient type
    const isPatient = recipientType === 'patient';
    const subject = isPatient
      ? `Your ${reportType} Report from RheumaFlow`
      : `Patient Report: ${patientName} - ${reportType}`;

    const safeRecipientName = recipientName ? escapeHtml(recipientName) : "";
    const safePatientName = escapeHtml(patientName);
    const safeReportType = escapeHtml(reportType);
    const safeSenderName = senderName ? escapeHtml(senderName) : "";
    const safeAdditionalMessage = additionalMessage ? escapeHtml(additionalMessage) : "";

    const greeting = safeRecipientName ? `Dear ${safeRecipientName},` : 'Hello,';
    
    const bodyIntro = isPatient
      ? `Please find attached your ${safeReportType} report.`
      : `Please find attached the ${safeReportType} report for patient ${safePatientName}.`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .content {
              background: #f8fafc;
              padding: 24px;
              border: 1px solid #e2e8f0;
              border-top: none;
              border-radius: 0 0 8px 8px;
            }
            .message-box {
              background: white;
              border-left: 4px solid #0ea5e9;
              padding: 12px 16px;
              margin: 16px 0;
              border-radius: 0 4px 4px 0;
            }
            .footer {
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px solid #e2e8f0;
              font-size: 12px;
              color: #64748b;
              text-align: center;
            }
            .disclaimer {
              font-size: 11px;
              color: #94a3b8;
              margin-top: 16px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">RheumaFlow</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">${safeReportType} Report</p>
          </div>
          <div class="content">
            <p>${greeting}</p>
            <p>${bodyIntro}</p>
            ${safeAdditionalMessage ? `
              <div class="message-box">
                <strong>Message from your healthcare provider:</strong>
                <p style="margin: 8px 0 0 0;">${safeAdditionalMessage}</p>
              </div>
            ` : ''}
            <p>The PDF report is attached to this email for your records.</p>
            ${safeSenderName ? `<p>Best regards,<br><strong>${safeSenderName}</strong></p>` : '<p>Best regards,<br>The RheumaFlow Team</p>'}
            <div class="footer">
              <p>This email was sent via RheumaFlow Clinical Workflow System</p>
              <p class="disclaimer">
                This email and any attachments contain confidential medical information intended only for the named recipient. 
                If you received this in error, please delete it immediately and notify the sender.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Convert base64 to buffer for attachment
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
    
    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedPatientName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sanitizedPatientName}_${reportType.replace(/\s+/g, '_')}_${timestamp}.pdf`;

    const emailResponse = await sendEmail(resend, {
      from: "RheumaFlow <noreply@rheumaflow.com>", // Replace with your verified domain
      to: recipientEmail,
      subject,
      html: htmlContent,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    if (!emailResponse.ok) {
      console.error("Report email failed:", emailResponse.error, emailResponse.details);
      return new Response(
        JSON.stringify({ success: false, error: emailResponse.error }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Report email sent successfully:", emailResponse.id);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: emailResponse.id,
        message: `Report sent successfully to ${recipientEmail}`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-report-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
