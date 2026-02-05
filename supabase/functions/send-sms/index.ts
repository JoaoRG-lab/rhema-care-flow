 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 // Zod schema for request validation
 const SendSmsRequestSchema = z.object({
   to: z.string()
     .min(10, "Phone number must be at least 10 digits")
     .max(20, "Phone number too long")
     .regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number format (use E.164: +1234567890)"),
   message: z.string()
     .min(1, "Message cannot be empty")
     .max(1600, "Message exceeds SMS limit (1600 chars)"),
   from: z.string()
     .regex(/^\+?[1-9]\d{9,14}$/, "Invalid 'from' phone number")
     .optional(),
 });
 
 serve(async (req) => {
   // Handle CORS preflight
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     // Validate environment variables
     const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
     const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
     const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
     const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
 
     if (!TWILIO_ACCOUNT_SID) {
       throw new Error("TWILIO_ACCOUNT_SID is not configured");
     }
     if (!TWILIO_AUTH_TOKEN) {
       throw new Error("TWILIO_AUTH_TOKEN is not configured");
     }
     if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
       throw new Error("Supabase configuration missing");
     }
 
     // Verify JWT authentication
     const authHeader = req.headers.get("Authorization");
     if (!authHeader?.startsWith("Bearer ")) {
       return new Response(
         JSON.stringify({ error: "Unauthorized - missing or invalid token" }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
       global: { headers: { Authorization: authHeader } },
     });
 
     const { data: claimsData, error: claimsError } = await supabase.auth.getUser();
     if (claimsError || !claimsData?.user) {
       return new Response(
         JSON.stringify({ error: "Unauthorized - invalid token" }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const userId = claimsData.user.id;
     console.log(`SMS request from user: ${userId}`);
 
     // Parse and validate request body
     let body: unknown;
     try {
       body = await req.json();
     } catch {
       return new Response(
         JSON.stringify({ error: "Invalid JSON body" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Validate with Zod
     const validationResult = SendSmsRequestSchema.safeParse(body);
     if (!validationResult.success) {
       return new Response(
         JSON.stringify({
           error: "Validation failed",
           details: validationResult.error.errors.map((e) => ({
             field: e.path.join("."),
             message: e.message,
           })),
         }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const { to, message, from } = validationResult.data;
 
     // Twilio API URL
     const TWILIO_API_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
 
     // Create Basic Auth header (Twilio requires Account SID:Auth Token)
     const basicAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
 
     // Prepare form data for Twilio
     const formData = new URLSearchParams();
     formData.append("To", to);
     formData.append("Body", message);
     
     // Use provided 'from' number or a default (you may want to set a TWILIO_PHONE_NUMBER env var)
     const fromNumber = from || Deno.env.get("TWILIO_PHONE_NUMBER");
     if (!fromNumber) {
       return new Response(
         JSON.stringify({ error: "No 'from' phone number provided and TWILIO_PHONE_NUMBER not configured" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
     formData.append("From", fromNumber);
 
     // Call Twilio API
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
       console.error("Twilio API error:", twilioData);
       return new Response(
         JSON.stringify({
           error: "Failed to send SMS",
           details: twilioData.message || "Unknown Twilio error",
           code: twilioData.code,
         }),
         { status: twilioResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     console.log(`SMS sent successfully. SID: ${twilioData.sid}`);
 
     return new Response(
       JSON.stringify({
         success: true,
         messageSid: twilioData.sid,
         status: twilioData.status,
         to: twilioData.to,
       }),
       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
 
   } catch (error: unknown) {
     console.error("Send SMS error:", error);
     const errorMessage = error instanceof Error ? error.message : "Unknown error";
     return new Response(
       JSON.stringify({ error: errorMessage }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });