/**
 * Central role definitions for the Brighter Future Foundation frontend.
 *
 * These MUST stay in sync with the Django backend
 * (backend/accounts/models.py -> Roles). The backend is the security
 * boundary; everything here only drives navigation and UI affordances.
 */

export const Roles = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  COORDINATOR: 'coordinator',
  VOLUNTEER: 'volunteer',
  MEMBER: 'member',
  DONOR: 'donor',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export const ALL_ROLES: Role[] = [
  Roles.SUPER_ADMIN,
  Roles.ADMIN,
  Roles.COORDINATOR,
  Roles.VOLUNTEER,
  Roles.MEMBER,
  Roles.DONOR,
];

/**
 * Highest-privilege first. Used to pick a user's landing workspace and the
 * single badge shown in the shell.
 */
export const ROLE_PRIORITY: Role[] = [...ALL_ROLES];

/** Human readable labels for each role. */
export const ROLE_LABELS: Record<string, string> = {
  [Roles.SUPER_ADMIN]: 'Super Admin',
  [Roles.ADMIN]: 'Administrator',
  [Roles.COORDINATOR]: 'Coordinator',
  [Roles.VOLUNTEER]: 'Volunteer',
  [Roles.MEMBER]: 'Member',
  [Roles.DONOR]: 'Donor',
};

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  status?: string;
  email_verified?: boolean;
  roles: Array<{ id: string; name: string; description?: string }>;
  role_names: string[];
  is_super_admin: boolean;
  date_joined?: string;
}

function toRole(value: string): Role | null {
  const normalized = value?.toLowerCase();
  return (ALL_ROLES as string[]).includes(normalized) ? (normalized as Role) : null;
}

/** Collect the known roles held by a user. */
export function userRoles(user: CurrentUser | null | undefined): Role[] {
  if (!user) return [];
  const names = user.role_names?.length
    ? user.role_names
    : (user.roles ?? []).map((role) => role.name);
  const roles = names.map(toRole).filter((role): role is Role => role !== null);
  return Array.from(new Set(roles));
}

/**
 * Superusers and holders of the `super_admin` role bypass every check.
 * The API payload only exposes `is_super_admin` (Django `is_superuser` is
 * folded into it by the backend serializer).
 */
export function isPrivileged(user: CurrentUser | null | undefined): boolean {
  return Boolean(user?.is_super_admin);
}

export function hasRole(user: CurrentUser | null | undefined, ...roles: Role[]): boolean {
  if (isPrivileged(user)) return true;
  const owned = userRoles(user);
  return roles.some((role) => owned.includes(role));
}

export function isAdmin(user: CurrentUser | null | undefined): boolean {
  return hasRole(user, Roles.ADMIN);
}

export function isAdminOrCoordinator(user: CurrentUser | null | undefined): boolean {
  return hasRole(user, Roles.ADMIN, Roles.COORDINATOR);
}

export function isCoordinator(user: CurrentUser | null | undefined): boolean {
  if (isPrivileged(user) || isAdmin(user)) return true;
  return userRoles(user).includes(Roles.COORDINATOR);
}

export function isVolunteer(user: CurrentUser | null | undefined): boolean {
  return userRoles(user).includes(Roles.VOLUNTEER);
}

export function isMember(user: CurrentUser | null | undefined): boolean {
  return userRoles(user).includes(Roles.MEMBER);
}

export function isDonor(user: CurrentUser | null | undefined): boolean {
  return userRoles(user).includes(Roles.DONOR);
}

/** The highest-priority role a user owns, used for landing/badges. */
export function primaryRole(user: CurrentUser | null | undefined): Role {
  if (isPrivileged(user)) return Roles.SUPER_ADMIN;
  const owned = userRoles(user);
  return ROLE_PRIORITY.find((role) => owned.includes(role)) ?? Roles.MEMBER;
}

export function roleLabel(role: string | null | undefined): string {
  if (!role) return 'Member';
  return ROLE_LABELS[role] ?? role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
