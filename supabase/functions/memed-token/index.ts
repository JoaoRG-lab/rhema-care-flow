import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MEMED_API_KEY = Deno.env.get('MEMED_API_KEY') ?? ''
const MEMED_SECRET_KEY = Deno.env.get('MEMED_SECRET_KEY') ?? ''

// Ambiente: production usa partners.memed.com.br, homologação usa integrations.api.memed.com.br
const MEMED_API_BASE = Deno.env.get('MEMED_ENV') === 'production'
  ? 'https://api.memed.com.br/v1'
  : 'https://integrations.api.memed.com.br/v1'

const MEMED_SCRIPT_URL = Deno.env.get('MEMED_ENV') === 'production'
  ? 'https://partners.memed.com.br/integration.js'
  : 'https://integrations.memed.com.br/modulos/plataforma.sinapse-prescricao/build/sinapse-prescricao.min.js'

function memedUrl(path: string) {
  return `${MEMED_API_BASE}${path}?api-key=${MEMED_API_KEY}&secret-key=${MEMED_SECRET_KEY}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Autenticar o usuário Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Buscar perfil do médico
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, crm, cpf, phone, specialty, city, state')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Perfil não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verificar se já temos memed_user_id salvo para este médico
    const { data: memedRecord } = await supabase
      .from('memed_users')
      .select('memed_user_id, token')
      .eq('user_id', user.id)
      .maybeSingle()

    let memedToken: string | null = null

    if (memedRecord?.memed_user_id) {
      // Buscar token existente
      const getRes = await fetch(memedUrl(`/sinapse-prescricao/usuarios/${memedRecord.memed_user_id}`), {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/json',
        },
      })
      if (getRes.ok) {
        const body = await getRes.json()
        memedToken = body?.data?.attributes?.token ?? body?.token ?? null
      }
    }

    if (!memedToken) {
      // Criar ou atualizar usuário na Memed
      const payload = {
        data: {
          type: 'usuarios',
          attributes: {
            external_id: user.id,
            nome: profile.full_name ?? user.email ?? 'Médico',
            email: user.email,
            crm: profile.crm ?? '',
            cpf: profile.cpf ?? '',
            celular: profile.phone ?? '',
            especialidade: profile.specialty ?? 'Reumatologia',
            cidade: profile.city ?? '',
            uf: profile.state ?? '',
          },
        },
      }

      const postRes = await fetch(memedUrl('/sinapse-prescricao/usuarios'), {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const postBody = await postRes.json()

      if (!postRes.ok) {
        console.error('Memed POST error:', JSON.stringify(postBody))
        return new Response(JSON.stringify({ error: 'Erro ao criar usuário Memed', details: postBody }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const memedUserId = postBody?.data?.id ?? postBody?.id ?? null
      memedToken = postBody?.data?.attributes?.token ?? postBody?.token ?? null

      // Salvar memed_user_id para futuros logins
      if (memedUserId) {
        await supabase.from('memed_users').upsert({
          user_id: user.id,
          memed_user_id: memedUserId,
          token: memedToken,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      }
    }

    if (!memedToken) {
      return new Response(JSON.stringify({ error: 'Token Memed não obtido' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ token: memedToken, scriptUrl: MEMED_SCRIPT_URL }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('memed-token error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
