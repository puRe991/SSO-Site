import { sqliteTable, text, integer, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const now = sql`(unixepoch())`;

/* ------------------------------------------------------------------ auth -- */

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    emailNormalized: text('email_normalized').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').notNull().default('user'),
    memberId: text('member_id').references(() => members.id, { onDelete: 'set null' }),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    lastLoginAt: integer('last_login_at'),
    createdAt: integer('created_at').notNull().default(now),
    updatedAt: integer('updated_at').notNull().default(now),
  },
  (t) => [uniqueIndex('users_email_norm_idx').on(t.emailNormalized)],
);

export const sessions = sqliteTable(
  'sessions',
  {
    /** SHA-256 of the session token. The raw token only ever lives in the cookie. */
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at').notNull(),
    createdAt: integer('created_at').notNull().default(now),
    userAgent: text('user_agent'),
  },
  (t) => [index('sessions_user_idx').on(t.userId), index('sessions_expires_idx').on(t.expiresAt)],
);

/** Fixed-window rate limiting, keyed by `action:identifier`. */
export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  windowStart: integer('window_start').notNull(),
});

/* --------------------------------------------------------------- people -- */

export const ranks = sqliteTable('ranks', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(100),
  tone: text('tone').notNull().default('neutral'),
});

export const members = sqliteTable(
  'members',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    username: text('username').notNull(),
    displayName: text('display_name'),
    rank: text('rank').references(() => ranks.id, { onDelete: 'set null' }),
    status: text('status').notNull().default('offline'),
    role: text('role'),
    bio: text('bio'),
    avatarUrl: text('avatar_url'),
    mainGame: text('main_game'),
    joinedAt: integer('joined_at'),
    xp: integer('xp').notNull().default(0),
    sortOrder: integer('sort_order').notNull().default(100),
    isVisible: integer('is_visible', { mode: 'boolean' }).notNull().default(true),
    isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at').notNull().default(now),
    updatedAt: integer('updated_at').notNull().default(now),
  },
  (t) => [uniqueIndex('members_slug_idx').on(t.slug), index('members_rank_idx').on(t.rank)],
);

export const socialLinks = sqliteTable(
  'social_links',
  {
    id: text('id').primaryKey(),
    /** Either a member link or, when member_id is null, a clan-wide link. */
    memberId: text('member_id').references(() => members.id, { onDelete: 'cascade' }),
    platform: text('platform').notNull(),
    url: text('url').notNull(),
  },
  (t) => [index('social_member_idx').on(t.memberId)],
);

/* ---------------------------------------------------------------- games -- */

export const games = sqliteTable(
  'games',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    genre: text('genre'),
    /** JSON array of platform strings. */
    platforms: text('platforms').notNull().default('[]'),
    coverUrl: text('cover_url'),
    description: text('description'),
    status: text('status').notNull().default('planned'),
    sortOrder: integer('sort_order').notNull().default(100),
    isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at').notNull().default(now),
  },
  (t) => [uniqueIndex('games_slug_idx').on(t.slug)],
);

export const memberGames = sqliteTable(
  'member_games',
  {
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    gameId: text('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    isMain: integer('is_main', { mode: 'boolean' }).notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.memberId, t.gameId] })],
);

/* --------------------------------------------------------------- events -- */

export const events = sqliteTable(
  'events',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    gameId: text('game_id').references(() => games.id, { onDelete: 'set null' }),
    startsAt: integer('starts_at').notNull(),
    endsAt: integer('ends_at'),
    hostMemberId: text('host_member_id').references(() => members.id, { onDelete: 'set null' }),
    hostName: text('host_name'),
    participantLimit: integer('participant_limit'),
    status: text('status').notNull().default('upcoming'),
    isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at').notNull().default(now),
  },
  (t) => [uniqueIndex('events_slug_idx').on(t.slug), index('events_start_idx').on(t.startsAt)],
);

export const eventParticipants = sqliteTable(
  'event_participants',
  {
    eventId: text('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: integer('joined_at').notNull().default(now),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.userId] })],
);

/* ----------------------------------------------------------------- news -- */

export const newsCategories = sqliteTable('news_categories', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').notNull().default(100),
});

export const news = sqliteTable(
  'news',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    teaser: text('teaser'),
    content: text('content').notNull().default(''),
    categoryId: text('category_id').references(() => newsCategories.id, { onDelete: 'set null' }),
    authorUserId: text('author_user_id').references(() => users.id, { onDelete: 'set null' }),
    authorName: text('author_name'),
    imageUrl: text('image_url'),
    /** JSON array of tag strings. */
    tags: text('tags').notNull().default('[]'),
    status: text('status').notNull().default('draft'),
    publishedAt: integer('published_at'),
    isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at').notNull().default(now),
    updatedAt: integer('updated_at').notNull().default(now),
  },
  (t) => [
    uniqueIndex('news_slug_idx').on(t.slug),
    index('news_status_pub_idx').on(t.status, t.publishedAt),
  ],
);

/* ---------------------------------------------------------------- media -- */

export const media = sqliteTable(
  'media',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    category: text('category').notNull().default('screenshots'),
    kind: text('kind').notNull().default('image'),
    url: text('url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    provider: text('provider'),
    width: integer('width'),
    height: integer('height'),
    isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at').notNull().default(now),
  },
  (t) => [index('media_category_idx').on(t.category)],
);

/* --------------------------------------------------------- achievements -- */

export const achievements = sqliteTable(
  'achievements',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    icon: text('icon'),
    gameId: text('game_id').references(() => games.id, { onDelete: 'set null' }),
    achievedAt: integer('achieved_at'),
    isDemo: integer('is_demo', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at').notNull().default(now),
  },
  (t) => [uniqueIndex('achievements_slug_idx').on(t.slug)],
);

export const achievementMembers = sqliteTable(
  'achievement_members',
  {
    achievementId: text('achievement_id')
      .notNull()
      .references(() => achievements.id, { onDelete: 'cascade' }),
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.achievementId, t.memberId] })],
);

/* --------------------------------------------------------- applications -- */

export const applications = sqliteTable(
  'applications',
  {
    id: text('id').primaryKey(),
    username: text('username').notNull(),
    displayName: text('display_name'),
    country: text('country'),
    games: text('games'),
    mainGame: text('main_game'),
    discordUsername: text('discord_username').notNull(),
    motivation: text('motivation').notNull(),
    referral: text('referral'),
    status: text('status').notNull().default('submitted'),
    note: text('note'),
    reviewedByUserId: text('reviewed_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: integer('created_at').notNull().default(now),
    updatedAt: integer('updated_at').notNull().default(now),
  },
  (t) => [index('applications_status_idx').on(t.status, t.createdAt)],
);

/* -------------------------------------------------- messages & settings -- */

export const contactMessages = sqliteTable('contact_messages', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  handled: integer('handled', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull().default(now),
});

export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body'),
    href: text('href'),
    readAt: integer('read_at'),
    createdAt: integer('created_at').notNull().default(now),
  },
  (t) => [index('notifications_user_idx').on(t.userId, t.readAt)],
);

/** Key/value store for editable site content (clan text, rules, imprint, …). */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at').notNull().default(now),
});
