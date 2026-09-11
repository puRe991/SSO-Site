export interface NavItem {
  label: string;
  href: string;
  /** Unterseiten markieren diesen Eintrag ebenfalls als aktiv (z. B. /members/florian). */
  match?: string;
}

export const mainNav: NavItem[] = [
  { label: 'Start', href: '/', match: '^/$' },
  { label: 'Club', href: '/clan' },
  { label: 'Mitglieder', href: '/members' },
  { label: 'Disziplinen', href: '/games' },
  { label: 'Termine', href: '/events' },
  { label: 'Neuigkeiten', href: '/news' },
  { label: 'Galerie', href: '/media' },
  { label: 'Erfolge', href: '/achievements' },
  { label: 'Mitreiten', href: '/join' },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: 'Club',
    items: [
      { label: 'Über den Club', href: '/clan' },
      { label: 'Mitglieder', href: '/members' },
      { label: 'Disziplinen', href: '/games' },
      { label: 'Erfolge', href: '/achievements' },
      { label: 'Rangliste', href: '/leaderboard' },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: 'Termine', href: '/events' },
      { label: 'Neuigkeiten', href: '/news' },
      { label: 'Galerie', href: '/media' },
      { label: 'Clubregeln', href: '/rules' },
      { label: 'Mitreiten', href: '/join' },
    ],
  },
  {
    title: 'Kontakt',
    items: [
      { label: 'Kontakt', href: '/contact' },
      { label: 'Anmelden', href: '/login' },
      { label: 'Impressum', href: '/imprint' },
      { label: 'Datenschutz', href: '/privacy' },
    ],
  },
];

export const adminNav: NavItem[] = [
  { label: 'Übersicht', href: '/admin' },
  { label: 'Mitglieder', href: '/admin/members' },
  { label: 'Disziplinen', href: '/admin/games' },
  { label: 'Termine', href: '/admin/events' },
  { label: 'Neuigkeiten', href: '/admin/news' },
  { label: 'Galerie', href: '/admin/media' },
  { label: 'Erfolge', href: '/admin/achievements' },
  { label: 'Bewerbungen', href: '/admin/applications' },
  { label: 'Ränge', href: '/admin/ranks' },
  { label: 'Einstellungen', href: '/admin/settings' },
];

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.match) return new RegExp(item.match).test(pathname);
  if (item.href === '/') return pathname === '/';
  return pathname === item.href || pathname.startsWith(item.href + '/');
}
