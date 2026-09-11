import type { Rank } from '@/types';

/**
 * Rank hierarchy — technical default only.
 *
 * These ranks are a configurable proposal, NOT a statement about ranks the clan
 * actually uses. Ranks stored in the `ranks` table override this list at runtime,
 * so the clan can rename, reorder, add or remove ranks without a code change.
 */
export const defaultRanks: Rank[] = [
  { id: 'owner', label: 'Owner', order: 10, tone: 'primary' },
  { id: 'co_owner', label: 'Co-Owner', order: 20, tone: 'primary' },
  { id: 'leader', label: 'Leader', order: 30, tone: 'secondary' },
  { id: 'co_leader', label: 'Co-Leader', order: 40, tone: 'secondary' },
  { id: 'admin', label: 'Admin', order: 50, tone: 'accent' },
  { id: 'moderator', label: 'Moderator', order: 60, tone: 'accent' },
  { id: 'officer', label: 'Officer', order: 70, tone: 'accent' },
  { id: 'member', label: 'Member', order: 80, tone: 'neutral' },
  { id: 'trial', label: 'Trial', order: 90, tone: 'neutral' },
];

export function rankById(ranks: Rank[], id: string | null | undefined): Rank | undefined {
  if (!id) return undefined;
  return ranks.find((r) => r.id === id);
}

export function rankLabel(ranks: Rank[], id: string | null | undefined): string | undefined {
  return rankById(ranks, id)?.label;
}

/**
 * Clan XP levels — placeholder names, prepared for the optional XP system.
 * No XP is displayed anywhere until a real data source exists.
 */
export const xpLevels = [
  { level: 1, name: 'Recruit', minXp: 0 },
  { level: 2, name: 'Rising Team', minXp: 1000 },
  { level: 3, name: 'Veteran', minXp: 5000 },
  { level: 4, name: 'Elite', minXp: 15000 },
] as const;

export function levelForXp(xp: number) {
  return [...xpLevels].reverse().find((l) => xp >= l.minXp) ?? xpLevels[0];
}
