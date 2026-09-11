import { eq } from 'drizzle-orm';
import { schema, type Database } from '../database/client';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Fixed-window rate limiting backed by D1. Keyed by action + identifier
 * (usually the client IP), so one abusive client cannot lock out everyone.
 */
export async function rateLimit(
  db: Database | null,
  action: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  if (!db) return { allowed: true, remaining: limit, retryAfterSeconds: 0 };

  const key = `${action}:${identifier}`;
  const nowSeconds = Math.floor(Date.now() / 1000);

  const existing = await db
    .select()
    .from(schema.rateLimits)
    .where(eq(schema.rateLimits.key, key))
    .limit(1);

  const row = existing[0];

  if (!row || nowSeconds - row.windowStart >= windowSeconds) {
    await db
      .insert(schema.rateLimits)
      .values({ key, count: 1, windowStart: nowSeconds })
      .onConflictDoUpdate({
        target: schema.rateLimits.key,
        set: { count: 1, windowStart: nowSeconds },
      });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (row.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: windowSeconds - (nowSeconds - row.windowStart),
    };
  }

  await db
    .update(schema.rateLimits)
    .set({ count: row.count + 1 })
    .where(eq(schema.rateLimits.key, key));

  return { allowed: true, remaining: limit - row.count - 1, retryAfterSeconds: 0 };
}

export function clientIdentifier(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}
