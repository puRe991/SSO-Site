/**
 * TBD system
 * =========
 * Jede Angabe über den Club, die noch nicht bestätigt ist, steht hier als
 * Platzhalter-Token. Die Oberfläche erfindet nichts: ein `TBD`-Wert wird
 * entweder versteckt oder als deutlicher Platzhalter ausgegeben (siehe `isTBD`
 * / `orTBD`).
 *
 * Für echte Daten einfach den Wert hier ersetzen (oder in der Datenbank, die
 * immer Vorrang vor diesen Vorgaben hat) — keine Komponente muss angefasst
 * werden.
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

/** Platzhalter überall dort, wo ein Wert unbekannt ist. */
export const TBD_DISPLAY = '—';

const TBD_VALUES: ReadonlySet<string> = new Set(Object.values(TBD));

/** Wahr für leere Werte und für jedes `*_TBD`-Platzhalter-Token. */
export function isTBD(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed === '') return true;
  return TBD_VALUES.has(trimmed) || /_TBD$/.test(trimmed);
}

/** Gibt den Wert zurück oder den neutralen Platzhalter, solange er unbekannt ist. */
export function orTBD(value: unknown, fallback: string = TBD_DISPLAY): string {
  return isTBD(value) ? fallback : String(value);
}

/** Gibt den Wert nur zurück, wenn er echt ist — sonst `undefined`. */
export function real<T>(value: T): T | undefined {
  return isTBD(value) ? undefined : value;
}
