/**
 * Shared Resend client + types for all email-sending edge functions.
 *
 * Standardizes on `npm:resend@4.0.1` (npm specifier is more stable than
 * esm.sh in the Deno edge runtime — see edge-function-deploy-errors guide).
 * All functions should import from here instead of pinning their own version
 * or hand-rolling fetch calls so request/response handling stays consistent.
 */
import { Resend } from "https://esm.sh/resend@4.0.1";

export { Resend };

/** Normalized response shape returned by every helper below. */
export interface SendEmailResult {
  ok: boolean;
  /** Resend message id when the send succeeded. */
  id?: string;
  /** Human-readable error message when the send failed. */
  error?: string;
  /** Raw error payload from Resend for diagnostics/logging. */
  details?: unknown;
}

export interface SendEmailParams {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Uint8Array | string;
    contentType?: string;
  }>;
  reply_to?: string | string[];
}

/**
 * Build a singleton Resend client from the RESEND_API_KEY env var.
 * Throws if the key is missing so callers fail fast at startup.
 */
export function createResendClient(): Resend {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
}

/**
 * Send an email via Resend with a normalized response shape.
 * Never throws — surface errors via the returned `SendEmailResult.error`.
 */
export async function sendEmail(
  client: Resend,
  params: SendEmailParams,
): Promise<SendEmailResult> {
  try {
    // Resend's TS types are strict (e.g. require either html or text and use
    // camelCase keys), but the runtime accepts our flexible shape. Cast to
    // `never` so callers can keep a single ergonomic interface.
    const payload = {
      from: params.from,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      attachments: params.attachments,
      replyTo: params.reply_to,
    };
    const { data, error } = await client.emails.send(payload as never);

    if (error) {
      return { ok: false, error: error.message ?? "Unknown Resend error", details: error };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected Resend failure";
    return { ok: false, error: message, details: err };
  }
}
