/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

type CloudflareRuntime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  /** D1 database. Absent when the binding is not configured — the site then
   *  renders honest empty states instead of failing. */
  DB?: D1Database;
  /** Static asset binding provided by Workers Assets. */
  ASSETS?: Fetcher;
  PUBLIC_SITE_URL?: string;
}

declare namespace App {
  interface Locals extends CloudflareRuntime {
    user: import('./server/security/session').SessionUser | null;
    csrfToken: string;
  }
}
