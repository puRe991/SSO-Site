import type {
  ApplicationStatus,
  EventStatus,
  GameStatus,
  MediaKind,
  NewsStatus,
} from '@/types';

/**
 * Deutsche Beschriftungen für die Status-Werte aus der Datenbank.
 *
 * Die gespeicherten Werte bleiben englisch (`active`, `upcoming`, …), damit
 * Datenbank, API und Filter-URLs stabil bleiben — übersetzt wird erst bei der
 * Ausgabe. Ein unbekannter Wert wird unverändert durchgereicht statt verschluckt.
 */
export const gameStatusLabels: Record<GameStatus, string> = {
  active: 'Aktiv',
  casual: 'Gelegentlich',
  inactive: 'Pausiert',
  planned: 'Geplant',
};

export const eventStatusLabels: Record<EventStatus, string> = {
  upcoming: 'Geplant',
  live: 'Läuft gerade',
  completed: 'Vorbei',
  cancelled: 'Abgesagt',
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  submitted: 'Eingegangen',
  under_review: 'In Prüfung',
  accepted: 'Angenommen',
  declined: 'Abgelehnt',
};

export const newsStatusLabels: Record<NewsStatus, string> = {
  draft: 'Entwurf',
  published: 'Veröffentlicht',
};

export const mediaKindLabels: Record<MediaKind, string> = {
  image: 'Bild',
  video: 'Video',
};

function lookup<T extends string>(map: Record<T, string>, value: string | null | undefined): string {
  if (!value) return '—';
  return (map as Record<string, string>)[value] ?? value;
}

export const gameStatusLabel = (value: string | null | undefined) =>
  lookup(gameStatusLabels, value);
export const eventStatusLabel = (value: string | null | undefined) =>
  lookup(eventStatusLabels, value);
export const applicationStatusLabel = (value: string | null | undefined) =>
  lookup(applicationStatusLabels, value);
export const newsStatusLabel = (value: string | null | undefined) =>
  lookup(newsStatusLabels, value);
export const mediaKindLabel = (value: string | null | undefined) =>
  lookup(mediaKindLabels, value);

/** „1 Mitglied“ / „4 Mitglieder“ und Ähnliches ohne Sonderfälle im Template. */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
