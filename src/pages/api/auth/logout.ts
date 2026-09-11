import type { APIRoute } from 'astro';
import { getDatabase } from '@/server/database/client';
import { destroySession } from '@/server/security/session';
import { csrfFromForm, verifyCsrf } from '@/server/security/csrf';

export const POST: APIRoute = async ({ request, cookies, locals, url, redirect }) => {
  const form = await request.formData();
  if (!verifyCsrf(request, cookies, csrfFromForm(form))) {
    return new Response('Invalid CSRF token', { status: 403 });
  }
  await destroySession(getDatabase(locals), cookies, url);
  return redirect('/', 303);
};

/** GET is never allowed to log out — that would be CSRF-able via an <img> tag. */
export const GET: APIRoute = () => new Response('Method not allowed', { status: 405 });
