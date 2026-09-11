import type {
  Achievement, ClanEvent, Game, MediaItem, Member, NewsArticle,
  EventStatus, GameStatus, MediaCategory, MediaKind, NewsStatus,
  PresenceStatus, VideoProvider,
} from '@/types';

/** Unix seconds → ISO string, tolerant of nulls. */
export function toIso(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined) return null;
  return new Date(seconds * 1000).toISOString();
}

export function fromIso(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

const PRESENCE: PresenceStatus[] = ['online', 'away', 'dnd', 'offline'];
const GAME_STATUS: GameStatus[] = ['active', 'casual', 'inactive', 'planned'];
const EVENT_STATUS: EventStatus[] = ['upcoming', 'live', 'completed', 'cancelled'];
const NEWS_STATUS: NewsStatus[] = ['draft', 'published'];
const MEDIA_CATEGORY: MediaCategory[] = ['screenshots', 'clan', 'events', 'games', 'videos', 'artwork'];
const MEDIA_KIND: MediaKind[] = ['image', 'video'];
const VIDEO_PROVIDER: VideoProvider[] = ['youtube', 'twitch', 'local'];

function oneOf<T extends string>(allowed: T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export const asPresence = (v: unknown) => oneOf(PRESENCE, v, 'offline');
export const asGameStatus = (v: unknown) => oneOf(GAME_STATUS, v, 'planned');
export const asEventStatus = (v: unknown) => oneOf(EVENT_STATUS, v, 'upcoming');
export const asNewsStatus = (v: unknown) => oneOf(NEWS_STATUS, v, 'draft');
export const asMediaCategory = (v: unknown) => oneOf(MEDIA_CATEGORY, v, 'screenshots');
export const asMediaKind = (v: unknown) => oneOf(MEDIA_KIND, v, 'image');
export const asVideoProvider = (v: unknown) =>
  VIDEO_PROVIDER.includes(v as VideoProvider) ? (v as VideoProvider) : null;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapMember(row: any): Member {
  return {
    id: row.id,
    slug: row.slug,
    username: row.username,
    displayName: row.displayName ?? null,
    rank: row.rank ?? '',
    status: asPresence(row.status),
    role: row.role ?? null,
    bio: row.bio ?? null,
    avatarUrl: row.avatarUrl ?? null,
    mainGame: row.mainGame ?? null,
    joinedAt: toIso(row.joinedAt),
    isDemo: Boolean(row.isDemo),
  };
}

export function mapGame(row: any): Game {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    genre: row.genre ?? null,
    platforms: parseJsonArray(row.platforms),
    coverUrl: row.coverUrl ?? null,
    description: row.description ?? null,
    status: asGameStatus(row.status),
    memberCount: typeof row.memberCount === 'number' ? row.memberCount : undefined,
    isDemo: Boolean(row.isDemo),
  };
}

export function mapEvent(row: any): ClanEvent {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? null,
    gameSlug: row.gameSlug ?? null,
    gameName: row.gameName ?? null,
    startsAt: toIso(row.startsAt) ?? new Date().toISOString(),
    endsAt: toIso(row.endsAt),
    hostName: row.hostName ?? null,
    participantLimit: row.participantLimit ?? null,
    participantCount: Number(row.participantCount ?? 0),
    status: asEventStatus(row.status),
    isDemo: Boolean(row.isDemo),
  };
}

export function mapNews(row: any): NewsArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    teaser: row.teaser ?? null,
    content: row.content ?? '',
    category: row.categoryLabel ?? row.categoryId ?? 'general',
    authorName: row.authorName ?? null,
    imageUrl: row.imageUrl ?? null,
    tags: parseJsonArray(row.tags),
    status: asNewsStatus(row.status),
    publishedAt: toIso(row.publishedAt),
    isDemo: Boolean(row.isDemo),
  };
}

export function mapMedia(row: any): MediaItem {
  return {
    id: row.id,
    title: row.title,
    category: asMediaCategory(row.category),
    kind: asMediaKind(row.kind),
    url: row.url,
    thumbnailUrl: row.thumbnailUrl ?? null,
    provider: asVideoProvider(row.provider),
    width: row.width ?? null,
    height: row.height ?? null,
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
    isDemo: Boolean(row.isDemo),
  };
}

export function mapAchievement(row: any, memberIds: string[] = []): Achievement {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? null,
    icon: row.icon ?? null,
    gameSlug: row.gameSlug ?? null,
    achievedAt: toIso(row.achievedAt),
    memberIds,
    isDemo: Boolean(row.isDemo),
  };
}
