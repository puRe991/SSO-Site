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
 * Ressourcen-Register
 * ===================
 * Der Adminbereich ist datengetrieben: jede verwaltete Entität wird hier genau
 * einmal beschrieben (Spalten, Formularfelder, Validierung, Mapping), und ein
 * einziger Satz Seiten rendert Liste/Anlegen/Bearbeiten/Löschen für alle. Eine
 * neue Entität heißt: ein Eintrag mehr — keine neuen Seiten, kein kopiertes CRUD.
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
  /** Optionen, die erst beim Rendern aufgelöst werden (z. B. die Disziplinenliste). */
  optionsFrom?: 'games' | 'ranks' | 'newsCategories';
  maxlength?: number;
}

export interface ColumnDef {
  key: string;
  label: string;
  /** Wird als gedämpfte zweite Zeile unter dem Hauptwert gerendert. */
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
  /** Lädt die Zeilen für die Listenansicht. */
  list: (db: Database) => Promise<Record<string, unknown>[]>;
  /** Lädt eine Zeile für das Bearbeitungsformular. */
  find: (db: Database, id: string) => Promise<Record<string, unknown> | null>;
  /** Bildet geprüfte Formulareingaben auf Datenbankspalten ab. */
  toRow: (input: Record<string, string>) => Record<string, unknown>;
  /** Bildet eine Datenbankzeile zurück auf Formularwerte ab. */
  toForm: (row: Record<string, unknown>) => Record<string, string>;
}

const str = (value: unknown): string => (value === null || value === undefined ? '' : String(value));
const bool = (value: unknown): string => (value ? 'true' : '');
const orNull = (value: string | undefined): string | null => (value && value !== '' ? value : null);
const checkbox = (value: string | undefined): boolean => value === 'true' || value === 'on';

const statusOptions = {
  presence: [
    { value: 'online', label: 'Online' },
    { value: 'away', label: 'Abwesend' },
    { value: 'dnd', label: 'Bitte nicht stören' },
    { value: 'offline', label: 'Offline' },
  ],
  game: [
    { value: 'active', label: 'Aktiv' },
    { value: 'casual', label: 'Gelegentlich' },
    { value: 'inactive', label: 'Pausiert' },
    { value: 'planned', label: 'Geplant' },
  ],
  event: [
    { value: 'upcoming', label: 'Geplant' },
    { value: 'live', label: 'Läuft gerade' },
    { value: 'completed', label: 'Vorbei' },
    { value: 'cancelled', label: 'Abgesagt' },
  ],
  news: [
    { value: 'draft', label: 'Entwurf' },
    { value: 'published', label: 'Veröffentlicht' },
  ],
  mediaCategory: [
    { value: 'screenshots', label: 'Screenshots' },
    { value: 'clan', label: 'Clubleben' },
    { value: 'events', label: 'Termine' },
    { value: 'games', label: 'Disziplinen' },
    { value: 'videos', label: 'Videos' },
    { value: 'artwork', label: 'Artwork' },
  ],
  mediaKind: [
    { value: 'image', label: 'Bild' },
    { value: 'video', label: 'Video' },
  ],
  provider: [
    { value: '', label: '—' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'twitch', label: 'Twitch' },
    { value: 'local', label: 'Eigene Datei' },
  ],
  application: [
    { value: 'submitted', label: 'Eingegangen' },
    { value: 'under_review', label: 'In Prüfung' },
    { value: 'accepted', label: 'Angenommen' },
    { value: 'declined', label: 'Abgelehnt' },
  ],
  tone: [
    { value: 'primary', label: 'Gold' },
    { value: 'secondary', label: 'Grün' },
    { value: 'accent', label: 'Türkis' },
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
    label: 'Mitglieder',
    singular: 'Mitglied',
    permission: 'manage_members',
    idPrefix: 'mbr',
    table: schema.members,
    schema: memberSchema,
    canCreate: true,
    canDelete: true,
    columns: [
      { key: 'username', label: 'Benutzername' },
      { key: 'displayName', label: 'Anzeigename', secondary: true },
      { key: 'rank', label: 'Rang' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'username', label: 'Benutzername', required: true, maxlength: 40 },
      { name: 'slug', label: 'Slug', required: true, hint: 'URL-Teil, z. B. „florian“.' },
      { name: 'displayName', label: 'Anzeigename', maxlength: 60 },
      { name: 'rank', label: 'Rang', type: 'select', optionsFrom: 'ranks' },
      { name: 'status', label: 'Status', type: 'select', options: statusOptions.presence, required: true },
      { name: 'role', label: 'Aufgabe', maxlength: 60, hint: 'Freitext, z. B. „Turnierplanung“ — leer lassen, wenn offen.' },
      { name: 'mainGame', label: 'Hauptdisziplin', maxlength: 80 },
      { name: 'avatarUrl', label: 'Avatar-URL', type: 'url' },
      { name: 'joinedAt', label: 'Dabei seit', type: 'datetime-local' },
      { name: 'bio', label: 'Über mich', type: 'textarea', maxlength: 2000 },
      { name: 'isVisible', label: 'Auf der Seite sichtbar', type: 'checkbox' },
      { name: 'isDemo', label: 'Als Demo-Inhalt markieren', type: 'checkbox' },
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
    label: 'Disziplinen',
    singular: 'Disziplin',
    permission: 'manage_games',
    idPrefix: 'gam',
    table: schema.games,
    schema: gameSchema,
    canCreate: true,
    canDelete: true,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'genre', label: 'Art', secondary: true },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'name', label: 'Name', required: true, maxlength: 80 },
      { name: 'slug', label: 'Slug', required: true },
      { name: 'genre', label: 'Art', maxlength: 60, hint: 'z. B. „Dressur“, „Springen“, „Distanzritt“.' },
      { name: 'platforms', label: 'Bereiche', hint: 'Mit Komma getrennt, z. B. „Turnier, Training“.' },
      { name: 'coverUrl', label: 'Bild-URL', type: 'url' },
      { name: 'status', label: 'Status', type: 'select', options: statusOptions.game, required: true },
      { name: 'description', label: 'Beschreibung', type: 'textarea', maxlength: 2000 },
      { name: 'isDemo', label: 'Als Demo-Inhalt markieren', type: 'checkbox' },
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
    label: 'Termine',
    singular: 'Termin',
    permission: 'manage_events',
    idPrefix: 'evt',
    table: schema.events,
    schema: eventSchema,
    canCreate: true,
    canDelete: true,
    columns: [
      { key: 'title', label: 'Titel' },
      { key: 'startsAt', label: 'Beginn', secondary: true },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'title', label: 'Titel', required: true, maxlength: 120 },
      { name: 'slug', label: 'Slug', required: true },
      { name: 'gameId', label: 'Disziplin', type: 'select', optionsFrom: 'games' },
      { name: 'startsAt', label: 'Beginn', type: 'datetime-local', required: true },
      { name: 'endsAt', label: 'Ende', type: 'datetime-local' },
      { name: 'hostName', label: 'Leitung', maxlength: 80 },
      { name: 'participantLimit', label: 'Maximale Teilnehmerzahl', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: statusOptions.event, required: true },
      { name: 'description', label: 'Beschreibung', type: 'textarea', maxlength: 4000 },
      { name: 'isDemo', label: 'Als Demo-Inhalt markieren', type: 'checkbox' },
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
    label: 'Neuigkeiten',
    singular: 'Beitrag',
    permission: 'manage_news',
    idPrefix: 'nws',
    table: schema.news,
    schema: newsSchema,
    canCreate: true,
    canDelete: true,
    columns: [
      { key: 'title', label: 'Titel' },
      { key: 'categoryId', label: 'Kategorie', secondary: true },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'title', label: 'Titel', required: true, maxlength: 160 },
      { name: 'slug', label: 'Slug', required: true },
      { name: 'categoryId', label: 'Kategorie', type: 'select', optionsFrom: 'newsCategories' },
      { name: 'teaser', label: 'Anrisstext', type: 'textarea', maxlength: 300 },
      { name: 'content', label: 'Inhalt', type: 'textarea', maxlength: 40000, hint: 'Einfacher Text. **fett**, *kursiv*, ## Überschriften und - Listen funktionieren.' },
      { name: 'imageUrl', label: 'Bild-URL', type: 'url' },
      { name: 'tags', label: 'Schlagwörter', hint: 'Mit Komma getrennt.' },
      { name: 'status', label: 'Status', type: 'select', options: statusOptions.news, required: true },
      { name: 'isDemo', label: 'Als Demo-Inhalt markieren', type: 'checkbox' },
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
      // Beim Veröffentlichen wird das Datum gesetzt; Entwürfe bleiben ohne.
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
    label: 'Galerie',
    singular: 'Eintrag',
    permission: 'manage_media',
    idPrefix: 'med',
    table: schema.media,
    schema: mediaSchema,
    canCreate: true,
    canDelete: true,
    columns: [
      { key: 'title', label: 'Titel' },
      { key: 'category', label: 'Kategorie', secondary: true },
      { key: 'kind', label: 'Typ' },
    ],
    fields: [
      { name: 'title', label: 'Titel', required: true, maxlength: 120 },
      { name: 'category', label: 'Kategorie', type: 'select', options: statusOptions.mediaCategory, required: true },
      { name: 'kind', label: 'Typ', type: 'select', options: statusOptions.mediaKind, required: true },
      { name: 'url', label: 'URL', type: 'url', required: true },
      { name: 'thumbnailUrl', label: 'Vorschaubild-URL', type: 'url' },
      { name: 'provider', label: 'Videoanbieter', type: 'select', options: statusOptions.provider },
      { name: 'isDemo', label: 'Als Demo-Inhalt markieren', type: 'checkbox' },
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
    label: 'Erfolge',
    singular: 'Erfolg',
    permission: 'manage_achievements',
    idPrefix: 'ach',
    table: schema.achievements,
    schema: achievementSchema,
    canCreate: true,
    canDelete: true,
    columns: [
      { key: 'title', label: 'Titel' },
      { key: 'achievedAt', label: 'Datum', secondary: true },
    ],
    fields: [
      { name: 'title', label: 'Titel', required: true, maxlength: 120 },
      { name: 'slug', label: 'Slug', required: true },
      { name: 'icon', label: 'Symbol', maxlength: 20, hint: 'Ein einzelnes Emoji, z. B. 🏆.' },
      { name: 'gameId', label: 'Disziplin', type: 'select', optionsFrom: 'games' },
      { name: 'achievedAt', label: 'Erreicht am', type: 'datetime-local' },
      { name: 'description', label: 'Beschreibung', type: 'textarea', maxlength: 1000 },
      { name: 'isDemo', label: 'Als Platzhalter markieren', type: 'checkbox' },
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
    label: 'Ränge',
    singular: 'Rang',
    permission: 'manage_roles',
    idPrefix: '',
    table: schema.ranks,
    schema: rankSchema,
    canCreate: true,
    canDelete: true,
    columns: [
      { key: 'label', label: 'Bezeichnung' },
      { key: 'id', label: 'Schlüssel', secondary: true },
      { key: 'sortOrder', label: 'Reihenfolge' },
    ],
    fields: [
      { name: 'label', label: 'Bezeichnung', required: true, maxlength: 40 },
      { name: 'id', label: 'Schlüssel', required: true, hint: 'Kleinbuchstaben, z. B. „co_leader“. Später nicht mehr änderbar.' },
      { name: 'sortOrder', label: 'Reihenfolge', type: 'number', required: true, hint: 'Kleinerer Wert = weiter oben in der Rangordnung.' },
      { name: 'tone', label: 'Farbe', type: 'select', options: statusOptions.tone, required: true },
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
    label: 'Bewerbungen',
    singular: 'Bewerbung',
    permission: 'manage_applications',
    idPrefix: 'app',
    table: schema.applications,
    schema: applicationAdminSchema,
    canCreate: false,
    canDelete: true,
    columns: [
      { key: 'username', label: 'Benutzername' },
      { key: 'discordUsername', label: 'Discord', secondary: true },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'status', label: 'Status', type: 'select', options: statusOptions.application, required: true },
      { name: 'note', label: 'Interne Notiz', type: 'textarea', maxlength: 2000 },
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

/** Zählwerte für die Admin-Übersicht. */
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
