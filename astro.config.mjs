// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

import { siteConfig } from './src/data/site.config.mjs';

// Astro + Cloudflare adapter:
//  - SSR on Cloudflare Pages Functions (free tier), static assets on the CDN
//  - zero client JS by default; interactive parts are opt-in islands
export default defineConfig({
  site: siteConfig.url,
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: { enabled: true },
  }),
  // The site brings its own session layer (D1-backed, see server/security/session).
  // Declaring a driver here stops the adapter from wiring Astro's own sessions to
  // a Cloudflare KV namespace we neither use nor want to pay for — without this the
  // build expects a `SESSION` KV binding that does not exist.
  session: { driver: 'memory' },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'auto' },
  vite: {
    build: { cssMinify: 'lightningcss' },
  },
});
