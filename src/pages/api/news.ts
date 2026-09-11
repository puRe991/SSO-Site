import type { APIRoute } from 'astro';
import { listNews } from '@/server/services/content';
import { guard, methodNotAllowed, ok } from '@/server/api/respond';

export const GET: APIRoute = ({ url, locals }) =>
  guard(async () =>
    ok(
      await listNews(locals, {
        category: url.searchParams.get('category') ?? undefined,
        search: url.searchParams.get('q') ?? undefined,
        page: Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1,
        pageSize: Number.parseInt(url.searchParams.get('pageSize') ?? '9', 10) || 9,
      }),
    ),
  );

export const ALL: APIRoute = () => methodNotAllowed();
