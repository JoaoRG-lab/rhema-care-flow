import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import { verifyJWT } from '../_shared/auth.ts';
import { checkRateLimit, getClientIp } from '../_shared/rateLimit.ts';

const FUNCTION_VERSION = 'rhema-care-v2.0';

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const ip = getClientIp(req);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(origin) });
  if (req.method !== 'POST') return jsonResponse({ error: 'Metodo nao permitido.' }, 405, origin);

  const auth = await verifyJWT(req);
  if (!auth) return jsonResponse({ error: 'Nao autorizado.' }, 401, origin);

  if (!checkRateLimit(`signout-all:${auth.userId}:${ip}`, 5, 60_000)) {
    return jsonResponse({ error: 'Muitas tentativas. Aguarde.' }, 429, origin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json().catch(() => ({}));
    // Admin pode deslogar outro usuario; usuario comum so pode deslogar a si mesmo
    const targetUserId = body?.target_user_id ?? auth.userId;

    // Se alvo diferente do solicitante, exige role admin
    if (targetUserId !== auth.userId) {
      const { data: roleData } = await adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', auth.userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        return jsonResponse({ error: 'Acesso negado: requer role admin para deslogar outro usuario.' }, 403, origin);
      }
    }

    // Invalida todas as sessoes do usuario alvo
    const { error } = await adminClient.auth.admin.signOut(targetUserId, 'global');

    if (error) {
      console.error('admin-signout-all-sessions error', error.message);
      return jsonResponse({ error: 'Falha ao encerrar sessoes.' }, 502, origin);
    }

    // Audit log
    await adminClient.from('audit_logs').insert({
      user_id: auth.userId,
      action: 'signout_all_sessions',
      resource_type: 'auth',
      metadata: { target_user_id: targetUserId, requested_by: auth.userId },
    }).then(({ error: e }) => { if (e) console.warn('audit log error', e.message); });

    console.log('admin-signout-all-sessions ok', { requestedBy: auth.userId, targetUserId });

    return jsonResponse({
      ok: true,
      message: 'Todas as sessoes do usuario foram encerradas.',
      target_user_id: targetUserId,
      version: FUNCTION_VERSION,
    }, 200, origin);

  } catch (error) {
    console.error('admin-signout-all-sessions erro interno', error instanceof Error ? error.message : String(error));
    return jsonResponse({ error: 'Erro interno.' }, 500, origin);
  }
});
