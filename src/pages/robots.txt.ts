import type { APIRoute } from 'astro';
import { resolveOrigin } from '@/lib/origin';

export const GET: APIRoute = ({ url }) => {
  const origin = resolveOrigin(url);
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
