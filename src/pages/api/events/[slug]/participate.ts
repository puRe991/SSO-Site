import type { APIRoute } from 'astro';
import { and, eq, sql } from 'drizzle-orm';
import { getDatabase, schema } from '@/server/database/client';
import { csrfFromForm, verifyCsrf } from '@/server/security/csrf';
import { guard, methodNotAllowed } from '@/server/api/respond';

/**
 * Event registration. Uses a form POST + redirect so it works without JS;
 * the capacity check runs server-side, never in the browser.
 */
export const POST: APIRoute = ({ request, cookies, locals, params, redirect }) =>
  guard(async () => {
    const slug = params.slug;
    const user = locals.user;
    if (!slug) return methodNotAllowed();
    if (!user) return redirect(`/login?next=/events/${slug}`, 303);

    const form = await request.formData();
    if (!verifyCsrf(request, cookies, csrfFromForm(form))) {
      return new Response('Invalid CSRF token', { status: 403 });
    }

    const database = getDatabase(locals);
    if (!database) return redirect(`/events/${slug}?status=error`, 303);

    const rows = await database
      .select({
        id: schema.events.id,
        limit: schema.events.participantLimit,
        status: schema.events.status,
        count: sql<number>`(select count(*) from event_participants where event_participants.event_id = ${schema.events.id})`,
      })
      .from(schema.events)
      .where(eq(schema.events.slug, slug))
      .limit(1);

    const event = rows[0];
    if (!event) return new Response('Not found', { status: 404 });

    const action = form.get('action');

    if (action === 'leave') {
      await database
        .delete(schema.eventParticipants)
        .where(
          and(
            eq(schema.eventParticipants.eventId, event.id),
            eq(schema.eventParticipants.userId, user.id),
          ),
        );
      return redirect(`/events/${slug}?status=left`, 303);
    }

    if (event.status === 'cancelled') return redirect(`/events/${slug}?status=error`, 303);
    if (event.limit !== null && Number(event.count) >= event.limit) {
      return redirect(`/events/${slug}?status=full`, 303);
    }

    await database
      .insert(schema.eventParticipants)
      .values({ eventId: event.id, userId: user.id })
      .onConflictDoNothing();

    return redirect(`/events/${slug}?status=joined`, 303);
  });

export const GET: APIRoute = () => methodNotAllowed();
