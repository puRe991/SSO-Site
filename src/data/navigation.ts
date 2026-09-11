export interface NavItem {
  label: string;
  href: string;
  /** Sub-paths also mark this item active (e.g. /members/florian). */
  match?: string;
}

export const mainNav: NavItem[] = [
  { label: 'Home', href: '/', match: '^/$' },
  { label: 'Clan', href: '/clan' },
  { label: 'Members', href: '/members' },
  { label: 'Games', href: '/games' },
  { label: 'Events', href: '/events' },
  { label: 'News', href: '/news' },
  { label: 'Media', href: '/media' },
  { label: 'Achievements', href: '/achievements' },
  { label: 'Join Us', href: '/join' },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: 'Clan',
    items: [
      { label: 'About the clan', href: '/clan' },
      { label: 'Members', href: '/members' },
      { label: 'Games', href: '/games' },
      { label: 'Achievements', href: '/achievements' },
      { label: 'Leaderboard', href: '/leaderboard' },
    ],
  },
  {
    title: 'Community',
    items: [
      { label: 'Events', href: '/events' },
      { label: 'News', href: '/news' },
      { label: 'Media', href: '/media' },
      { label: 'Rules', href: '/rules' },
      { label: 'Join Us', href: '/join' },
    ],
  },
  {
    title: 'Contact',
    items: [
      { label: 'Contact', href: '/contact' },
      { label: 'Login', href: '/login' },
      { label: 'Imprint', href: '/imprint' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
];

export const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Members', href: '/admin/members' },
  { label: 'Games', href: '/admin/games' },
  { label: 'Events', href: '/admin/events' },
  { label: 'News', href: '/admin/news' },
  { label: 'Media', href: '/admin/media' },
  { label: 'Achievements', href: '/admin/achievements' },
  { label: 'Applications', href: '/admin/applications' },
  { label: 'Ranks', href: '/admin/ranks' },
  { label: 'Settings', href: '/admin/settings' },
];

export function isActive(pathname: string, item: NavItem): boolean {
  if (item.match) return new RegExp(item.match).test(pathname);
  if (item.href === '/') return pathname === '/';
  return pathname === item.href || pathname.startsWith(item.href + '/');
}
