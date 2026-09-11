import type { APIRoute } from 'astro';
import { listMembers } from '@/server/services/content';
import { guard, methodNotAllowed, ok } from '@/server/api/respond';

export const GET: APIRoute = ({ url, locals }) =>
  guard(async () => {
    const page = await listMembers(locals, {
      rank: url.searchParams.get('rank') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      game: url.searchParams.get('game') ?? undefined,
      search: url.searchParams.get('q') ?? undefined,
      page: Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1,
      pageSize: Number.parseInt(url.searchParams.get('pageSize') ?? '12', 10) || 12,
    });
    return ok(page);
  });

export const ALL: APIRoute = () => methodNotAllowed();
