import { adminNav } from '@/data/navigation';
import { can, type Permission } from '@/data/permissions';
import type { NavItem } from '@/data/navigation';
import type { IconName } from './icons';

export const adminIcons: Record<string, IconName> = {
  '/admin': 'dashboard',
  '/admin/members': 'users',
  '/admin/games': 'gamepad',
  '/admin/events': 'calendar',
  '/admin/news': 'news',
  '/admin/media': 'image',
  '/admin/achievements': 'trophy',
  '/admin/applications': 'inbox',
  '/admin/ranks': 'shield',
  '/admin/settings': 'settings',
};

/** Which permission each admin section requires. */
export const adminNavPermissions: Record<string, Permission> = {
  '/admin/members': 'manage_members',
  '/admin/games': 'manage_games',
  '/admin/events': 'manage_events',
  '/admin/news': 'manage_news',
  '/admin/media': 'manage_media',
  '/admin/achievements': 'manage_achievements',
  '/admin/applications': 'manage_applications',
  '/admin/ranks': 'manage_roles',
  '/admin/settings': 'manage_settings',
};

/** The sidebar only lists sections the signed-in role may actually open. */
export function visibleAdminNav(role: string | null | undefined): NavItem[] {
  return adminNav.filter((item) => {
    const permission = adminNavPermissions[item.href];
    return permission === undefined || can(role, permission);
  });
}

export { adminNav };
