/**
 * Central site configuration.
 * Imported by astro.config.mjs AND by application code, so it stays plain ESM.
 */
export const siteConfig = {
  name: 'Fairy Tight',
  shortName: 'FT',
  /**
   * Canonical URL, optional. Empty means "not pinned": the site then derives
   * its origin from the incoming request, which is already correct on
   * workers.dev, on preview deployments and on a custom domain. Set
   * PUBLIC_SITE_URL as a build variable to pin it to one domain.
   */
  url: process.env.PUBLIC_SITE_URL ?? '',
  tagline: 'Reiten • Gemeinschaft • Abenteuer',
  description:
    'Fairy Tight ist ein Reitclub in Star Stable Online. Mitglieder, Ausritte, Turniere, Neuigkeiten und alles rund um den Club — an einem Ort.',
  locale: 'de',
  themeColor: '#0a1a17',
};
