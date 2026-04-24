import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!MP_TOKEN) throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    // Mercado Pago sends { type: 'payment', data: { id } } OR query params (?topic=payment&id=...)
    const paymentId =
      body?.data?.id ||
      body?.resource?.toString().split("/").pop() ||
      url.searchParams.get("id") ||
      url.searchParams.get("data.id");

    const topic = body?.type || body?.topic || url.searchParams.get("topic") || url.searchParams.get("type");

    if (!paymentId || (topic && topic !== "payment")) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch payment details from MP
    const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    });
    const payment = await mpResp.json();
    if (!mpResp.ok) {
      console.error("MP fetch error:", payment);
      return new Response(JSON.stringify({ error: "MP fetch failed" }), {
        status: 200, // ack so MP doesn't retry forever
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const externalId = String(payment.id);
    const status = payment.status as string; // approved, pending, rejected, cancelled

    // Find local transaction
    const { data: tx, error: txError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("external_id", externalId)
      .maybeSingle();

    if (txError) console.error("tx lookup error:", txError);
    if (!tx) {
      console.warn("Transaction not found for external_id", externalId);
      return new Response(JSON.stringify({ ok: true, notFound: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: only credit once when going from non-paid to approved
    if (status === "approved" && tx.status !== "paid") {
      // Upsert credits row
      const { data: creditRow } = await supabase
        .from("user_ai_credits")
        .select("*")
        .eq("user_id", tx.user_id)
        .maybeSingle();

      if (creditRow) {
        await supabase
          .from("user_ai_credits")
          .update({ credits_balance: creditRow.credits_balance + tx.credits_amount })
          .eq("user_id", tx.user_id);
      } else {
        await supabase.from("user_ai_credits").insert({
          user_id: tx.user_id,
          credits_balance: tx.credits_amount,
        });
      }

      await supabase
        .from("payment_transactions")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", tx.id);
    } else if (status === "rejected" || status === "cancelled") {
      await supabase
        .from("payment_transactions")
        .update({ status: status })
        .eq("id", tx.id);
    }

    return new Response(JSON.stringify({ ok: true, status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("mercadopago-webhook error:", error);
    // Return 200 so MP doesn't keep retrying on bugs
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
