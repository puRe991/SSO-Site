import type { APIRoute } from 'astro';
import { listEvents, listGames, listMembers, listNews } from '@/server/services/content';
import { resolveOrigin } from '@/lib/origin';

/** Dynamic sitemap: static routes plus every published entity. */
const STATIC_PATHS = [
  '/', '/clan', '/members', '/games', '/events', '/news', '/media',
  '/achievements', '/leaderboard', '/join', '/rules', '/contact', '/imprint', '/privacy',
];

export const GET: APIRoute = async ({ locals, url }) => {
  const origin = resolveOrigin(url);

  const [members, games, events, news] = await Promise.all([
    listMembers(locals, { pageSize: 48 }),
    listGames(locals),
    listEvents(locals, { limit: 100 }),
    listNews(locals, { pageSize: 24 }),
  ]);

  const urls = [
    ...STATIC_PATHS.map((path) => ({ loc: path, lastmod: null as string | null })),
    ...members.items.map((member) => ({ loc: `/members/${member.slug}`, lastmod: null })),
    ...games.map((game) => ({ loc: `/games/${game.slug}`, lastmod: null })),
    ...events.map((event) => ({ loc: `/events/${event.slug}`, lastmod: null })),
    ...news.items.map((article) => ({ loc: `/news/${article.slug}`, lastmod: article.publishedAt })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (entry) =>
      `  <url><loc>${origin}${entry.loc}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}</url>`,
  )
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=600',
    },
  });
};
