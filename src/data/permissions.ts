/** Rollenbasierte Rechte. Diese Rollen gehören zur Website und sind von den Clubrängen getrennt. */

export const PERMISSIONS = [
  'manage_members',
  'manage_news',
  'manage_events',
  'manage_games',
  'manage_media',
  'manage_achievements',
  'manage_applications',
  'manage_settings',
  'manage_roles',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = ['owner', 'admin', 'moderator', 'member', 'user', 'guest'] as const;
export type Role = (typeof ROLES)[number];

const MODERATOR_PERMISSIONS: Permission[] = [
  'manage_news',
  'manage_events',
  'manage_media',
  'manage_applications',
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...MODERATOR_PERMISSIONS,
  'manage_members',
  'manage_games',
  'manage_achievements',
];

export const rolePermissions: Record<Role, readonly Permission[]> = {
  owner: PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  moderator: MODERATOR_PERMISSIONS,
  member: [],
  user: [],
  guest: [],
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function permissionsForRole(role: string | null | undefined): readonly Permission[] {
  return isRole(role) ? rolePermissions[role] : rolePermissions.guest;
}

export function can(role: string | null | undefined, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}

/** True for any role that may open `/admin` at all. */
export function canAccessAdmin(role: string | null | undefined): boolean {
  return permissionsForRole(role).length > 0;
}
