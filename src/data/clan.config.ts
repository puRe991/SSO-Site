import { TBD } from './tbd';
import type { SocialPlatform } from '@/types';

/**
 * Clan configuration.
 *
 * Anything not confirmed by the clan is a TBD token — the UI hides or neutrally
 * marks those values instead of inventing content. Values stored in the
 * `settings` table override this file at runtime (see `server/services/settings`).
 */
export const clanConfig = {
  name: 'Team Fairy Tight',
  shortName: 'TFT',
  type: 'Clan • Team • Guild • Gaming Community',

  /** Long form clan text. Editable from /admin → Settings. */
  description: TBD.CLAN_DESCRIPTION,
  history: TBD.CLAN_HISTORY,
  foundedAt: TBD.CLAN_FOUNDED,

  /** Values / goals: empty until the clan supplies them. Never invented here. */
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
 * Confirmed roster.
 *
 * Only people the clan has actually named belong here. Three further members
 * are known to exist but their names were not provided — add them below as
 * they are confirmed. Everything else visible on /members comes from the
 * database and is flagged `is_demo` where it is placeholder content.
 */
export const knownMembers = [
  {
    slug: 'florian',
    username: 'Florian',
    displayName: 'Florian Clever',
    role: TBD.ROLE,
    rank: null as string | null, // rank not confirmed yet
  },
];

/** Requirements shown on /join. Editable, deliberately generic and factual. */
export const joinRequirements: string[] = [
  'A Discord account — the clan coordinates through Discord.',
  'Working microphone for voice sessions.',
  'Respectful behaviour towards members and opponents.',
];

export const joinSteps: { title: string; text: string }[] = [
  { title: 'Application', text: 'Fill in the form below with your gaming profile.' },
  { title: 'Review', text: 'A team member reviews your application.' },
  { title: 'Conversation', text: 'You are invited for a short talk on Discord.' },
  { title: 'Trial', text: 'You join the team and play with us.' },
];
