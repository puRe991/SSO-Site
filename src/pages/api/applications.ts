import type { APIRoute } from 'astro';
import { desc } from 'drizzle-orm';
import { getDatabase, schema } from '@/server/database/client';
import { applicationSchema, fieldErrors } from '@/server/validation/schemas';
import { newId } from '@/server/security/crypto';
import { clientIdentifier, rateLimit } from '@/server/security/rate-limit';
import { can } from '@/data/permissions';
import { fail, forbidden, guard, ok, unauthorized } from '@/server/api/respond';

/** Reading applications is restricted — they contain personal data. */
export const GET: APIRoute = ({ locals }) =>
  guard(async () => {
    if (!locals.user) return unauthorized();
    if (!can(locals.user.role, 'manage_applications')) return forbidden();

    const database = getDatabase(locals);
    if (!database) return ok([]);

    const rows = await database
      .select()
      .from(schema.applications)
      .orderBy(desc(schema.applications.createdAt))
      .limit(100);

    return ok(rows, { headers: { 'cache-control': 'no-store' } });
  });

/** JSON submission endpoint, mirroring the /join form. */
export const POST: APIRoute = ({ request, locals }) =>
  guard(async () => {
    const database = getDatabase(locals);
    const limit = await rateLimit(database, 'application', clientIdentifier(request), 3, 60 * 60);
    if (!limit.allowed) {
      return fail('rate_limited', 'Too many requests. Please try again later.', 429);
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return fail('invalid_json', 'Request body must be valid JSON.');
    }

    const parsed = applicationSchema.safeParse(payload);
    if (!parsed.success) {
      return fail('validation_failed', 'Validation failed.', 422, fieldErrors(parsed.error));
    }
    if (parsed.data.website) return ok({ status: 'submitted' });
    if (!database) return fail('unavailable', 'No database is configured.', 503);

    const id = newId('app');
    await database.insert(schema.applications).values({
      id,
      username: parsed.data.username,
      displayName: parsed.data.displayName || null,
      country: parsed.data.country || null,
      games: parsed.data.games || null,
      mainGame: parsed.data.mainGame || null,
      discordUsername: parsed.data.discordUsername,
      motivation: parsed.data.motivation,
      referral: parsed.data.referral || null,
      status: 'submitted',
    });

    return ok({ id, status: 'submitted' }, { headers: { 'cache-control': 'no-store' } });
  });
