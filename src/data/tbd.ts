/**
 * TBD system
 * =========
 * Every piece of clan information that is not confirmed yet lives here as a
 * placeholder token. Nothing in the UI invents facts: a `TBD` value is either
 * hidden or rendered as an explicit placeholder (see `isTBD` / `orTBD`).
 *
 * To go live with real data, replace the value here (or in the database, which
 * always wins over these defaults) — no component has to be touched.
 */
export const TBD = {
  CLAN_DESCRIPTION: 'CLAN_DESCRIPTION_TBD',
  CLAN_HISTORY: 'CLAN_HISTORY_TBD',
  CLAN_FOUNDED: 'CLAN_FOUNDED_TBD',
  DISCORD_URL: 'DISCORD_URL_TBD',
  YOUTUBE_URL: 'YOUTUBE_URL_TBD',
  TWITCH_URL: 'TWITCH_URL_TBD',
  INSTAGRAM_URL: 'INSTAGRAM_URL_TBD',
  TIKTOK_URL: 'TIKTOK_URL_TBD',
  X_URL: 'X_URL_TBD',
  FACEBOOK_URL: 'FACEBOOK_URL_TBD',
  STEAM_URL: 'STEAM_URL_TBD',
  CONTACT_EMAIL: 'CONTACT_EMAIL_TBD',
  IMPRINT: 'IMPRINT_TBD',
  PRIVACY: 'PRIVACY_TBD',
  ROLE: 'ROLE_TBD',
} as const;

/** Placeholder shown wherever a value is unknown. */
export const TBD_DISPLAY = '—';

const TBD_VALUES: ReadonlySet<string> = new Set(Object.values(TBD));

/** True for empty values and for any `*_TBD` placeholder token. */
export function isTBD(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed === '') return true;
  return TBD_VALUES.has(trimmed) || /_TBD$/.test(trimmed);
}

/** Returns the value, or the neutral placeholder when it is not known yet. */
export function orTBD(value: unknown, fallback: string = TBD_DISPLAY): string {
  return isTBD(value) ? fallback : String(value);
}

/** Returns the value only when it is real — otherwise `undefined`. */
export function real<T>(value: T): T | undefined {
  return isTBD(value) ? undefined : value;
}
