/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

type CloudflareRuntime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  DB?: D1Database;
  SESSION_SECRET?: string;
  PUBLIC_SITE_URL?: string;
}

declare namespace App {
  interface Locals extends CloudflareRuntime {
    user: import('./server/security/session').SessionUser | null;
    csrfToken: string;
  }
}
