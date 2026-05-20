import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { message, context, patient_id, session_id } = await req.json()
    if (!message) {
      return new Response(JSON.stringify({ error: 'message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Busca histórico da sessão (últimas 10 mensagens)
    let history: { role: string; content: string }[] = []
    if (session_id) {
      const { data: prev } = await supabase
        .from('ai_conversations')
        .select('role, content')
        .eq('session_id', session_id)
        .order('created_at', { ascending: true })
        .limit(10)
      if (prev) history = prev
    }

    // System prompt contextualizado para saúde
    const systemPrompt = `Você é um assistente clínico especializado do sistema Rhema Care Flow.
Seu papel é auxiliar médicos e profissionais de saúde com:
- Análise de dados clínicos e prontuários
- Interpretação de scores e calculadoras clínicas (CDAI, DAS28, SLEDAI, etc.)
- Sugestões baseadas em evidências (não substitui julgamento clínico)
- Educação médica continuada

Sempre cite fontes quando relevante. Nunca faça diagnósticos definitivos.
Contexto do paciente: ${context ?? 'não fornecido'}`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ]

    // Chama OpenAI GPT-4o com fallback
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) throw new Error('OPENAI_API_KEY not configured')

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 1500,
        temperature: 0.3, // baixa temperatura para respostas clínicas precisas
      }),
    })

    if (!aiResponse.ok) {
      const err = await aiResponse.text()
      throw new Error(`OpenAI error: ${err}`)
    }

    const aiData = await aiResponse.json()
    const assistantMessage = aiData.choices[0].message.content

    // Persiste conversa no banco
    const newSessionId = session_id ?? crypto.randomUUID()
    const insertRows = [
      {
        session_id: newSessionId,
        user_id: user.id,
        patient_id: patient_id ?? null,
        role: 'user',
        content: message,
      },
      {
        session_id: newSessionId,
        user_id: user.id,
        patient_id: patient_id ?? null,
        role: 'assistant',
        content: assistantMessage,
      },
    ]

    await supabase.from('ai_conversations').insert(insertRows)

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        session_id: newSessionId,
        model: 'gpt-4o',
        tokens_used: aiData.usage?.total_tokens ?? 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('ai-chat error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
