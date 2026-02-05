 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
     const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
     const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
     const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
     const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 
     if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
       console.log("Twilio not configured, skipping SMS processing");
       return new Response(
         JSON.stringify({ success: true, message: "Twilio not configured", processed: 0 }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
       throw new Error("Supabase configuration missing");
     }
 
     // Use service role to access all users' scheduled SMS
     const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
 
     // Get pending SMS messages that are due
     const now = new Date().toISOString();
     const { data: pendingSms, error: fetchError } = await supabase
       .from("scheduled_sms")
       .select("*")
       .eq("status", "pending")
       .lte("scheduled_for", now)
       .order("scheduled_for", { ascending: true })
       .limit(50);
 
     if (fetchError) {
       throw new Error(`Failed to fetch pending SMS: ${fetchError.message}`);
     }
 
     if (!pendingSms || pendingSms.length === 0) {
       return new Response(
         JSON.stringify({ success: true, message: "No pending SMS", processed: 0 }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     console.log(`Processing ${pendingSms.length} scheduled SMS messages`);
 
     const TWILIO_API_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
     const basicAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
 
     const results = await Promise.allSettled(
       pendingSms.map(async (sms) => {
         try {
           const formData = new URLSearchParams();
           formData.append("To", sms.phone_number);
           formData.append("Body", sms.message);
           formData.append("From", TWILIO_PHONE_NUMBER);
 
           const twilioResponse = await fetch(TWILIO_API_URL, {
             method: "POST",
             headers: {
               "Authorization": `Basic ${basicAuth}`,
               "Content-Type": "application/x-www-form-urlencoded",
             },
             body: formData.toString(),
           });
 
           const twilioData = await twilioResponse.json();
 
           if (!twilioResponse.ok) {
             throw new Error(twilioData.message || "Twilio error");
           }
 
           // Mark as sent
           await supabase
             .from("scheduled_sms")
             .update({
               status: "sent",
               sent_at: new Date().toISOString(),
             })
             .eq("id", sms.id);
 
           return { id: sms.id, status: "sent" };
         } catch (error: unknown) {
           const errorMessage = error instanceof Error ? error.message : "Unknown error";
           
           // Mark as failed
           await supabase
             .from("scheduled_sms")
             .update({
               status: "failed",
               error_message: errorMessage,
             })
             .eq("id", sms.id);
 
           return { id: sms.id, status: "failed", error: errorMessage };
         }
       })
     );
 
     const sent = results.filter(r => r.status === "fulfilled" && (r.value as any).status === "sent").length;
     const failed = results.filter(r => r.status === "rejected" || (r.status === "fulfilled" && (r.value as any).status === "failed")).length;
 
     console.log(`Processed: ${sent} sent, ${failed} failed`);
 
     return new Response(
       JSON.stringify({
         success: true,
         processed: pendingSms.length,
         sent,
         failed,
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error: unknown) {
     console.error("Process scheduled SMS error:", error);
     const errorMessage = error instanceof Error ? error.message : "Unknown error";
     return new Response(
       JSON.stringify({ error: errorMessage }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });