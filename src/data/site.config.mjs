/**
 * Central site configuration.
 * Imported by astro.config.mjs AND by application code, so it stays plain ESM.
 */
export const siteConfig = {
  name: 'Team Fairy Tight',
  shortName: 'TFT',
  /** Deployment URL. Override via PUBLIC_SITE_URL for preview deployments. */
  url: process.env.PUBLIC_SITE_URL ?? 'https://team-fairy-tight.pages.dev',
  tagline: 'Gaming • Community • Teamwork',
  description:
    'Team Fairy Tight (TFT) is a gaming clan and community. Members, games, events, news and everything around the team — in one place.',
  locale: 'en',
  themeColor: '#0a0a0f',
};
