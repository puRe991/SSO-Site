import type { APIRoute } from 'astro';
import { permissionsForRole } from '@/data/permissions';
import { guard, ok } from '@/server/api/respond';

/** Current session state for client-side code. Never cached. */
export const GET: APIRoute = ({ locals }) =>
  guard(async () =>
    ok(
      locals.user
        ? {
            authenticated: true,
            user: { id: locals.user.id, email: locals.user.email, role: locals.user.role },
            permissions: permissionsForRole(locals.user.role),
          }
        : { authenticated: false },
      { headers: { 'cache-control': 'no-store' } },
    ),
  );
