/**
 * Small in-memory fixed-window limiter. Per server instance only — on Vercel each
 * instance has its own memory, so treat this as a speed bump. Supabase Auth applies
 * its own rate limits to sign-in/sign-up/reset. Use a shared store (e.g. Redis) at scale.
 */
const hits = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}
