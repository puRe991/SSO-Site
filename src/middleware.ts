import { defineMiddleware } from 'astro:middleware';
import { resolveSession, ensureCsrfCookie } from '@/server/security/session';
import { canAccessAdmin } from '@/data/permissions';

/** Routes that require any authenticated user. */
const PROTECTED_PREFIXES = ['/dashboard'];
/** Routes that additionally require an admin-capable role. */
const ADMIN_PREFIXES = ['/admin'];

function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = await resolveSession(context);
  context.locals.csrfToken = ensureCsrfCookie(context);

  const { pathname } = context.url;

  if (!context.locals.user && startsWithAny(pathname, [...PROTECTED_PREFIXES, ...ADMIN_PREFIXES])) {
    return context.redirect(`/login?next=${encodeURIComponent(pathname)}`, 302);
  }

  if (startsWithAny(pathname, ADMIN_PREFIXES) && !canAccessAdmin(context.locals.user?.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  const response = await next();

  // Security headers. CSP stays strict: no third-party scripts are loaded, and
  // Astro's inline island scripts are allowed via 'unsafe-inline' only for
  // styles; scripts are bundled files plus hashed inline bootstrap.
  const headers = response.headers;
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), interest-cohort=()');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  if (!headers.has('Content-Security-Policy') && response.headers.get('content-type')?.includes('text/html')) {
    headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "media-src 'self' https:",
        "font-src 'self' data:",
        "connect-src 'self'",
        // Only embed players the media section actually supports.
        'frame-src https://www.youtube-nocookie.com https://player.twitch.tv https://discord.com',
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        'frame-ancestors \'none\'',
      ].join('; '),
    );
  }

  return response;
});
