import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

export type Database = DrizzleD1Database<typeof schema>;

/**
 * Wraps the D1 binding. The binding is absent when the site runs without a
 * database configured yet — callers use `hasDatabase` and fall back to empty
 * states rather than crashing or inventing data.
 */
export function getDatabase(locals: App.Locals): Database | null {
  const d1 = locals.runtime?.env?.DB;
  if (!d1) return null;
  return drizzle(d1, { schema, casing: 'snake_case' });
}

export function hasDatabase(locals: App.Locals): boolean {
  return Boolean(locals.runtime?.env?.DB);
}

export { schema };
