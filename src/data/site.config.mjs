/**
 * Central site configuration.
 * Imported by astro.config.mjs AND by application code, so it stays plain ESM.
 */
export const siteConfig = {
  name: 'Team Fairy Tight',
  shortName: 'TFT',
  /**
   * Canonical URL, optional. Empty means "not pinned": the site then derives
   * its origin from the incoming request, which is already correct on
   * workers.dev, on preview deployments and on a custom domain. Set
   * PUBLIC_SITE_URL as a build variable to pin it to one domain.
   */
  url: process.env.PUBLIC_SITE_URL ?? '',
  tagline: 'Gaming • Community • Teamwork',
  description:
    'Team Fairy Tight (TFT) is a gaming clan and community. Members, games, events, news and everything around the team — in one place.',
  locale: 'en',
  themeColor: '#0a0a0f',
};
