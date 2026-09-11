import { eq, lt } from 'drizzle-orm';
import type { APIContext, AstroCookies } from 'astro';
import { getDatabase, schema, type Database } from '../database/client';
import { newId, randomToken, sha256 } from './crypto';
import type { Role } from '@/data/permissions';

export const SESSION_COOKIE = 'tft_session';
export const CSRF_COOKIE = 'tft_csrf';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

export interface SessionUser {
  id: string;
  email: string;
  role: Role | string;
  memberId: string | null;
}

function cookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
  };
}

function isSecureRequest(url: URL): boolean {
  return url.protocol === 'https:';
}

export async function createSession(
  db: Database,
  cookies: AstroCookies,
  url: URL,
  userId: string,
  userAgent: string | null,
): Promise<void> {
  const token = randomToken(32);
  const id = await sha256(token);
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;

  await db.insert(schema.sessions).values({
    id,
    userId,
    expiresAt,
    userAgent: userAgent?.slice(0, 255) ?? null,
  });

  cookies.set(SESSION_COOKIE, token, {
    ...cookieOptions(isSecureRequest(url)),
    maxAge: SESSION_TTL_SECONDS,
  });
  // CSRF token is readable by the page (double-submit pattern), not httpOnly.
  cookies.set(CSRF_COOKIE, randomToken(24), {
    ...cookieOptions(isSecureRequest(url)),
    httpOnly: false,
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(
  db: Database | null,
  cookies: AstroCookies,
  url: URL,
): Promise<void> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token && db) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, await sha256(token)));
  }
  cookies.delete(SESSION_COOKIE, { path: '/' });
  cookies.delete(CSRF_COOKIE, { path: '/' });
  void url;
}

/** Resolves the current user from the session cookie. Expired rows are purged. */
export async function resolveSession(context: {
  cookies: AstroCookies;
  locals: App.Locals;
}): Promise<SessionUser | null> {
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = getDatabase(context.locals);
  if (!db) return null;

  const id = await sha256(token);
  const rows = await db
    .select({
      sessionId: schema.sessions.id,
      expiresAt: schema.sessions.expiresAt,
      userId: schema.users.id,
      email: schema.users.email,
      role: schema.users.role,
      memberId: schema.users.memberId,
      isActive: schema.users.isActive,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(eq(schema.sessions.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  if (row.expiresAt <= Math.floor(Date.now() / 1000) || !row.isActive) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
    return null;
  }

  return { id: row.userId, email: row.email, role: row.role, memberId: row.memberId };
}

/** Opportunistic cleanup; cheap enough to run on login. */
export async function purgeExpiredSessions(db: Database): Promise<void> {
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, Math.floor(Date.now() / 1000)));
}

export function ensureCsrfCookie(context: Pick<APIContext, 'cookies' | 'url'>): string {
  const existing = context.cookies.get(CSRF_COOKIE)?.value;
  if (existing) return existing;
  const token = randomToken(24);
  context.cookies.set(CSRF_COOKIE, token, {
    ...cookieOptions(isSecureRequest(context.url)),
    httpOnly: false,
    maxAge: SESSION_TTL_SECONDS,
  });
  return token;
}

export { newId };
