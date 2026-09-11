import type { AstroCookies } from 'astro';
import { CSRF_COOKIE } from './session';
import { constantTimeStringEqual } from './crypto';

export const CSRF_FIELD = '_csrf';

/**
 * Double-submit CSRF check: the form value must match the cookie, and the
 * Origin header (when present) must match the site's own origin.
 */
export function verifyCsrf(
  request: Request,
  cookies: AstroCookies,
  submittedToken: string | null,
): boolean {
  const cookieToken = cookies.get(CSRF_COOKIE)?.value;
  if (!cookieToken || !submittedToken) return false;
  if (!constantTimeStringEqual(cookieToken, submittedToken)) return false;

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) return false;
    } catch {
      return false;
    }
  }
  return true;
}

export function csrfFromForm(form: FormData): string | null {
  const value = form.get(CSRF_FIELD);
  return typeof value === 'string' ? value : null;
}
