import { asc, desc, eq, sql } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';
import { schema, type Database } from '../database/client';
import {
  achievementSchema, eventSchema, gameSchema, mediaSchema, memberSchema, newsSchema, rankSchema,
} from '../validation/schemas';
import { fromIso } from '../services/mappers';
import { toDateTimeLocal } from '@/lib/format';
import type { Permission } from '@/data/permissions';

/**
 * Resource registry
 * =================
 * The admin area is data-driven: every managed entity is described once here
 * (columns, form fields, validation, mapping) and a single set of pages renders
 * list/create/edit/delete for all of them. Adding a new managed entity means
 * adding one entry — no new pages, no copy-pasted CRUD.
 */

export type FieldType =
  | 'text' | 'textarea' | 'email' | 'url' | 'number' | 'select' | 'checkbox' | 'datetime-local';

export interface FieldDef {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  hint?: string;
  options?: { value: string; label: string }[];
  /** Options resolved at render time (e.g. the list of games). */
  optionsFrom?: 'games' | 'ranks' | 'newsCategories';
  maxlength?: number;
}

export interface ColumnDef {
  key: string;
  label: string;
  /** Rendered as a muted secondary line under the primary value. */
  secondary?: boolean;
}

export interface ResourceDef {
  key: string;
  label: string;
  singular: string;
  permission: Permission;
  idPrefix: string;
  table: SQLiteTable;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<any>;
  fields: FieldDef[];
  columns: ColumnDef[];
  canCreate: boolean;
  canDelete: boolean;
  /** Loads rows for the list view. */
  list: (db: Database) => Promise<Record<string, unknown>[]>;
  /** Loads one row for the edit form. */
  find: (db: Database, id: string) => Promise<Record<string, unknown> | null>;
  /** Maps validated form input to database columns. */
  toRow: (input: Record<string, string>) => Record<string, unknown>;
  /** Maps a database row back to form values. */
  toForm: (row: Record<string, unknown>) => Record<string, string>;
}

const str = (value: unknown): string => (value === null || value === undefined ? '' : String(value));
const bool = (value: unknown): string => (value ? 'true' : '');
const orNull = (value: string | undefined): string | null => (value && value !== '' ? value : null);
const checkbox = (value: string | undefined): boolean => value === 'true' || value === 'on';

const statusOptions = {
  presence: [
    { value: 'online', label: 'Online' },
    { value: 'away', label: 'Away' },
    { value: 'dnd', label: 'Do not disturb' },
    { value: 'offline', label: 'Offline' },
  ],
  game: [
    { value: 'active', label: 'Active' },
    { value: 'casual', label: 'Casual' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'planned', label: 'Planned' },
  ],
  event: [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'live', label: 'Live' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  news: [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
  ],
  mediaCategory: [
    { value: 'screenshots', label: 'Screenshots' },
    { value: 'clan', label: 'Clan' },
    { value: 'events', label: 'Events' },
    { value: 'games', label: 'Games' },
    { value: 'videos', label: 'Videos' },
    { value: 'artwork', label: 'Artwork' },
  ],
  mediaKind: [
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
  ],
  provider: [
    { value: '', label: '—' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'twitch', label: 'Twitch' },
    { value: 'local', label: 'Local file' },
  ],
  application: [
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under review' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'declined', label: 'Declined' },
  ],
  tone: [
    { value: 'primary', label: 'Primary' },
    { value: 'secondary', label: 'Secondary' },
    { value: 'accent', label: 'Accent' },
    { value: 'neutral', label: 'Neutral' },
  ],
};

const applicationAdminSchema = z.object({
  status: z.enum(['submitted', 'under_review', 'accepted', 'declined']),
  note: z.string().trim().max(2000).optional().or(z.literal('')),
});

export const resources: Record<string, ResourceDef> = {
  members: {
    key: 'members',
    label: 'Members',
    singular: 'Member',
    permission: 'manage_members',
    idPrefix: 'mbr',
    table: schema.members,
    schema: memberSchema,
    canCreate: true,
    canDelete: true,
    columns: [
      { key: 'username', label: 'Username' },
      { key: 'displayName', label: 'Display name', secondary: true },
      { key: 'rank', label: 'Rank' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'username', label: 'Username', required: true, maxlength: 40 },
      { name: 'slug', label: 'Slug', required: true, hint: 'URL segment, e.g. "florian".' },
      { name: 'displayName', label: 'Display name', maxlength: 60 },
      { name: 'rank', label: 'Rank', type: 'select', optionsFrom: 'ranks' },
      { name: 'status', label: 'Status', type: 'select', options: statusOptions.presence, required: true },
      { name: 'role', label: 'Role', maxlength: 60, hint: 'Free text, e.g. "Content" — leave empty if unknown.' },
      { name: 'mainGame', label: 'Main game', maxlength: 80 },
      { name: 'avatarUrl', label: 'Avatar URL', type: 'url' },
      { name: 'joinedAt', label: 'Joined', type: 'datetime-local' },
      { name: 'bio', label: 'Bio', type: 'textarea', maxlength: 2000 },
      { name: 'isVisible', label: 'Visible on the site', type: 'checkbox' },
      { name: 'isDemo', label: 'Mark as demo content', type: 'checkbox' },
    ],
    list: (db) => db.select().from(schema.members).orderBy(asc(schema.members.sortOrder), asc(schema.members.username)),
    find: async (db, id) =>
      (await db.select().from(schema.members).where(eq(schema.members.id, id)).limit(1))[0] ?? null,
    toRow: (input) => ({
      slug: input.slug,
      username: input.username,
      displayName: orNull(input.displayName),
      rank: orNull(input.rank),
      status: input.status,
      role: orNull(input.role),
      mainGame: orNull(input.mainGame),
      avatarUrl: orNull(input.avatarUrl),
      joinedAt: fromIso(input.joinedAt),
      bio: orNull(input.bio),
      isVisible: checkbox(input.isVisible),
      isDemo: checkbox(input.isDemo),
      updatedAt: Math.floor(Date.now() / 1000),
    }),
    toForm: (row) => ({
      slug: str(row.slug),
      username: str(row.username),
      displayName: str(row.displayName),
      rank: str(row.rank),
      status: str(row.status),
      role: str(row.role),
      mainGame: str(row.mainGame),
      avatarUrl: str(row.avatarUrl),
      joinedAt: row.joinedAt ? toDateTimeLocal(new Date(Number(row.joinedAt) * 1000).toISOString()) : '',
      bio: str(row.bio),
      isVisible: bool(row.isVisible),
      isDemo: bool(row.isDemo),
    }),
  },

  games: {
    key: 'games',
    label: 'Games',
    singular: 'Game',
    permission: 'manage_games',
    idPrefix: 'gam',
    table: schema.games,
    schema: gameSchema,
    canCreate: true,
    canDelete: true,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'genre', label: 'Genre', secondary: true },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'name', label: 'Name', required: true, maxlength: 80 },
      { name: 'slug', label: 'Slug', required: true },
      { name: 'genre', label: 'Genre', maxlength: 60 },
      { name: 'platforms', label: 'Platforms', hint: 'Comma separated, e.g. "PC, PS5".' },
      { name: 'coverUrl', label: 'Cover URL', type: 'url' },
      { name: 'status', label: 'Status', type: 'select', options: statusOptions.game, required: true },
      { name: 'description', label: 'Description', type: 'textarea', maxlength: 2000 },
      { name: 'isDemo', label: 'Mark as demo content', type: 'checkbox' },
    ],
    list: (db) => db.select().from(schema.games).orderBy(asc(schema.games.sortOrder), asc(schema.games.name)),
    find: async (db, id) =>
      (await db.select().from(schema.games).where(eq(schema.games.id, id)).limit(1))[0] ?? null,
    toRow: (input) => ({
      slug: input.slug,
      name: input.name,
      genre: orNull(input.genre),
      platforms: JSON.stringify(
        (input.platforms ?? '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      ),
      coverUrl: orNull(input.coverUrl),
      status: input.status,
      description: orNull(input.description),
      isDemo: checkbox(input.isDemo),
    }),
    toForm: (row) => {
      let platforms: string[] = [];
      try {
        const parsed = JSON.parse(str(row.platforms) || '[]');
        if (Array.isArray(parsed)) platforms = parsed.map(String);
      } catch {
        platforms = [];
      }
      return {
        slug: str(row.slug),
        name: str(row.name),
        genre: str(row.genre),
        platforms: platforms.join(', '),
        coverUrl: str(row.coverUrl),
        status: str(row.status),
        description: str(row.description),
        isDemo: bool(row.isDemo),
      };
    },
  },

  events: {
    key: 'events',
    label: 'Events',
    singular: 'Event',
    permission: 'manage_events',
    idPrefix: 'evt',
    table: schema.events,
    schema: eventSchema,
    canCreate: true,
    canDelete: true,
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'startsAt', label: 'Start', secondary: true },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'title', label: 'Title', required: true, maxlength: 120 },
      { name: 'slug', label: 'Slug', required: true },
      { name: 'gameId', label: 'Game', type: 'select', optionsFrom: 'games' },
      { name: 'startsAt', label: 'Start', type: 'datetime-local', required: true },
      { name: 'endsAt', label: 'End', type: 'datetime-local' },
      { name: 'hostName', label: 'Host', maxlength: 80 },
      { name: 'participantLimit', label: 'Participant limit', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: statusOptions.event, required: true },
      { name: 'description', label: 'Description', type: 'textarea', maxlength: 4000 },
      { name: 'isDemo', label: 'Mark as demo content', type: 'checkbox' },
    ],
    list: (db) => db.select().from(schema.events).orderBy(desc(schema.events.startsAt)),
    find: async (db, id) =>
      (await db.select().from(schema.events).where(eq(schema.events.id, id)).limit(1))[0] ?? null,
    toRow: (input) => ({
      slug: input.slug,
      title: input.title,
      description: orNull(input.description),
      gameId: orNull(input.gameId),
      startsAt: fromIso(input.startsAt) ?? Math.floor(Date.now() / 1000),
      endsAt: fromIso(input.endsAt),
      hostName: orNull(input.hostName),
      participantLimit: input.participantLimit ? Number(input.participantLimit) : null,
      status: input.status,
      isDemo: checkbox(input.isDemo),
    }),
    toForm: (row) => ({
      slug: str(row.slug),
      title: str(row.title),
      description: str(row.description),
      gameId: str(row.gameId),
      startsAt: row.startsAt ? toDateTimeLocal(new Date(Number(row.startsAt) * 1000).toISOString()) : '',
      endsAt: row.endsAt ? toDateTimeLocal(new Date(Number(row.endsAt) * 1000).toISOString()) : '',
      hostName: str(row.hostName),
      participantLimit: str(row.participantLimit),
      status: str(row.status),
      isDemo: bool(row.isDemo),
    }),
  },

  news: {
    key: 'news',
    label: 'News',
    singular: 'Article',
    permission: 'manage_news',
    idPrefix: 'nws',
    table: schema.news,
    schema: newsSchema,
    canCreate: true,
    canDelete: true,
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'categoryId', label: 'Category', secondary: true },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'title', label: 'Title', required: true, maxlength: 160 },
      { name: 'slug', label: 'Slug', required: true },
      { name: 'categoryId', label: 'Category', type: 'select', optionsFrom: 'newsCategories' },
      { name: 'teaser', label: 'Teaser', type: 'textarea', maxlength: 300 },
      { name: 'content', label: 'Content', type: 'textarea', maxlength: 40000, hint: 'Plain text. **bold**, *italic*, ## headings and - lists are supported.' },
      { name: 'imageUrl', label: 'Image URL', type: 'url' },
      { name: 'tags', label: 'Tags', hint: 'Comma separated.' },
      { name: 'status', label: 'Status', type: 'select', options: statusOptions.news, required: true },
      { name: 'isDemo', label: 'Mark as demo content', type: 'checkbox' },
    ],
    list: (db) => db.select().from(schema.news).orderBy(desc(schema.news.createdAt)),
    find: async (db, id) =>
      (await db.select().from(schema.news).where(eq(schema.news.id, id)).limit(1))[0] ?? null,
    toRow: (input) => ({
      slug: input.slug,
      title: input.title,
      teaser: orNull(input.teaser),
      content: input.content ?? '',
      categoryId: orNull(input.categoryId),
      imageUrl: orNull(input.imageUrl),
      tags: JSON.stringify(
        (input.tags ?? '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      ),
      status: input.status,
      // Publishing stamps the date once; drafts keep it empty.
      publishedAt: input.status === 'published' ? Math.floor(Date.now() / 1000) : null,
      isDemo: checkbox(input.isDemo),
      updatedAt: Math.floor(Date.now() / 1000),
    }),
    toForm: (row) => {
      let tags: string[] = [];
      try {
        const parsed = JSON.parse(str(row.tags) || '[]');
        if (Array.isArray(parsed)) tags = parsed.map(String);
      } catch {
        tags = [];
      }
      return {
        slug: str(row.slug),
        title: str(row.title),
        teaser: str(row.teaser),
        content: str(row.content),
        categoryId: str(row.categoryId),
        imageUrl: str(row.imageUrl),
        tags: tags.join(', '),
        status: str(row.status),
        isDemo: bool(row.isDemo),
      };
    },
  },

  media: {
    key: 'media',
    label: 'Media',
    singular: 'Media item',
    permission: 'manage_media',
    idPrefix: 'med',
    table: schema.media,
    schema: mediaSchema,
    canCreate: true,
    canDelete: true,
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category', secondary: true },
      { key: 'kind', label: 'Type' },
    ],
    fields: [
      { name: 'title', label: 'Title', required: true, maxlength: 120 },
      { name: 'category', label: 'Category', type: 'select', options: statusOptions.mediaCategory, required: true },
      { name: 'kind', label: 'Type', type: 'select', options: statusOptions.mediaKind, required: true },
      { name: 'url', label: 'URL', type: 'url', required: true },
      { name: 'thumbnailUrl', label: 'Thumbnail URL', type: 'url' },
      { name: 'provider', label: 'Video provider', type: 'select', options: statusOptions.provider },
      { name: 'isDemo', label: 'Mark as demo content', type: 'checkbox' },
    ],
    list: (db) => db.select().from(schema.media).orderBy(desc(schema.media.createdAt)),
    find: async (db, id) =>
      (await db.select().from(schema.media).where(eq(schema.media.id, id)).limit(1))[0] ?? null,
    toRow: (input) => ({
      title: input.title,
      category: input.category,
      kind: input.kind,
      url: input.url,
      thumbnailUrl: orNull(input.thumbnailUrl),
      provider: orNull(input.provider),
      isDemo: checkbox(input.isDemo),
    }),
    toForm: (row) => ({
      title: str(row.title),
      category: str(row.category),
      kind: str(row.kind),
      url: str(row.url),
      thumbnailUrl: str(row.thumbnailUrl),
      provider: str(row.provider),
      isDemo: bool(row.isDemo),
    }),
  },

  achievements: {
    key: 'achievements',
    label: 'Achievements',
    singular: 'Achievement',
    permission: 'manage_achievements',
    idPrefix: 'ach',
    table: schema.achievements,
    schema: achievementSchema,
    canCreate: true,
    canDelete: true,
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'achievedAt', label: 'Date', secondary: true },
    ],
    fields: [
      { name: 'title', label: 'Title', required: true, maxlength: 120 },
      { name: 'slug', label: 'Slug', required: true },
      { name: 'icon', label: 'Icon', maxlength: 20, hint: 'A single emoji, e.g. 🏆.' },
      { name: 'gameId', label: 'Game', type: 'select', optionsFrom: 'games' },
      { name: 'achievedAt', label: 'Achieved on', type: 'datetime-local' },
      { name: 'description', label: 'Description', type: 'textarea', maxlength: 1000 },
      { name: 'isDemo', label: 'Mark as placeholder', type: 'checkbox' },
    ],
    list: (db) => db.select().from(schema.achievements).orderBy(desc(schema.achievements.achievedAt)),
    find: async (db, id) =>
      (await db.select().from(schema.achievements).where(eq(schema.achievements.id, id)).limit(1))[0] ?? null,
    toRow: (input) => ({
      slug: input.slug,
      title: input.title,
      description: orNull(input.description),
      icon: orNull(input.icon),
      gameId: orNull(input.gameId),
      achievedAt: fromIso(input.achievedAt),
      isDemo: checkbox(input.isDemo),
    }),
    toForm: (row) => ({
      slug: str(row.slug),
      title: str(row.title),
      description: str(row.description),
      icon: str(row.icon),
      gameId: str(row.gameId),
      achievedAt: row.achievedAt
        ? toDateTimeLocal(new Date(Number(row.achievedAt) * 1000).toISOString())
        : '',
      isDemo: bool(row.isDemo),
    }),
  },

  ranks: {
    key: 'ranks',
    label: 'Ranks',
    singular: 'Rank',
    permission: 'manage_roles',
    idPrefix: '',
    table: schema.ranks,
    schema: rankSchema,
    canCreate: true,
    canDelete: true,
    columns: [
      { key: 'label', label: 'Label' },
      { key: 'id', label: 'Key', secondary: true },
      { key: 'sortOrder', label: 'Order' },
    ],
    fields: [
      { name: 'label', label: 'Label', required: true, maxlength: 40 },
      { name: 'id', label: 'Key', required: true, hint: 'Lowercase, e.g. "co_leader". Cannot be changed later.' },
      { name: 'sortOrder', label: 'Order', type: 'number', required: true, hint: 'Lower value = higher in the hierarchy.' },
      { name: 'tone', label: 'Colour', type: 'select', options: statusOptions.tone, required: true },
    ],
    list: (db) => db.select().from(schema.ranks).orderBy(asc(schema.ranks.sortOrder)),
    find: async (db, id) =>
      (await db.select().from(schema.ranks).where(eq(schema.ranks.id, id)).limit(1))[0] ?? null,
    toRow: (input) => ({
      id: input.id,
      label: input.label,
      sortOrder: Number(input.sortOrder ?? 100),
      tone: input.tone,
    }),
    toForm: (row) => ({
      id: str(row.id),
      label: str(row.label),
      sortOrder: str(row.sortOrder),
      tone: str(row.tone),
    }),
  },

  applications: {
    key: 'applications',
    label: 'Applications',
    singular: 'Application',
    permission: 'manage_applications',
    idPrefix: 'app',
    table: schema.applications,
    schema: applicationAdminSchema,
    canCreate: false,
    canDelete: true,
    columns: [
      { key: 'username', label: 'Username' },
      { key: 'discordUsername', label: 'Discord', secondary: true },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'status', label: 'Status', type: 'select', options: statusOptions.application, required: true },
      { name: 'note', label: 'Internal note', type: 'textarea', maxlength: 2000 },
    ],
    list: (db) => db.select().from(schema.applications).orderBy(desc(schema.applications.createdAt)),
    find: async (db, id) =>
      (await db.select().from(schema.applications).where(eq(schema.applications.id, id)).limit(1))[0] ?? null,
    toRow: (input) => ({
      status: input.status,
      note: orNull(input.note),
      updatedAt: Math.floor(Date.now() / 1000),
    }),
    toForm: (row) => ({ status: str(row.status), note: str(row.note) }),
  },
};

export function getResource(key: string | undefined): ResourceDef | null {
  if (!key) return null;
  return resources[key] ?? null;
}

/** Counts used on the admin overview. */
export async function adminCounts(db: Database) {
  const count = async (table: SQLiteTable) => {
    const rows = await db.select({ value: sql<number>`count(*)` }).from(table);
    return Number(rows[0]?.value ?? 0);
  };
  const [members, games, events, news, media, achievements, applications, messages] =
    await Promise.all([
      count(schema.members),
      count(schema.games),
      count(schema.events),
      count(schema.news),
      count(schema.media),
      count(schema.achievements),
      count(schema.applications),
      count(schema.contactMessages),
    ]);
  return { members, games, events, news, media, achievements, applications, messages };
}
