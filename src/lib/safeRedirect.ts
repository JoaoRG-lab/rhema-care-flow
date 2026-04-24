/**
 * Safe redirect validation for the post-login `redirect` query parameter.
 *
 * Goal: prevent open-redirect attacks where an attacker crafts a link like
 *   /login?redirect=https://evil.com
 * and tricks the user into landing on a phishing site after authenticating.
 *
 * Policy: only accept same-origin, root-relative paths. Anything else falls
 * back to the safe default ("/dashboard" by convention).
 *
 * Rejected forms include:
 *   - Absolute URLs:               https://evil.com, http://x, ftp://x
 *   - Protocol-relative URLs:      //evil.com, /\evil.com, /\\evil.com
 *   - Backslash tricks:            \evil.com, /\evil.com   (some browsers normalize \ → /)
 *   - Scheme-like prefixes:        javascript:..., data:..., mailto:...
 *   - Encoded variants:            %2F%2Fevil.com, %5C%5Cevil.com
 *   - Control / whitespace chars:  "\n//evil.com", " //evil.com"
 *   - Empty / non-string values
 *
 * This function intentionally does NOT attempt to "fix" suspicious input —
 * if anything looks off, we discard it and use the fallback.
 */

const DEFAULT_FALLBACK = '/dashboard';

export function isSafeInternalPath(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (value.length === 0 || value.length > 512) return false;

  // Reject any control characters or whitespace anywhere in the string.
  // \u0000-\u001F (controls), \u007F (DEL), and ASCII whitespace.
  if (/[\u0000-\u001F\u007F\s]/.test(value)) return false;

  // Decode common percent-encoded variants so attackers can't bypass the
  // structural checks below (e.g. "%2F%2Fevil.com" → "//evil.com").
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return false;
  }

  // Normalize backslashes to forward slashes (mirrors browser behavior on
  // some platforms where "\\evil.com" is treated as "//evil.com").
  const normalized = decoded.replace(/\\/g, '/');

  // Must be a single root-relative path.
  if (!normalized.startsWith('/')) return false;

  // Reject protocol-relative ("//host") and any scheme-like prefix.
  if (normalized.startsWith('//')) return false;

  // Reject anything that contains a scheme separator anywhere
  // (covers "/x?next=https://evil" attempts at downstream re-redirects too).
  if (/^[a-zA-Z][a-zA-Z0-9+.\-]*:/.test(normalized)) return false;
  if (normalized.includes('://')) return false;

  // Disallow embedded credentials or hostnames smuggled via "@".
  if (normalized.includes('@')) return false;

  return true;
}

/**
 * Resolve the post-login redirect target from a candidate value, returning
 * the fallback when the value is missing or fails validation.
 */
export function safeRedirect(
  candidate: unknown,
  fallback: string = DEFAULT_FALLBACK,
): string {
  return isSafeInternalPath(candidate) ? candidate : fallback;
}

/**
 * Build a `?redirect=...` query string fragment, omitting it entirely when
 * the target is the default fallback so we don't pollute URLs.
 */
export function buildRedirectQuery(
  target: string,
  fallback: string = DEFAULT_FALLBACK,
): string {
  const safe = safeRedirect(target, fallback);
  return safe === fallback ? '' : `?redirect=${encodeURIComponent(safe)}`;
}
