import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { getCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import { verifyJWT } from '../_shared/auth.ts';
import { checkRateLimit, getClientIp } from '../_shared/rateLimit.ts';

const FUNCTION_VERSION = 'rhema-care-v2.0';
const MEMED_AUTH_URL = 'https://api.memed.com.br/v1/sinapse-prescricao/auth';

serve(async (req) => {
  const origin = req.headers.get('origin');
  const ip = getClientIp(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Metodo nao permitido.' }, 405, origin);
  }

  // Auth JWT obrigatorio
  const auth = await verifyJWT(req);
  if (!auth) {
    return jsonResponse({ error: 'Nao autorizado.' }, 401, origin);
  }

  if (!checkRateLimit(`memed:${auth.userId}:${ip}`, 10, 60_000)) {
    return jsonResponse({ error: 'Muitas requisicoes. Aguarde.' }, 429, origin);
  }

  try {
    const { crm, uf, specialty } = await req.json();

    if (!crm || !uf) {
      return jsonResponse({ error: 'Campos obrigatorios: crm, uf.' }, 400, origin);
    }

    // Validacao simples de CRM e UF
    if (!/^\d{4,7}$/.test(String(crm))) {
      return jsonResponse({ error: 'CRM invalido. Use apenas numeros (4-7 digitos).' }, 400, origin);
    }

    const validUFs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
    if (!validUFs.includes(String(uf).toUpperCase())) {
      return jsonResponse({ error: 'UF invalida.' }, 400, origin);
    }

    const memedApiKey = Deno.env.get('MEMED_API_KEY');
    if (!memedApiKey) {
      console.error('memed-token: MEMED_API_KEY nao configurada');
      return jsonResponse({ error: 'Servico de prescricao nao configurado.' }, 503, origin);
    }

    const memedResp = await fetch(MEMED_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${memedApiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: 'auth',
          attributes: {
            login: String(crm),
            cpf: auth.userId,
            estado: String(uf).toUpperCase(),
            especialidade: specialty ? String(specialty).slice(0, 80) : 'Clinica Medica',
          },
        },
      }),
    });

    if (!memedResp.ok) {
      const err = await memedResp.text();
      console.error('memed-token API error', { status: memedResp.status, err: err.slice(0, 200) });
      return jsonResponse({ error: 'Falha ao autenticar com Memed.' }, 502, origin);
    }

    const data = await memedResp.json();
    const token = data?.data?.attributes?.token;

    if (!token) {
      console.error('memed-token: token nao retornado', data);
      return jsonResponse({ error: 'Token Memed nao obtido.' }, 502, origin);
    }

    console.log('memed-token ok', { userId: auth.userId, uf });

    return jsonResponse({
      token,
      meta: { function: 'memed-token', version: FUNCTION_VERSION },
    }, 200, origin);

  } catch (error) {
    console.error('memed-token erro interno', error instanceof Error ? error.message : String(error));
    return jsonResponse({ error: 'Erro interno.' }, 500, origin);
  }
});
