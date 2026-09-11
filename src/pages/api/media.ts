import type { APIRoute } from 'astro';
import { listMedia } from '@/server/services/content';
import { guard, methodNotAllowed, ok } from '@/server/api/respond';

export const GET: APIRoute = ({ url, locals }) =>
  guard(async () =>
    ok(
      await listMedia(locals, {
        category: url.searchParams.get('category') ?? undefined,
        kind: url.searchParams.get('kind') ?? undefined,
        limit: Number.parseInt(url.searchParams.get('limit') ?? '60', 10) || 60,
      }),
    ),
  );

export const ALL: APIRoute = () => methodNotAllowed();
