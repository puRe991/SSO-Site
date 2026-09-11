/** Shared domain types. Kept framework-agnostic so both UI and API use them. */

export type PresenceStatus = 'online' | 'away' | 'dnd' | 'offline';

export type GameStatus = 'active' | 'casual' | 'inactive' | 'planned';

export type EventStatus = 'upcoming' | 'live' | 'completed' | 'cancelled';

export type ApplicationStatus = 'submitted' | 'under_review' | 'accepted' | 'declined';

export type NewsStatus = 'draft' | 'published';

export type MediaKind = 'image' | 'video';

export type MediaCategory =
  | 'screenshots'
  | 'clan'
  | 'events'
  | 'games'
  | 'videos'
  | 'artwork';

export type VideoProvider = 'youtube' | 'twitch' | 'local';

export interface Rank {
  /** Stable key used in the database. */
  id: string;
  label: string;
  /** Lower number = higher in the hierarchy. */
  order: number;
  /** Token name from the colour system, used for the rank badge. */
  tone: 'primary' | 'secondary' | 'accent' | 'neutral';
}

export interface SocialLink {
  platform: SocialPlatform;
  label: string;
  url: string;
}

export type SocialPlatform =
  | 'discord'
  | 'youtube'
  | 'twitch'
  | 'instagram'
  | 'tiktok'
  | 'x'
  | 'facebook'
  | 'steam'
  | 'github'
  | 'battlenet'
  | 'epic'
  | 'xbox'
  | 'playstation';

export interface Member {
  id: string;
  slug: string;
  username: string;
  displayName: string | null;
  rank: string;
  status: PresenceStatus;
  role: string | null;
  bio: string | null;
  avatarUrl: string | null;
  mainGame: string | null;
  joinedAt: string | null;
  isDemo: boolean;
  socials?: SocialLink[];
  games?: Game[];
}

export interface Game {
  id: string;
  slug: string;
  name: string;
  genre: string | null;
  platforms: string[];
  coverUrl: string | null;
  description: string | null;
  status: GameStatus;
  memberCount?: number;
  isDemo: boolean;
}

export interface ClanEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  gameSlug: string | null;
  gameName?: string | null;
  startsAt: string;
  endsAt: string | null;
  hostName: string | null;
  participantLimit: number | null;
  participantCount: number;
  status: EventStatus;
  isDemo: boolean;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  teaser: string | null;
  content: string;
  category: string;
  authorName: string | null;
  imageUrl: string | null;
  tags: string[];
  status: NewsStatus;
  publishedAt: string | null;
  isDemo: boolean;
}

export interface MediaItem {
  id: string;
  title: string;
  category: MediaCategory;
  kind: MediaKind;
  url: string;
  thumbnailUrl: string | null;
  provider: VideoProvider | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  isDemo: boolean;
}

export interface Achievement {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  gameSlug: string | null;
  achievedAt: string | null;
  memberIds: string[];
  isDemo: boolean;
}

export interface Application {
  id: string;
  username: string;
  displayName: string | null;
  country: string | null;
  games: string | null;
  mainGame: string | null;
  discordUsername: string;
  motivation: string;
  referral: string | null;
  status: ApplicationStatus;
  createdAt: string;
  note: string | null;
}

export interface LeaderboardEntry {
  memberId: string;
  username: string;
  slug: string;
  value: number;
}

export interface ClanStats {
  totalMembers: number | null;
  onlineMembers: number | null;
  activeGames: number | null;
  nextEvent: ClanEvent | null;
}

/** Standard envelope every `/api/*` route returns. */
export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fields?: Record<string, string> } };
