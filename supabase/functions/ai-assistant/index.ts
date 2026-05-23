import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const ALLOWED_ORIGINS = [
  'https://www.reumatismos.com',
  'https://reumatismos.com',
  'https://rhema-care-flow.vercel.app',
  'https://uhs.health',
  'http://localhost:5173',
  'http://localhost:3000',
];

const FUNCTION_VERSION = 'rhema-care-v3.0';
const MAX_MESSAGE_LENGTH = 1400;
const MAX_HISTORY_ITEMS = 6;
const MAX_HISTORY_CONTENT_LENGTH = 900;

// Perplexity
const PERPLEXITY_ENDPOINT = 'https://api.perplexity.ai/chat/completions';
const DEFAULT_PERPLEXITY_MODEL = 'sonar-pro';

// Gemini
const GEMINI_MODEL = 'gemini-1.5-pro';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Rate limiting simples em memória (por IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

type ChatRole = 'user' | 'assistant' | 'system';
type ChatMessage = { role: ChatRole; content: string };
type IncomingMessage = { role?: unknown; content?: unknown };

// ── CORS ────────────────────────────────────────────────────────────────────
function getCorsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function jsonResponse(body: Record<string, unknown>, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

// ── Utils ────────────────────────────────────────────────────────────────────
function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function sanitizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item: IncomingMessage) => item?.role === 'user' || item?.role === 'assistant')
    .map((item: IncomingMessage) => ({
      role: item.role as 'user' | 'assistant',
      content: normalizeText(item.content, MAX_HISTORY_CONTENT_LENGTH),
    }))
    .filter((item: ChatMessage) => item.content.length > 0)
    .slice(-MAX_HISTORY_ITEMS);
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// ── System prompts por agente ────────────────────────────────────────────────
function buildSystemPrompt(context: string, agent: string): string {
  // Site público — widget reumatismos.com
  if (context === 'site_publico' || context === 'reumatismos') {
    return `Você é o Assistente Reumatismos, agente educativo público do site reumatismos.com.

Missão:
- Orientar visitantes (pacientes, cuidadores e profissionais) sobre condições reumatológicas de forma educativa.
- Explicar sinais, sintomas, jornada diagnóstica, importância do acompanhamento especializado e uso da plataforma Rhema Care.
- Responder em português brasileiro claro, acolhedor e preciso.
- Promover a consulta ao reumatologista como próximo passo natural.

Temas cobertos: fibromialgia, artrite reumatoide, lúpus, osteoporose, gota, dor lombar inflamatória, espondiloartrites e reumatologia em geral.

Limites inegociáveis:
- NUNCA fornecer diagnóstico individual, interpretação de exames específicos ou conduta médica personalizada.
- Não coletar dados pessoais ou sensíveis do visitante no chat.
- Em emergências ou dúvidas sérias, orientar buscar atendimento médico presencial imediato.
- Se não souber, diga claramente e sugira consultar um reumatologista.

Tom: profissional, humano, objetivo e acolhedor.`;
  }

  // Painel integrativo — agentes por papel
  switch (agent) {
    case 'perplexity':
    case 'supervisor_tmr':
      return `Você é o Perplexity, Supervisor TMR do projeto Rhema Care Flow.

Papel: monitoramento do repositório JoaoRG-lab/rhema-care-flow, supervisão dos builds TMR (Triple Modular Redundancy), busca de informações em tempo real, coordenação dos agentes IA.

Capacidades: analisar logs de CI/CD, descrever status de issues/PRs GitHub, identificar falhas de build, recomendar próximos passos ao time.

Tom: técnico, preciso, direto. Responda em português brasileiro.`;

    case 'codex':
    case 'engenheiro_codigo':
      return `Você é o Codex, Engenheiro de Código Autônomo do projeto Rhema Care Flow.

Stack: Vite 5 + React + TypeScript, Tailwind CSS, Supabase, Vercel. Node 20, ESLint v8 legacy.

Papel: codificação autônoma, refatoração, correção de bugs, criação de componentes, análise de TypeScript errors. Sempre seguir protocolo TMR: commits atômicos, não reativar workflows legados, não alterar arquivos médicos estáveis.

Tom: técnico, objetivo, com exemplos de código quando relevante. Responda em português brasileiro.`;

    case 'chatgpt':
    case 'agente_vercel':
      return `Você é o ChatGPT, Agente Vercel do projeto Rhema Care Flow.

Papel: configuração de deploys Vercel, variáveis de ambiente, Edge Functions Supabase, configuração de domínios, revisão de YAML de workflows.

Especialidade: resolver problemas de build em produção, configurar secrets no GitHub Actions, garantir que o TMR aprove os builds.

Tom: técnico, prático, orientado a solução. Responda em português brasileiro.`;

    case 'grok':
    case 'auditor_seguranca':
      return `Você é o Grok, Auditor de Segurança do projeto Rhema Care Flow.

Papel: revisão de segurança de código, análise de exposição de secrets, auditoria de autenticação Supabase, verificação de CORS, análise de vulnerabilidades em dependências.

Princípios: LGPD, dados de saúde sensíveis exigem proteção máxima. Identificar vetores de ataque, propor mitigações concretas.

Tom: cauteloso, detalhado, orientado a risco. Responda em português brasileiro.`;

    case 'gemini':
    case 'analista_clinico':
      return `Você é o Gemini, Analista Clínico Multimodal do projeto Rhema Care Flow.

Papel: análise de imagens médicas (ultrassonografia reumatológica, radiografias), suporte a laudos assistidos por IA, análise de padrões clínicos em reumatologia.

Especialidade: USG reumatológica (sinovite, tenossinovite, erosões), padrões de AR, lúpus, gota, espondiloartrites. Reumato intervenção guiada por imagem.

Limites: sempre reforçar que laudos finais são responsabilidade do médico. Nunca substituir avaliação clínica.

Tom: clínico, científico, preciso. Responda em português brasileiro.`;

    default:
      return `Você é o Assistente Rhema Care, suporte clínico-operacional do sistema Rhema Care Flow.

Missão: auxiliar profissionais de saúde e gestores na navegação da plataforma. Suporte em português brasileiro claro e objetivo.

Limites: nunca fornecer diagnóstico individual, prescrição ou conduta médica personalizada.

Tom: profissional, humano, objetivo e acolhedor.`;
  }
}

// ── Provider: Perplexity ──────────────────────────────────────────────────────
async function callPerplexity(
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
  origin: string | null,
): Promise<Response> {
  const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
  if (!apiKey) {
    console.error('PERPLEXITY_API_KEY não configurada');
    return jsonResponse({ error: 'Serviço temporariamente indisponível.' }, 503, origin);
  }

  const model = normalizeText(Deno.env.get('PERPLEXITY_MODEL'), 80) || DEFAULT_PERPLEXITY_MODEL;

  const res = await fetch(PERPLEXITY_ENDPOINT, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 650,
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    console.error('Perplexity error', { status: res.status, details: details.slice(0, 300) });
    return jsonResponse({ error: 'Falha ao consultar o assistente de IA.' }, 502, origin);
  }

  const result = await res.json();
  const answer = result?.choices?.[0]?.message?.content ?? 'Sem resposta.';
  return jsonResponse({ reply: answer, answer, meta: { provider: 'perplexity', model, version: FUNCTION_VERSION } }, 200, origin);
}

// ── Provider: Gemini ──────────────────────────────────────────────────────────
async function callGemini(
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string,
  origin: string | null,
): Promise<Response> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    console.warn('GEMINI_API_KEY não configurada — fallback para Perplexity');
    // Fallback gracioso: usa Perplexity com prompt de Gemini
    return await callPerplexity(systemPrompt, history, userMessage, origin);
  }

  // Gemini usa formato diferente: contents com parts
  const contents = [
    ...history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
      safetySettings: [
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    console.error('Gemini error', { status: res.status, details: details.slice(0, 300) });
    // Fallback gracioso para Perplexity
    console.warn('Gemini falhou — fallback para Perplexity');
    return await callPerplexity(systemPrompt, history, userMessage, origin);
  }

  const result = await res.json();
  const answer = result?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sem resposta do Gemini.';
  return jsonResponse({ reply: answer, answer, meta: { provider: 'gemini', model: GEMINI_MODEL, version: FUNCTION_VERSION } }, 200, origin);
}

// ── Handler principal ─────────────────────────────────────────────────────────
serve(async (req) => {
  const origin = req.headers.get('origin');
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? 'unknown';

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(origin) });
  }

  if (req.method === 'GET') {
    return jsonResponse({ ok: true, function: 'ai-assistant', version: FUNCTION_VERSION }, 200, origin);
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405, origin);
  }

  if (!checkRateLimit(ip)) {
    console.warn('rate-limit atingido', { ip });
    return jsonResponse({ error: 'Muitas requisições. Aguarde um momento.' }, 429, origin);
  }

  try {
    const body = await req.json();
    const { message, history = [], context = 'plataforma_interna', agent = '' } = body;
    const userMessage = normalizeText(message, MAX_MESSAGE_LENGTH);

    if (!userMessage) {
      return jsonResponse({ error: 'Mensagem inválida ou vazia.' }, 400, origin);
    }

    const safeContext = normalizeText(context, 80) || 'plataforma_interna';
    const safeAgent = normalizeText(agent, 80);
    const safeHistory = sanitizeHistory(history);

    const systemPrompt = buildSystemPrompt(safeContext, safeAgent);

    // Roteamento por agente/contexto
    const useGemini =
      safeAgent === 'gemini' ||
      safeContext === 'analista_clinico';

    console.log('ai-assistant request', {
      provider: useGemini ? 'gemini' : 'perplexity',
      agent: safeAgent,
      context: safeContext,
      historyLen: safeHistory.length,
      version: FUNCTION_VERSION,
    });

    if (useGemini) {
      return await callGemini(systemPrompt, safeHistory, userMessage, origin);
    }
    return await callPerplexity(systemPrompt, safeHistory, userMessage, origin);

  } catch (error) {
    console.error('ai-assistant erro interno', error instanceof Error ? error.message : String(error));
    return jsonResponse({ error: 'Erro interno no assistente.' }, 500, origin);
  }
});
