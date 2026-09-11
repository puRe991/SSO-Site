import { asc } from 'drizzle-orm';
import { schema, type Database } from '../database/client';

/** Option lists for select fields that reference other tables. */
export async function loadLookups(db: Database | null) {
  if (!db) return { games: [], ranks: [], newsCategories: [] };

  const [games, ranks, newsCategories] = await Promise.all([
    db.select({ id: schema.games.id, name: schema.games.name }).from(schema.games).orderBy(asc(schema.games.name)),
    db.select({ id: schema.ranks.id, label: schema.ranks.label }).from(schema.ranks).orderBy(asc(schema.ranks.sortOrder)),
    db
      .select({ id: schema.newsCategories.id, label: schema.newsCategories.label })
      .from(schema.newsCategories)
      .orderBy(asc(schema.newsCategories.sortOrder)),
  ]);

  return {
    games: games.map((game) => ({ value: game.id, label: game.name })),
    ranks: ranks.map((rank) => ({ value: rank.id, label: rank.label })),
    newsCategories: newsCategories.map((category) => ({ value: category.id, label: category.label })),
  };
}

export type Lookups = Awaited<ReturnType<typeof loadLookups>>;
