import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, history = [], context = 'public_site' } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Mensagem inválida.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityKey) {
      return new Response(JSON.stringify({ error: 'PERPLEXITY_API_KEY não configurada.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const safeHistory: ChatMessage[] = Array.isArray(history)
      ? history
          .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
          .slice(-8)
          .map((item) => ({ role: item.role, content: item.content.slice(0, 1200) }))
      : [];

    const systemPrompt = `Você é o UHS Site Agent, assistente público do UHS Health OS / Protocolo Vida. Contexto: ${context}. Responda em português brasileiro, com clareza, sem inventar dados clínicos individuais, sem pedir dados pessoais sensíveis, e explique que o sistema apoia jornada clínica, educação, triagem e organização assistencial, sem substituir avaliação médica.`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          ...safeHistory,
          { role: 'user', content: message.slice(0, 2000) },
        ],
        temperature: 0.2,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error('Perplexity error:', details);
      return new Response(JSON.stringify({ error: 'Falha ao consultar o assistente.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();
    const answer = result?.choices?.[0]?.message?.content || 'Não consegui gerar uma resposta agora.';

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai-assistant error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno no assistente.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
