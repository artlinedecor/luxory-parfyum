/**
 * Oddiy in-memory rate limit.
 *
 * ⚠️ Serverless'da har bir instansiya o'z hisobini yuritadi — bu mukammal
 * himoya emas, lekin telefon raqam enumeratsiyasi (audit X10) va login
 * brute-force'ini (X2) sezilarli qiyinlashtiradi. Kuchliroq kerak bo'lsa
 * Upstash Redis kabi tashqi hisoblagichga o'tiladi.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const e = hits.get(key);

  if (!e || e.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (e.count >= max) return false;
  e.count++;
  return true;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "noma'lum"
  );
}
