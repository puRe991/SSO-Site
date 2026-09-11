import type { APIRoute } from 'astro';
import { listAchievements } from '@/server/services/content';
import { guard, methodNotAllowed, ok } from '@/server/api/respond';

export const GET: APIRoute = ({ locals }) =>
  guard(async () => ok(await listAchievements(locals)));

export const ALL: APIRoute = () => methodNotAllowed();
