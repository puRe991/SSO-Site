import type { APIRoute } from 'astro';
import { search } from '@/server/services/content';
import { guard, methodNotAllowed, ok } from '@/server/api/respond';

export const GET: APIRoute = ({ url, locals }) =>
  guard(async () => ok(await search(locals, url.searchParams.get('q') ?? '')));

export const ALL: APIRoute = () => methodNotAllowed();
