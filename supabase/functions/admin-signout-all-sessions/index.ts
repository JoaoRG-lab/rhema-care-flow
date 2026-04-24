import { corsHeaders } from '@supabase/supabase-js/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const BodySchema = z.object({
  email: z.string().trim().email().max(255),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify caller's JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service-role client for role check + admin actions
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: isAdminData, error: roleErr } = await admin.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin',
    });
    if (roleErr || !isAdminData) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const targetEmail = parsed.data.email.toLowerCase();

    // Look up target user by email
    let targetUserId: string | null = null;
    let page = 1;
    while (page <= 20) {
      const { data: list, error: listErr } = await admin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (listErr) break;
      const found = list.users.find((u) => u.email?.toLowerCase() === targetEmail);
      if (found) {
        targetUserId = found.id;
        break;
      }
      if (list.users.length < 200) break;
      page += 1;
    }

    // Always return generic success to avoid revealing account existence
    if (!targetUserId) {
      // Audit attempt
      await admin.from('audit_logs').insert({
        user_id: userData.user.id,
        action: 'admin_signout_all_sessions_no_match',
        resource_type: 'auth_user',
        metadata: { target_email_hash: await hashEmail(targetEmail) },
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Revoke all refresh tokens / sessions for the target user
    const { error: signOutErr } = await admin.auth.admin.signOut(targetUserId, 'global');
    if (signOutErr) {
      console.error('signOut error', signOutErr);
      return new Response(JSON.stringify({ error: 'Failed to revoke sessions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await admin.from('audit_logs').insert({
      user_id: userData.user.id,
      action: 'admin_signout_all_sessions',
      resource_type: 'auth_user',
      resource_id: targetUserId,
      metadata: { target_email_hash: await hashEmail(targetEmail) },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function hashEmail(email: string): Promise<string> {
  const buf = new TextEncoder().encode(email);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
