import { inArray } from 'drizzle-orm';
import { getDatabase, schema } from '../database/client';
import { clanConfig } from '@/data/clan.config';
import { TBD } from '@/data/tbd';

/**
 * Editable site content. Database values win over the compile-time defaults in
 * `clan.config.ts`, so the clan can rewrite its own texts from /admin without
 * a deployment.
 */
export const SETTING_KEYS = [
  'clan.description',
  'clan.history',
  'clan.values',
  'clan.goals',
  'clan.founded',
  'social.discord',
  'social.youtube',
  'social.twitch',
  'social.instagram',
  'social.tiktok',
  'social.x',
  'social.facebook',
  'social.steam',
  'contact.email',
  'rules.content',
  'imprint.content',
  'privacy.content',
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export const settingDefaults: Record<SettingKey, string> = {
  'clan.description': clanConfig.description,
  'clan.history': clanConfig.history,
  'clan.values': '',
  'clan.goals': '',
  'clan.founded': clanConfig.foundedAt,
  'social.discord': TBD.DISCORD_URL,
  'social.youtube': TBD.YOUTUBE_URL,
  'social.twitch': TBD.TWITCH_URL,
  'social.instagram': TBD.INSTAGRAM_URL,
  'social.tiktok': TBD.TIKTOK_URL,
  'social.x': TBD.X_URL,
  'social.facebook': TBD.FACEBOOK_URL,
  'social.steam': TBD.STEAM_URL,
  'contact.email': TBD.CONTACT_EMAIL,
  'rules.content': '',
  'imprint.content': TBD.IMPRINT,
  'privacy.content': TBD.PRIVACY,
};

export type SettingsMap = Record<SettingKey, string>;

export async function getSettings(locals: App.Locals): Promise<SettingsMap> {
  const values: SettingsMap = { ...settingDefaults };
  const database = getDatabase(locals);
  if (!database) return values;

  let rows: { key: string; value: string }[] = [];
  try {
    rows = await database
      .select()
      .from(schema.settings)
      .where(inArray(schema.settings.key, [...SETTING_KEYS]));
  } catch (error) {
    // Runs on every page through PageLayout: a database that is unreachable or
    // mid-migration must not take the whole site down, so fall back to the
    // compile-time defaults (which render as TBD placeholders).
    console.error('[settings:getSettings]', error);
    return values;
  }

  for (const row of rows) {
    if ((SETTING_KEYS as readonly string[]).includes(row.key) && row.value.trim() !== '') {
      values[row.key as SettingKey] = row.value;
    }
  }
  return values;
}

export async function setSetting(
  locals: App.Locals,
  key: SettingKey,
  value: string,
): Promise<void> {
  const database = getDatabase(locals);
  if (!database) throw new Error('No database bound');
  await database
    .insert(schema.settings)
    .values({ key, value, updatedAt: Math.floor(Date.now() / 1000) })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value, updatedAt: Math.floor(Date.now() / 1000) },
    });
}

export function isSettingKey(value: unknown): value is SettingKey {
  return typeof value === 'string' && (SETTING_KEYS as readonly string[]).includes(value);
}
