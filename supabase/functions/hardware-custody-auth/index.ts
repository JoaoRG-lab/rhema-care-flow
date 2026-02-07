import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ULTIMATE_USER_EMAIL = "orienta@novusoriens.org";

// SHA-256 hash function
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Verify Ed25519 signature (for hardware wallet authentication)
async function verifyEd25519Signature(
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Uint8Array.from(
      signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );
    const publicKeyBytes = Uint8Array.from(
      publicKey.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      publicKeyBytes,
      { name: "Ed25519" },
      false,
      ["verify"]
    );

    return await crypto.subtle.verify(
      { name: "Ed25519" },
      cryptoKey,
      signatureBytes,
      messageBytes
    );
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify Ultimate User
    if (user.email !== ULTIMATE_USER_EMAIL) {
      return new Response(
        JSON.stringify({ error: "Access denied. Hardware custody is reserved for Ultimate User only." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, ...params } = await req.json();
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    switch (action) {
      case "get_custody_status": {
        // Get current custody state
        const { data: custody, error } = await supabase
          .from("ultimate_user_custody")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        return new Response(
          JSON.stringify({
            success: true,
            custody: custody ? {
              installation_status: custody.installation_status,
              hardware_type: custody.hardware_type,
              hardware_pubkey: custody.hardware_pubkey ? 
                `${custody.hardware_pubkey.slice(0, 8)}...${custody.hardware_pubkey.slice(-8)}` : null,
              transfer_completed_at: custody.transfer_completed_at,
              derivation_path: custody.derivation_path,
              last_auth_at: custody.last_auth_at,
            } : null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "initiate_hardware_transfer": {
        // Check if already installed
        const { data: existing } = await supabase
          .from("ultimate_user_custody")
          .select("installation_status, hardware_pubkey")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing?.installation_status === "active") {
          return new Response(
            JSON.stringify({ error: "Hardware token already installed. No re-installation possible." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create or update custody record for hardware transfer
        const { data: custody, error } = await supabase
          .from("ultimate_user_custody")
          .upsert({
            user_id: user.id,
            installation_status: "awaiting_hardware",
            transfer_requested_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" })
          .select()
          .single();

        if (error) throw error;

        // Log the event
        await supabase.from("custody_audit_log").insert({
          custody_id: custody.id,
          action: "hardware_transfer_initiated",
          metadata: { user_agent: userAgent },
          ip_address: clientIp,
          user_agent: userAgent,
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: "Hardware transfer initiated. Connect your hardware wallet to proceed.",
            custody_id: custody.id,
            status: "awaiting_hardware",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "register_hardware_wallet": {
        const { hardware_pubkey, hardware_type, hardware_serial_hash } = params;

        if (!hardware_pubkey || !hardware_type) {
          return new Response(
            JSON.stringify({ error: "Missing hardware wallet information" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify custody is in awaiting_hardware state
        const { data: custody } = await supabase
          .from("ultimate_user_custody")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!custody || custody.installation_status === "active") {
          return new Response(
            JSON.stringify({ error: "Invalid custody state for hardware registration" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Hash the public key for commitment
        const pubkeyCommitment = await sha256(hardware_pubkey);

        // Update custody with hardware info
        const { error } = await supabase
          .from("ultimate_user_custody")
          .update({
            hardware_pubkey: hardware_pubkey,
            hardware_type: hardware_type,
            hardware_serial_hash: hardware_serial_hash || null,
            installation_status: "hardware_connected",
            seed_hash: pubkeyCommitment, // Use pubkey hash as the identity commitment
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (error) throw error;

        // Log the event
        await supabase.from("custody_audit_log").insert({
          custody_id: custody.id,
          action: "hardware_connected",
          metadata: { 
            hardware_type,
            pubkey_preview: `${hardware_pubkey.slice(0, 8)}...`,
          },
          ip_address: clientIp,
          user_agent: userAgent,
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: "Hardware wallet connected. Ready for token installation.",
            status: "hardware_connected",
            pubkey_commitment: pubkeyCommitment,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "complete_installation": {
        const { signature, challenge } = params;

        if (!signature || !challenge) {
          return new Response(
            JSON.stringify({ error: "Missing signature or challenge" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get custody record
        const { data: custody } = await supabase
          .from("ultimate_user_custody")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!custody || custody.installation_status !== "hardware_connected") {
          return new Response(
            JSON.stringify({ error: "Hardware must be connected before installation" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify the signature from hardware wallet
        const isValid = await verifyEd25519Signature(
          challenge,
          signature,
          custody.hardware_pubkey
        );

        if (!isValid) {
          // Log failed attempt
          await supabase
            .from("ultimate_user_custody")
            .update({ 
              failed_auth_attempts: custody.failed_auth_attempts + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);

          await supabase.from("custody_audit_log").insert({
            custody_id: custody.id,
            action: "installation_failed",
            metadata: { reason: "invalid_signature" },
            ip_address: clientIp,
            user_agent: userAgent,
          });

          return new Response(
            JSON.stringify({ error: "Invalid hardware signature. Installation failed." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Complete the installation - THIS IS PERMANENT
        const { error } = await supabase
          .from("ultimate_user_custody")
          .update({
            installation_status: "active",
            transfer_completed_at: new Date().toISOString(),
            last_auth_at: new Date().toISOString(),
            failed_auth_attempts: 0,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (error) throw error;

        // Log the permanent installation
        await supabase.from("custody_audit_log").insert({
          custody_id: custody.id,
          action: "token_installed",
          metadata: { 
            hardware_type: custody.hardware_type,
            permanent: true,
            message: "Ultimate User token permanently bound to hardware wallet",
          },
          ip_address: clientIp,
          user_agent: userAgent,
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: "✅ Ultimate User token PERMANENTLY installed on hardware wallet. This device is now the ONLY way to access Ultimate privileges.",
            status: "active",
            hardware_type: custody.hardware_type,
            installed_at: new Date().toISOString(),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "verify_hardware_auth": {
        const { signature, challenge } = params;

        // Get custody record
        const { data: custody } = await supabase
          .from("ultimate_user_custody")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!custody || custody.installation_status !== "active") {
          return new Response(
            JSON.stringify({ error: "Hardware token not installed", requires_hardware: true }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if locked
        if (custody.locked_until && new Date(custody.locked_until) > new Date()) {
          return new Response(
            JSON.stringify({ 
              error: "Account temporarily locked due to failed attempts",
              locked_until: custody.locked_until,
            }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify signature
        const isValid = await verifyEd25519Signature(
          challenge,
          signature,
          custody.hardware_pubkey
        );

        if (!isValid) {
          const newAttempts = custody.failed_auth_attempts + 1;
          const lockUntil = newAttempts >= 5 
            ? new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min lockout
            : null;

          await supabase
            .from("ultimate_user_custody")
            .update({ 
              failed_auth_attempts: newAttempts,
              locked_until: lockUntil,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);

          await supabase.from("custody_audit_log").insert({
            custody_id: custody.id,
            action: "auth_failed",
            metadata: { attempts: newAttempts, locked: !!lockUntil },
            ip_address: clientIp,
            user_agent: userAgent,
          });

          return new Response(
            JSON.stringify({ 
              error: "Invalid hardware signature",
              attempts_remaining: Math.max(0, 5 - newAttempts),
            }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Success - reset attempts and update last auth
        await supabase
          .from("ultimate_user_custody")
          .update({ 
            failed_auth_attempts: 0,
            locked_until: null,
            last_auth_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        await supabase.from("custody_audit_log").insert({
          custody_id: custody.id,
          action: "auth_success",
          metadata: { hardware_type: custody.hardware_type },
          ip_address: clientIp,
          user_agent: userAgent,
        });

        return new Response(
          JSON.stringify({
            success: true,
            authenticated: true,
            hardware_type: custody.hardware_type,
            message: "Hardware authentication successful",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error("Hardware custody auth error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
