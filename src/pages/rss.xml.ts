import type { APIRoute } from 'astro';
import { listNews } from '@/server/services/content';
import { siteConfig } from '@/data/site.config.mjs';
import { escapeHtml } from '@/lib/text';

export const GET: APIRoute = async ({ locals, site }) => {
  const origin = (site ?? new URL(siteConfig.url)).origin;
  const news = await listNews(locals, { pageSize: 20 });

  const items = news.items
    .map(
      (article) => `    <item>
      <title>${escapeHtml(article.title)}</title>
      <link>${origin}/news/${article.slug}</link>
      <guid isPermaLink="true">${origin}/news/${article.slug}</guid>
      ${article.publishedAt ? `<pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>` : ''}
      <description>${escapeHtml(article.teaser ?? '')}</description>
    </item>`,
    )
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeHtml(siteConfig.name)} — News</title>
    <link>${origin}</link>
    <description>${escapeHtml(siteConfig.description)}</description>
    <language>${siteConfig.locale}</language>
${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=600',
    },
  });
};
