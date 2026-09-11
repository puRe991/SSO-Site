import type { APIRoute } from 'astro';
import { getClanStats } from '@/server/services/content';
import { guard, methodNotAllowed, ok } from '@/server/api/respond';

export const GET: APIRoute = ({ locals }) => guard(async () => ok(await getClanStats(locals)));

export const ALL: APIRoute = () => methodNotAllowed();
