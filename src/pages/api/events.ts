import type { APIRoute } from 'astro';
import { listEvents } from '@/server/services/content';
import { guard, methodNotAllowed, ok } from '@/server/api/respond';

export const GET: APIRoute = ({ url, locals }) =>
  guard(async () => {
    const when = url.searchParams.get('when');
    return ok(
      await listEvents(locals, {
        when: when === 'past' || when === 'upcoming' ? when : undefined,
        status: url.searchParams.get('status') ?? undefined,
        game: url.searchParams.get('game') ?? undefined,
        limit: Number.parseInt(url.searchParams.get('limit') ?? '50', 10) || 50,
      }),
    );
  });

export const ALL: APIRoute = () => methodNotAllowed();
