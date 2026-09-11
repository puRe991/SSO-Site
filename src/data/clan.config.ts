import { TBD } from './tbd';
import type { SocialPlatform } from '@/types';

/**
 * Club configuration.
 *
 * Anything the club has not confirmed is a TBD token — the UI hides or neutrally
 * marks those values instead of inventing content. Values stored in the
 * `settings` table override this file at runtime (see `server/services/settings`).
 */
export const clanConfig = {
  name: 'Fairy Tight',
  shortName: 'FT',
  type: 'Reitclub • Team • Community in Star Stable Online',

  /** Long form club text. Editable from /admin → Einstellungen. */
  description: TBD.CLAN_DESCRIPTION,
  history: TBD.CLAN_HISTORY,
  foundedAt: TBD.CLAN_FOUNDED,

  /** Werte / Ziele: leer, bis der Club sie liefert. Wird hier nie erfunden. */
  values: [] as { title: string; text: string }[],
  goals: [] as { title: string; text: string }[],

  contactEmail: TBD.CONTACT_EMAIL,
} as const;

/**
 * Social links. A platform is rendered ONLY when its URL is real
 * (see `isTBD`) — placeholders never become dead links in the UI.
 */
export const socialLinks: { platform: SocialPlatform; label: string; url: string }[] = [
  { platform: 'discord', label: 'Discord', url: TBD.DISCORD_URL },
  { platform: 'youtube', label: 'YouTube', url: TBD.YOUTUBE_URL },
  { platform: 'twitch', label: 'Twitch', url: TBD.TWITCH_URL },
  { platform: 'instagram', label: 'Instagram', url: TBD.INSTAGRAM_URL },
  { platform: 'tiktok', label: 'TikTok', url: TBD.TIKTOK_URL },
  { platform: 'x', label: 'X', url: TBD.X_URL },
  { platform: 'facebook', label: 'Facebook', url: TBD.FACEBOOK_URL },
  { platform: 'steam', label: 'Steam', url: TBD.STEAM_URL },
];

/**
 * Bestätigte Mitglieder.
 *
 * Hier stehen nur Personen, die der Club wirklich genannt hat. Weitere
 * Mitglieder existieren, ihre Namen liegen aber noch nicht vor — sie kommen
 * hier dazu, sobald sie bestätigt sind. Alles andere auf /members kommt aus
 * der Datenbank und ist dort als `is_demo` markiert, wo es Platzhalter ist.
 */
export const knownMembers = [
  {
    slug: 'florian',
    username: 'Florian',
    displayName: 'Florian Clever',
    role: TBD.ROLE,
    rank: null as string | null, // Rang noch nicht bestätigt
  },
];

/** Voraussetzungen auf /join. Bewusst allgemein und sachlich, jederzeit änderbar. */
export const joinRequirements: string[] = [
  'Ein Discord-Account — der Club stimmt sich über Discord ab.',
  'Ein eigener Charakter in Star Stable Online.',
  'Regelmäßig Zeit für gemeinsame Ausritte und Clubtermine.',
  'Respektvoller Umgang mit Mitgliedern und anderen Reiterinnen und Reitern.',
];

export const joinSteps: { title: string; text: string }[] = [
  { title: 'Bewerbung', text: 'Füll das Formular unten mit deinem Reiterprofil aus.' },
  { title: 'Prüfung', text: 'Jemand aus der Clubleitung sieht sich deine Bewerbung an.' },
  { title: 'Gespräch', text: 'Wir laden dich zu einem kurzen Kennenlernen auf Discord ein.' },
  { title: 'Proberitt', text: 'Du reitest eine Weile mit uns mit und wirst Teil des Clubs.' },
];
