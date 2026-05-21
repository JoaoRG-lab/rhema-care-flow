import { getCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import { verifyJWT } from '../_shared/auth.ts';
import { checkRateLimit, getClientIp } from '../_shared/rateLimit.ts';

const FUNCTION_VERSION = 'rhema-care-v2.0';

const FEEDBACK_TYPES = ['bug', 'sugestao', 'elogio', 'duvida', 'outro'] as const;
type FeedbackType = typeof FEEDBACK_TYPES[number];

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const ip = getClientIp(req);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(origin) });
  if (req.method !== 'POST') return jsonResponse({ error: 'Metodo nao permitido.' }, 405, origin);

  const auth = await verifyJWT(req);
  if (!auth) return jsonResponse({ error: 'Nao autorizado.' }, 401, origin);

  // Rate limit: max 5 feedbacks por minuto por usuario
  if (!checkRateLimit(`feedback:${auth.userId}:${ip}`, 5, 60_000)) {
    return jsonResponse({ error: 'Muitos feedbacks enviados. Aguarde.' }, 429, origin);
  }

  try {
    const { type, subject, message, page_url, user_agent } = await req.json();

    if (!type || !FEEDBACK_TYPES.includes(type as FeedbackType)) {
      return jsonResponse({ error: `Tipo invalido. Use: ${FEEDBACK_TYPES.join(', ')}` }, 400, origin);
    }
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return jsonResponse({ error: 'Mensagem muito curta (minimo 10 caracteres).' }, 400, origin);
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    const feedbackEmail = Deno.env.get('FEEDBACK_EMAIL') ?? 'feedback@rhemacare.com.br';

    if (!resendKey) {
      console.error('send-feedback-email: RESEND_API_KEY nao configurada');
      return jsonResponse({ error: 'Servico de email nao configurado.' }, 503, origin);
    }

    const safeMessage = message.trim().slice(0, 2000);
    const safeSubject = subject ? String(subject).trim().slice(0, 150) : `[Feedback] ${type}`;
    const safePageUrl = page_url ? String(page_url).slice(0, 300) : 'N/A';
    const safeUserAgent = user_agent ? String(user_agent).slice(0, 200) : 'N/A';

    const emailBody = [
      `<h2>Feedback Rhema Care Flow</h2>`,
      `<p><strong>Tipo:</strong> ${type}</p>`,
      `<p><strong>Usuario ID:</strong> ${auth.userId}</p>`,
      `<p><strong>Pagina:</strong> ${safePageUrl}</p>`,
      `<p><strong>Mensagem:</strong></p>`,
      `<blockquote>${safeMessage.replace(/\n/g, '<br>')}</blockquote>`,
      `<hr>`,
      `<p style="color:#999;font-size:12px">User-Agent: ${safeUserAgent}<br>Enviado em: ${new Date().toISOString()}</p>`,
    ].join('');

    const emailResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Rhema Care <noreply@rhemacare.com.br>',
        to: [feedbackEmail],
        subject: safeSubject,
        html: emailBody,
      }),
    });

    if (!emailResp.ok) {
      const err = await emailResp.text();
      console.error('send-feedback-email Resend error', { status: emailResp.status, err: err.slice(0, 200) });
      return jsonResponse({ error: 'Falha ao enviar email.' }, 502, origin);
    }

    const emailData = await emailResp.json();
    console.log('send-feedback-email ok', { userId: auth.userId, type, emailId: emailData.id });

    return jsonResponse({
      ok: true,
      message: 'Feedback enviado com sucesso. Obrigado!',
      version: FUNCTION_VERSION,
    }, 200, origin);

  } catch (error) {
    console.error('send-feedback-email erro interno', error instanceof Error ? error.message : String(error));
    return jsonResponse({ error: 'Erro interno.' }, 500, origin);
  }
});
