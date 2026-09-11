import type { Rank } from '@/types';

/**
 * Rangordnung — nur ein technischer Standard.
 *
 * Diese Ränge sind ein änderbarer Vorschlag, KEINE Aussage darüber, welche
 * Ränge der Club wirklich benutzt. Ränge aus der Tabelle `ranks` überschreiben
 * diese Liste zur Laufzeit — umbenennen, umsortieren, ergänzen und löschen geht
 * also ohne Codeänderung.
 */
export const defaultRanks: Rank[] = [
  { id: 'owner', label: 'Clubleitung', order: 10, tone: 'primary' },
  { id: 'co_owner', label: 'Stellvertretende Leitung', order: 20, tone: 'primary' },
  { id: 'leader', label: 'Stallleitung', order: 30, tone: 'secondary' },
  { id: 'co_leader', label: 'Trainingsleitung', order: 40, tone: 'secondary' },
  { id: 'admin', label: 'Administration', order: 50, tone: 'accent' },
  { id: 'moderator', label: 'Moderation', order: 60, tone: 'accent' },
  { id: 'officer', label: 'Turnierleitung', order: 70, tone: 'accent' },
  { id: 'member', label: 'Mitglied', order: 80, tone: 'neutral' },
  { id: 'trial', label: 'Probemitglied', order: 90, tone: 'neutral' },
];

export function rankById(ranks: Rank[], id: string | null | undefined): Rank | undefined {
  if (!id) return undefined;
  return ranks.find((r) => r.id === id);
}

export function rankLabel(ranks: Rank[], id: string | null | undefined): string | undefined {
  return rankById(ranks, id)?.label;
}

/**
 * Club-Stufen — Platzhalternamen für das optionale XP-System.
 * Solange es keine echte Datenquelle gibt, werden nirgends XP angezeigt.
 */
export const xpLevels = [
  { level: 1, name: 'Neuling', minXp: 0 },
  { level: 2, name: 'Stallhilfe', minXp: 1000 },
  { level: 3, name: 'Erfahrenes Mitglied', minXp: 5000 },
  { level: 4, name: 'Champion', minXp: 15000 },
] as const;

export function levelForXp(xp: number) {
  return [...xpLevels].reverse().find((l) => xp >= l.minXp) ?? xpLevels[0];
}
