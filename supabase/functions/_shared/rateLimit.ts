// Rate limiter em memória compartilhado entre funções
const map = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  ip: string,
  max = 30,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const entry = map.get(ip);
  if (!entry || now > entry.resetAt) {
    map.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for') ??
    req.headers.get('cf-connecting-ip') ??
    'unknown'
  );
}
