/**
 * Inline icon set — SVG path data only, so it can be imported from both
 * components and TypeScript modules.
 */
export const iconPaths = {
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  'chevron-right': '<path d="m9 6 6 6-6 6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  discord:
    '<path d="M19 7.5A15 15 0 0 0 15.2 6l-.3.6a11 11 0 0 1 3 1.4 12 12 0 0 0-11.8 0 11 11 0 0 1 3-1.4L8.8 6A15 15 0 0 0 5 7.5C2.7 11 2.1 14.4 2.4 17.8A15 15 0 0 0 7 20l.9-1.4a9.7 9.7 0 0 1-1.5-.8l.4-.3a10.6 10.6 0 0 0 10.4 0l.4.3a9.7 9.7 0 0 1-1.5.8L17 20a15 15 0 0 0 4.6-2.2c.4-4-.6-7.4-2.6-10.3Z"/><circle cx="9" cy="14" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="14" r="1.3" fill="currentColor" stroke="none"/>',
  youtube:
    '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10.5 9.5 5 2.5-5 2.5z"/>',
  twitch: '<path d="M4 3h16v11l-4 4h-4l-3 3v-3H4z"/><path d="M11 8v4M16 8v4"/>',
  instagram:
    '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none"/>',
  tiktok: '<path d="M14 4v10a4 4 0 1 1-4-4"/><path d="M14 4c.5 2.5 2 4 4.5 4.3"/>',
  x: '<path d="m4 4 16 16M20 4 4 20"/>',
  facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4V9a1 1 0 0 1 1-1Z"/>',
  steam:
    '<circle cx="12" cy="12" r="9"/><circle cx="15.5" cy="9" r="2.5"/><path d="m3.5 15 5 2"/><circle cx="8" cy="16.5" r="2.2"/>',
  github:
    '<path d="M9 19c-4 1.2-4-2-6-2.5m12 5v-3.6c0-1 .1-1.5-.5-2 2.3-.3 4.5-1.2 4.5-5a4 4 0 0 0-1-2.7 3.7 3.7 0 0 0-.1-2.7s-.9-.3-3 1a10.3 10.3 0 0 0-5 0c-2.1-1.3-3-1-3-1a3.7 3.7 0 0 0-.1 2.7A4 4 0 0 0 5 10.9c0 3.8 2.2 4.7 4.5 5-.4.4-.5.9-.5 1.6V21"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
  users:
    '<path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"/><circle cx="9.5" cy="8" r="3.5"/><path d="M21 20v-1.5a4 4 0 0 0-3-3.9"/><path d="M16 4.1a3.5 3.5 0 0 1 0 6.8"/>',
  gamepad:
    '<rect x="2.5" y="7.5" width="19" height="10" rx="4"/><path d="M7 11v3M5.5 12.5h3M15.5 11.5h.01M18 13.5h.01"/>',
  calendar:
    '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  news:
    '<path d="M4 5h12v14H5a1 1 0 0 1-1-1z"/><path d="M16 9h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3"/><path d="M7 9h6M7 12h6M7 15h4"/>',
  image:
    '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="m5 17 4.5-4.5 4 4 2.5-2 3 2.5"/>',
  trophy:
    '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5v1.5A3.5 3.5 0 0 0 8 11M17 6h2.5v1.5A3.5 3.5 0 0 1 16 11"/><path d="M12 14v3M9 20h6"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4 3 7.5 7 9.5 4-2 7-5.5 7-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 13.6H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.7 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.6 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.3z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  logout: '<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="m15 8 4 4-4 4M19 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M13 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-7"/><path d="m17.5 3.5 3 3L12 15l-3.5.5L9 12z"/>',
  trash: '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  alert: '<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  play: '<path d="M8 5.5v13l11-6.5z"/>',
  star: '<path d="m12 4 2.5 5.2 5.5.8-4 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4-3.9 5.5-.8z"/>',
  dashboard: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  inbox: '<path d="M3.5 13.5h4l1.5 3h6l1.5-3h4"/><path d="M5.5 5h13l2 8.5v4a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-4z"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
} as const;

export type IconName = keyof typeof iconPaths;
