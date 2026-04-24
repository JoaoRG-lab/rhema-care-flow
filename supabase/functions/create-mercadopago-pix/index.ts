import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PACKAGES: Record<string, { credits: number; amount: number; label: string }> = {
  starter: { credits: 50, amount: 1.5, label: "50 créditos" },
  standard: { credits: 200, amount: 6.0, label: "200 créditos" },
  pro: { credits: 500, amount: 15.0, label: "500 créditos" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!MP_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const { packageId } = await req.json();
    const pkg = PACKAGES[packageId];
    if (!pkg) {
      return new Response(JSON.stringify({ error: "Invalid package" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const idempotencyKey = crypto.randomUUID();
    const expiration = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const webhookUrl = `${SUPABASE_URL}/functions/v1/mercadopago-webhook`;

    const mpResp = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_TOKEN}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: pkg.amount,
        description: `${pkg.label} — AI Assistant`,
        payment_method_id: "pix",
        date_of_expiration: expiration,
        notification_url: webhookUrl,
        external_reference: `${user.id}:${packageId}`,
        payer: {
          email: user.email || `user-${user.id}@uhs.local`,
          first_name: "User",
        },
      }),
    });

    const mpData = await mpResp.json();
    if (!mpResp.ok) {
      console.error("Mercado Pago error:", mpData);
      return new Response(
        JSON.stringify({ error: "Failed to create PIX payment", details: mpData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code;
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64;
    const ticketUrl = mpData.point_of_interaction?.transaction_data?.ticket_url;

    const { data: tx, error: insertError } = await supabase
      .from("payment_transactions")
      .insert({
        user_id: user.id,
        provider: "mercadopago",
        payment_method: "pix",
        external_id: String(mpData.id),
        amount_brl: pkg.amount,
        credits_amount: pkg.credits,
        package_label: pkg.label,
        status: "pending",
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        ticket_url: ticketUrl,
        expires_at: expiration,
        metadata: { mp_status: mpData.status },
      })
      .select()
      .single();

    if (insertError) {
      console.error("DB insert error:", insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        transactionId: tx.id,
        qrCode,
        qrCodeBase64,
        ticketUrl,
        expiresAt: expiration,
        amount: pkg.amount,
        credits: pkg.credits,
        label: pkg.label,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("create-mercadopago-pix error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
