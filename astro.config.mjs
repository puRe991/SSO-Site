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
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'auto' },
  vite: {
    build: { cssMinify: 'lightningcss' },
  },
});
