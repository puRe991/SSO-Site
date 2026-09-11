import type { APIRoute } from 'astro';
import { listGames } from '@/server/services/content';
import { guard, methodNotAllowed, ok } from '@/server/api/respond';

export const GET: APIRoute = ({ url, locals }) =>
  guard(async () =>
    ok(
      await listGames(locals, {
        status: url.searchParams.get('status') ?? undefined,
        platform: url.searchParams.get('platform') ?? undefined,
        search: url.searchParams.get('q') ?? undefined,
      }),
    ),
  );

export const ALL: APIRoute = () => methodNotAllowed();
