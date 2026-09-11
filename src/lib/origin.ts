import { siteConfig } from '@/data/site.config.mjs';

/**
 * Canonical origin of the current deployment.
 *
 * Resolution order:
 *   1. `PUBLIC_SITE_URL` — set it once the site runs on its final domain, so
 *      canonical URLs stay stable even when a page is reached through another
 *      hostname.
 *   2. The origin of the incoming request — correct out of the box on
 *      `*.pages.dev`, on preview deployments and on a custom domain, with
 *      nothing to configure.
 *
 * This is why the site does not depend on a build-time URL: an unset variable
 * degrades to the right answer instead of to `team-fairy-tight.pages.dev`.
 */
export function resolveOrigin(requestUrl: URL): string {
  const configured = import.meta.env.PUBLIC_SITE_URL ?? siteConfig.url;
  if (configured && !configured.includes('team-fairy-tight.pages.dev')) {
    try {
      return new URL(configured).origin;
    } catch {
      /* fall through to the request origin */
    }
  }
  return requestUrl.origin;
}

/** Absolute URL for a path or relative asset on the current deployment. */
export function absoluteUrl(path: string, requestUrl: URL): string {
  return new URL(path, resolveOrigin(requestUrl)).toString();
}
