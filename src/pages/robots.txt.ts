import type { APIRoute } from 'astro';
import { siteConfig } from '@/data/site.config.mjs';

export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL(siteConfig.url)).origin;
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /api/
Disallow: /login
Disallow: /register
Disallow: /search

Sitemap: ${origin}/sitemap.xml
`;
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
};
