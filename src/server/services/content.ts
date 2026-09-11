import { and, asc, desc, eq, gte, inArray, like, lt, or, sql } from 'drizzle-orm';
import { getDatabase, schema, type Database } from '../database/client';
import { defaultRanks } from '@/data/ranks';
import type {
  Achievement, ClanEvent, ClanStats, Game, MediaItem, Member, NewsArticle, Rank,
} from '@/types';
import {
  mapAchievement, mapEvent, mapGame, mapMedia, mapMember, mapNews, parseJsonArray,
} from './mappers';

/**
 * Read layer for public content.
 *
 * Every function degrades gracefully: with no database bound, it returns the
 * empty result rather than throwing or inventing content, so the site renders
 * honest empty states before the clan has entered any data.
 */

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function emptyPage<T>(page = 1, pageSize = 12): Page<T> {
  return { items: [], total: 0, page, pageSize, totalPages: 0 };
}

/**
 * Runs a read and falls back instead of failing the page.
 *
 * A public page must never 500 because the database is mid-migration, briefly
 * unreachable, or not seeded yet — the visitor sees the same honest empty state
 * as when no data exists, and the cause is logged for the operator.
 */
async function safeRead<T>(label: string, read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    console.error(`[content:${label}]`, error);
    return fallback;
  }
}

export function db(locals: App.Locals): Database | null {
  return getDatabase(locals);
}

/* ---------------------------------------------------------------- ranks -- */

async function queryGetRanks(locals: App.Locals): Promise<Rank[]> {
  const database = db(locals);
  if (!database) return defaultRanks;
  const rows = await database.select().from(schema.ranks).orderBy(asc(schema.ranks.sortOrder));
  if (rows.length === 0) return defaultRanks;
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    order: r.sortOrder,
    tone: (['primary', 'secondary', 'accent', 'neutral'] as const).includes(r.tone as never)
      ? (r.tone as Rank['tone'])
      : 'neutral',
  }));
}

/* -------------------------------------------------------------- members -- */

export interface MemberQuery {
  rank?: string;
  status?: string;
  game?: string;
  search?: string;
  sort?: 'rank' | 'name' | 'joined';
  page?: number;
  pageSize?: number;
}

async function queryListMembers(locals: App.Locals, query: MemberQuery = {}): Promise<Page<Member>> {
  const database = db(locals);
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, query.pageSize ?? 12));
  if (!database) return emptyPage<Member>(page, pageSize);

  const filters = [eq(schema.members.isVisible, true)];
  if (query.rank) filters.push(eq(schema.members.rank, query.rank));
  if (query.status) filters.push(eq(schema.members.status, query.status));
  if (query.search) {
    const term = `%${query.search.toLowerCase()}%`;
    filters.push(
      or(
        like(sql`lower(${schema.members.username})`, term),
        like(sql`lower(coalesce(${schema.members.displayName}, ''))`, term),
      )!,
    );
  }
  if (query.game) {
    const ids = await database
      .select({ memberId: schema.memberGames.memberId })
      .from(schema.memberGames)
      .innerJoin(schema.games, eq(schema.games.id, schema.memberGames.gameId))
      .where(eq(schema.games.slug, query.game));
    const memberIds = ids.map((r) => r.memberId);
    if (memberIds.length === 0) return emptyPage<Member>(page, pageSize);
    filters.push(inArray(schema.members.id, memberIds));
  }

  const where = and(...filters);
  const orderBy =
    query.sort === 'name'
      ? [asc(schema.members.username)]
      : query.sort === 'joined'
        ? [desc(schema.members.joinedAt)]
        : [asc(schema.members.sortOrder), asc(schema.members.username)];

  const [rows, counted] = await Promise.all([
    database
      .select()
      .from(schema.members)
      .where(where)
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    database.select({ value: sql<number>`count(*)` }).from(schema.members).where(where),
  ]);

  const total = Number(counted[0]?.value ?? 0);
  return {
    items: rows.map(mapMember),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

async function queryGetMemberBySlug(locals: App.Locals, slug: string): Promise<Member | null> {
  const database = db(locals);
  if (!database) return null;

  const rows = await database
    .select()
    .from(schema.members)
    .where(and(eq(schema.members.slug, slug), eq(schema.members.isVisible, true)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const member = mapMember(row);

  const [socials, gameRows] = await Promise.all([
    database.select().from(schema.socialLinks).where(eq(schema.socialLinks.memberId, row.id)),
    database
      .select({ game: schema.games })
      .from(schema.memberGames)
      .innerJoin(schema.games, eq(schema.games.id, schema.memberGames.gameId))
      .where(eq(schema.memberGames.memberId, row.id)),
  ]);

  member.socials = socials.map((s) => ({
    platform: s.platform as never,
    label: s.platform,
    url: s.url,
  }));
  member.games = gameRows.map((g) => mapGame(g.game));
  return member;
}

/* ---------------------------------------------------------------- games -- */

async function queryListGames(
  locals: App.Locals,
  query: { status?: string; platform?: string; search?: string } = {},
): Promise<Game[]> {
  const database = db(locals);
  if (!database) return [];

  const filters = [];
  if (query.status) filters.push(eq(schema.games.status, query.status));
  if (query.search) {
    filters.push(like(sql`lower(${schema.games.name})`, `%${query.search.toLowerCase()}%`));
  }

  const rows = await database
    .select({
      game: schema.games,
      memberCount: sql<number>`(select count(*) from member_games where member_games.game_id = ${schema.games.id})`,
    })
    .from(schema.games)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(schema.games.sortOrder), asc(schema.games.name));

  let games = rows.map((r) => mapGame({ ...r.game, memberCount: Number(r.memberCount ?? 0) }));
  if (query.platform) {
    games = games.filter((g) => g.platforms.includes(query.platform!));
  }
  return games;
}

async function queryGetGameBySlug(locals: App.Locals, slug: string) {
  const database = db(locals);
  if (!database) return null;

  const rows = await database.select().from(schema.games).where(eq(schema.games.slug, slug)).limit(1);
  const row = rows[0];
  if (!row) return null;

  const [memberRows, eventRows, achievementRows] = await Promise.all([
    database
      .select({ member: schema.members })
      .from(schema.memberGames)
      .innerJoin(schema.members, eq(schema.members.id, schema.memberGames.memberId))
      .where(and(eq(schema.memberGames.gameId, row.id), eq(schema.members.isVisible, true))),
    database
      .select()
      .from(schema.events)
      .where(eq(schema.events.gameId, row.id))
      .orderBy(desc(schema.events.startsAt))
      .limit(6),
    database
      .select()
      .from(schema.achievements)
      .where(eq(schema.achievements.gameId, row.id))
      .orderBy(desc(schema.achievements.achievedAt))
      .limit(6),
  ]);

  return {
    game: mapGame(row),
    members: memberRows.map((r) => mapMember(r.member)),
    events: eventRows.map((e) => mapEvent(e)),
    achievements: achievementRows.map((a) => mapAchievement(a)),
  };
}

/* --------------------------------------------------------------- events -- */

export interface EventQuery {
  status?: string;
  game?: string;
  when?: 'upcoming' | 'past';
  limit?: number;
}

async function queryListEvents(locals: App.Locals, query: EventQuery = {}): Promise<ClanEvent[]> {
  const database = db(locals);
  if (!database) return [];

  const nowSeconds = Math.floor(Date.now() / 1000);
  const filters = [];
  if (query.status) filters.push(eq(schema.events.status, query.status));
  if (query.when === 'upcoming') filters.push(gte(schema.events.startsAt, nowSeconds));
  if (query.when === 'past') filters.push(lt(schema.events.startsAt, nowSeconds));
  if (query.game) {
    const game = await database
      .select({ id: schema.games.id })
      .from(schema.games)
      .where(eq(schema.games.slug, query.game))
      .limit(1);
    if (!game[0]) return [];
    filters.push(eq(schema.events.gameId, game[0].id));
  }

  const rows = await database
    .select({
      event: schema.events,
      gameSlug: schema.games.slug,
      gameName: schema.games.name,
      participantCount: sql<number>`(select count(*) from event_participants where event_participants.event_id = ${schema.events.id})`,
    })
    .from(schema.events)
    .leftJoin(schema.games, eq(schema.games.id, schema.events.gameId))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(query.when === 'past' ? desc(schema.events.startsAt) : asc(schema.events.startsAt))
    .limit(query.limit ?? 50);

  return rows.map((r) =>
    mapEvent({
      ...r.event,
      gameSlug: r.gameSlug,
      gameName: r.gameName,
      participantCount: Number(r.participantCount ?? 0),
    }),
  );
}

async function queryGetEventBySlug(locals: App.Locals, slug: string) {
  const database = db(locals);
  if (!database) return null;

  const rows = await database
    .select({
      event: schema.events,
      gameSlug: schema.games.slug,
      gameName: schema.games.name,
      participantCount: sql<number>`(select count(*) from event_participants where event_participants.event_id = ${schema.events.id})`,
    })
    .from(schema.events)
    .leftJoin(schema.games, eq(schema.games.id, schema.events.gameId))
    .where(eq(schema.events.slug, slug))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return mapEvent({
    ...row.event,
    gameSlug: row.gameSlug,
    gameName: row.gameName,
    participantCount: Number(row.participantCount ?? 0),
  });
}

async function queryIsParticipant(
  locals: App.Locals,
  eventId: string,
  userId: string,
): Promise<boolean> {
  const database = db(locals);
  if (!database) return false;
  const rows = await database
    .select({ eventId: schema.eventParticipants.eventId })
    .from(schema.eventParticipants)
    .where(
      and(
        eq(schema.eventParticipants.eventId, eventId),
        eq(schema.eventParticipants.userId, userId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/* ----------------------------------------------------------------- news -- */

async function queryListNews(
  locals: App.Locals,
  query: { category?: string; search?: string; page?: number; pageSize?: number; includeDrafts?: boolean } = {},
): Promise<Page<NewsArticle>> {
  const database = db(locals);
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(24, Math.max(1, query.pageSize ?? 9));
  if (!database) return emptyPage<NewsArticle>(page, pageSize);

  const filters = [];
  if (!query.includeDrafts) filters.push(eq(schema.news.status, 'published'));
  if (query.category) filters.push(eq(schema.news.categoryId, query.category));
  if (query.search) {
    const term = `%${query.search.toLowerCase()}%`;
    filters.push(
      or(
        like(sql`lower(${schema.news.title})`, term),
        like(sql`lower(coalesce(${schema.news.teaser}, ''))`, term),
      )!,
    );
  }
  const where = filters.length ? and(...filters) : undefined;

  const [rows, counted] = await Promise.all([
    database
      .select({ article: schema.news, categoryLabel: schema.newsCategories.label })
      .from(schema.news)
      .leftJoin(schema.newsCategories, eq(schema.newsCategories.id, schema.news.categoryId))
      .where(where)
      .orderBy(desc(schema.news.publishedAt), desc(schema.news.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    database.select({ value: sql<number>`count(*)` }).from(schema.news).where(where),
  ]);

  const total = Number(counted[0]?.value ?? 0);
  return {
    items: rows.map((r) => mapNews({ ...r.article, categoryLabel: r.categoryLabel })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

async function queryGetNewsBySlug(locals: App.Locals, slug: string): Promise<NewsArticle | null> {
  const database = db(locals);
  if (!database) return null;
  const rows = await database
    .select({ article: schema.news, categoryLabel: schema.newsCategories.label })
    .from(schema.news)
    .leftJoin(schema.newsCategories, eq(schema.newsCategories.id, schema.news.categoryId))
    .where(and(eq(schema.news.slug, slug), eq(schema.news.status, 'published')))
    .limit(1);
  const row = rows[0];
  return row ? mapNews({ ...row.article, categoryLabel: row.categoryLabel }) : null;
}

async function queryListNewsCategories(locals: App.Locals) {
  const database = db(locals);
  if (!database) return [];
  return database.select().from(schema.newsCategories).orderBy(asc(schema.newsCategories.sortOrder));
}

/* ---------------------------------------------------------------- media -- */

async function queryListMedia(
  locals: App.Locals,
  query: { category?: string; kind?: string; limit?: number } = {},
): Promise<MediaItem[]> {
  const database = db(locals);
  if (!database) return [];
  const filters = [];
  if (query.category) filters.push(eq(schema.media.category, query.category));
  if (query.kind) filters.push(eq(schema.media.kind, query.kind));
  const rows = await database
    .select()
    .from(schema.media)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(schema.media.createdAt))
    .limit(query.limit ?? 60);
  return rows.map(mapMedia);
}

/* --------------------------------------------------------- achievements -- */

async function queryListAchievements(locals: App.Locals): Promise<Achievement[]> {
  const database = db(locals);
  if (!database) return [];
  const rows = await database
    .select({ achievement: schema.achievements, gameSlug: schema.games.slug })
    .from(schema.achievements)
    .leftJoin(schema.games, eq(schema.games.id, schema.achievements.gameId))
    .orderBy(desc(schema.achievements.achievedAt), asc(schema.achievements.title));
  return rows.map((r) => mapAchievement({ ...r.achievement, gameSlug: r.gameSlug }));
}

/* ---------------------------------------------------------------- stats -- */

async function queryGetClanStats(locals: App.Locals): Promise<ClanStats> {
  const database = db(locals);
  if (!database) {
    return { totalMembers: null, onlineMembers: null, activeGames: null, nextEvent: null };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const [total, online, activeGames, upcoming] = await Promise.all([
    database
      .select({ value: sql<number>`count(*)` })
      .from(schema.members)
      .where(eq(schema.members.isVisible, true)),
    database
      .select({ value: sql<number>`count(*)` })
      .from(schema.members)
      .where(and(eq(schema.members.isVisible, true), eq(schema.members.status, 'online'))),
    database
      .select({ value: sql<number>`count(*)` })
      .from(schema.games)
      .where(eq(schema.games.status, 'active')),
    queryListEvents(locals, { when: 'upcoming', limit: 1 }),
  ]);

  void nowSeconds;
  return {
    totalMembers: Number(total[0]?.value ?? 0),
    onlineMembers: Number(online[0]?.value ?? 0),
    activeGames: Number(activeGames[0]?.value ?? 0),
    nextEvent: upcoming[0] ?? null,
  };
}

/* --------------------------------------------------------------- search -- */

export interface SearchResult {
  type: 'member' | 'game' | 'event' | 'news' | 'achievement';
  title: string;
  subtitle: string | null;
  href: string;
}

async function querySearch(locals: App.Locals, term: string): Promise<SearchResult[]> {
  const database = db(locals);
  const query = term.trim().toLowerCase();
  if (!database || query.length < 2) return [];
  const pattern = `%${query}%`;

  const [members, games, events, articles, achievements] = await Promise.all([
    database
      .select()
      .from(schema.members)
      .where(and(eq(schema.members.isVisible, true), like(sql`lower(${schema.members.username})`, pattern)))
      .limit(5),
    database.select().from(schema.games).where(like(sql`lower(${schema.games.name})`, pattern)).limit(5),
    database.select().from(schema.events).where(like(sql`lower(${schema.events.title})`, pattern)).limit(5),
    database
      .select()
      .from(schema.news)
      .where(and(eq(schema.news.status, 'published'), like(sql`lower(${schema.news.title})`, pattern)))
      .limit(5),
    database
      .select()
      .from(schema.achievements)
      .where(like(sql`lower(${schema.achievements.title})`, pattern))
      .limit(5),
  ]);

  return [
    ...members.map((m) => ({
      type: 'member' as const,
      title: m.username,
      subtitle: m.displayName,
      href: `/members/${m.slug}`,
    })),
    ...games.map((g) => ({
      type: 'game' as const,
      title: g.name,
      subtitle: g.genre,
      href: `/games/${g.slug}`,
    })),
    ...events.map((e) => ({
      type: 'event' as const,
      title: e.title,
      subtitle: new Date(e.startsAt * 1000).toISOString().slice(0, 10),
      href: `/events/${e.slug}`,
    })),
    ...articles.map((n) => ({
      type: 'news' as const,
      title: n.title,
      subtitle: n.teaser,
      href: `/news/${n.slug}`,
    })),
    ...achievements.map((a) => ({
      type: 'achievement' as const,
      title: a.title,
      subtitle: a.description,
      href: `/achievements#${a.slug}`,
    })),
  ];
}

/* ------------------------------------------------------------ dashboard -- */

async function queryGetNotifications(locals: App.Locals, userId: string) {
  const database = db(locals);
  if (!database) return [];
  return database
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, userId))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(20);
}


/* ------------------------------------------------------- public read API -- */
/**
 * Every public read goes through `safeRead`. A database that is unreachable,
 * mid-migration or not seeded yet therefore produces the same honest empty
 * state as "no data exists" — a broken database never takes the site down.
 */

export const getRanks = (locals: App.Locals) =>
  safeRead('getRanks', () => queryGetRanks(locals), defaultRanks);

export const listMembers = (locals: App.Locals, query: MemberQuery = {}) =>
  safeRead(
    'listMembers',
    () => queryListMembers(locals, query),
    emptyPage<Member>(Math.max(1, query.page ?? 1), query.pageSize ?? 12),
  );

export const getMemberBySlug = (locals: App.Locals, slug: string) =>
  safeRead('getMemberBySlug', () => queryGetMemberBySlug(locals, slug), null);

export const listGames = (
  locals: App.Locals,
  query: { status?: string; platform?: string; search?: string } = {},
) => safeRead('listGames', () => queryListGames(locals, query), [] as Game[]);

export const getGameBySlug = (locals: App.Locals, slug: string) =>
  safeRead('getGameBySlug', () => queryGetGameBySlug(locals, slug), null);

export const listEvents = (locals: App.Locals, query: EventQuery = {}) =>
  safeRead('listEvents', () => queryListEvents(locals, query), [] as ClanEvent[]);

export const getEventBySlug = (locals: App.Locals, slug: string) =>
  safeRead('getEventBySlug', () => queryGetEventBySlug(locals, slug), null);

export const isParticipant = (locals: App.Locals, eventId: string, userId: string) =>
  safeRead('isParticipant', () => queryIsParticipant(locals, eventId, userId), false);

export const listNews = (
  locals: App.Locals,
  query: {
    category?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    includeDrafts?: boolean;
  } = {},
) =>
  safeRead(
    'listNews',
    () => queryListNews(locals, query),
    emptyPage<NewsArticle>(Math.max(1, query.page ?? 1), query.pageSize ?? 9),
  );

export const getNewsBySlug = (locals: App.Locals, slug: string) =>
  safeRead('getNewsBySlug', () => queryGetNewsBySlug(locals, slug), null);

export const listNewsCategories = (locals: App.Locals) =>
  safeRead('listNewsCategories', () => queryListNewsCategories(locals), [] as
    { id: string; label: string; sortOrder: number }[]);

export const listMedia = (
  locals: App.Locals,
  query: { category?: string; kind?: string; limit?: number } = {},
) => safeRead('listMedia', () => queryListMedia(locals, query), [] as MediaItem[]);

export const listAchievements = (locals: App.Locals) =>
  safeRead('listAchievements', () => queryListAchievements(locals), [] as Achievement[]);

export const getClanStats = (locals: App.Locals) =>
  safeRead('getClanStats', () => queryGetClanStats(locals), {
    totalMembers: null,
    onlineMembers: null,
    activeGames: null,
    nextEvent: null,
  } as ClanStats);

export const search = (locals: App.Locals, term: string) =>
  safeRead('search', () => querySearch(locals, term), [] as SearchResult[]);

export const getNotifications = (locals: App.Locals, userId: string) =>
  safeRead('getNotifications', () => queryGetNotifications(locals, userId), [] as
    Awaited<ReturnType<typeof queryGetNotifications>>);

export { parseJsonArray };
