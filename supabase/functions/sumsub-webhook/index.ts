import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-payload-digest, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Verification tier mapping based on Sumsub review results
const VERIFICATION_TIERS: Record<string, string> = {
  "basic-kyc-level": "verified",
  "professional-verification": "expert",
  "institutional-verification": "institutional",
};

interface SumsubWebhookPayload {
  type: string;
  reviewResult?: {
    reviewAnswer: "GREEN" | "RED" | "YELLOW";
    rejectLabels?: string[];
    reviewRejectType?: string;
    moderationComment?: string;
  };
  reviewStatus?: string;
  applicantId: string;
  externalUserId: string;
  levelName?: string;
  createdAt?: string;
  clientId?: string;
  inspectionId?: string;
  correlationId?: string;
  sandboxMode?: boolean;
}

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secretKey: string
): boolean {
  const hmac = createHmac("sha256", secretKey);
  hmac.update(payload);
  const expectedSignature = hmac.digest("hex");
  return signature === expectedSignature;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUMSUB_SECRET_KEY = Deno.env.get("SUMSUB_SECRET_KEY");
    if (!SUMSUB_SECRET_KEY) {
      throw new Error("SUMSUB_SECRET_KEY is not configured");
    }

    // Get raw body for signature verification
    const rawBody = await req.text();
    
    // Verify webhook signature
    const digestHeader = req.headers.get("x-payload-digest");
    if (!digestHeader) {
      console.error("Missing webhook signature");
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = verifyWebhookSignature(rawBody, digestHeader, SUMSUB_SECRET_KEY);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: SumsubWebhookPayload = JSON.parse(rawBody);
    console.log("Sumsub webhook received:", payload.type, "for user:", payload.externalUserId);

    // Initialize Supabase with service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase: any = createClient(supabaseUrl, serviceRoleKey);

    const userId = payload.externalUserId;

    // Handle different webhook types
    switch (payload.type) {
      case "applicantReviewed":
      case "applicantPending":
        await handleReviewUpdate(supabase, payload);
        break;

      case "applicantCreated":
        console.log(`Applicant created for user ${userId}`);
        // Update verification request status to pending
        await supabase
          .from("verification_requests")
          .update({
            status: "pending",
            sumsub_applicant_id: payload.applicantId,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("status", "pending");
        break;

      case "applicantOnHold":
        await supabase
          .from("verification_requests")
          .update({
            status: "pending",
            admin_notes: "Verification on hold - additional review required",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
        break;

      default:
        console.log(`Unhandled webhook type: ${payload.type}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error processing Sumsub webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleReviewUpdate(
  supabase: ReturnType<typeof createClient>,
  payload: SumsubWebhookPayload
) {
  const userId = payload.externalUserId;
  const reviewResult = payload.reviewResult;
  const levelName = payload.levelName || "basic-kyc-level";

  if (!reviewResult) {
    console.log("No review result in payload");
    return;
  }

  const reviewAnswer = reviewResult.reviewAnswer;
  console.log(`Review result for ${userId}: ${reviewAnswer}`);

  if (reviewAnswer === "GREEN") {
    // Verification approved
    const tier = VERIFICATION_TIERS[levelName] || "verified";

    // Update verification request
    await supabase
      .from("verification_requests")
      .update({
        status: "approved",
        sumsub_applicant_id: payload.applicantId,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // Update user profile with verification tier
    await supabase
      .from("profiles")
      .update({
        verification_tier: tier,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    console.log(`User ${userId} verified with tier: ${tier}`);

  } else if (reviewAnswer === "RED") {
    // Verification rejected
    const rejectReason = reviewResult.rejectLabels?.join(", ") || 
                         reviewResult.moderationComment || 
                         "Verification failed";

    await supabase
      .from("verification_requests")
      .update({
        status: "rejected",
        sumsub_applicant_id: payload.applicantId,
        admin_notes: `Rejected: ${rejectReason}`,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    console.log(`User ${userId} verification rejected: ${rejectReason}`);

  } else if (reviewAnswer === "YELLOW") {
    // Needs additional review
    await supabase
      .from("verification_requests")
      .update({
        status: "pending",
        sumsub_applicant_id: payload.applicantId,
        admin_notes: "Additional manual review required",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    console.log(`User ${userId} needs manual review`);
  }
}
