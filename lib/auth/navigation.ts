import type { CurrentUser, Role } from './roles';
import { Roles, hasRole, primaryRole, userRoles } from './roles';
import type { Capability } from './permissions';
import { can } from './permissions';
import { canAccessPath } from './route-access';

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  capability?: Capability;
  /** If present, at least one of these roles is required. */
  roles?: Role[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface Workspace {
  role: Role;
  label: string;
  href: string;
}

/** Every authenticated user lands in the highest workspace they can access. */
const WORKSPACE_BY_ROLE: Record<Role, Workspace> = {
  [Roles.SUPER_ADMIN]: { role: Roles.SUPER_ADMIN, label: 'Admin Console', href: '/admin' },
  [Roles.ADMIN]: { role: Roles.ADMIN, label: 'Admin Console', href: '/admin' },
  [Roles.COORDINATOR]: { role: Roles.COORDINATOR, label: 'Coordinator Console', href: '/admin' },
  [Roles.VOLUNTEER]: { role: Roles.VOLUNTEER, label: 'Volunteer Hub', href: '/volunteer' },
  [Roles.MEMBER]: { role: Roles.MEMBER, label: 'My Membership', href: '/member' },
  [Roles.DONOR]: { role: Roles.DONOR, label: 'My Giving', href: '/donor' },
};

export const WORKSPACE_ORDER: Role[] = [
  Roles.SUPER_ADMIN,
  Roles.ADMIN,
  Roles.COORDINATOR,
  Roles.VOLUNTEER,
  Roles.MEMBER,
  Roles.DONOR,
];

/**
 * Landing route for a user, chosen by their highest privilege role.
 *
 * The result is always a path the user can actually open: an account with no role
 * (or whose workspace is role-gated) falls back to the public home rather than a
 * page `canAccessPath` would reject, which would bounce between /forbidden forever.
 */
export function landingPathFor(user: CurrentUser | null | undefined): string {
  if (!user) return '/';
  const href = WORKSPACE_BY_ROLE[primaryRole(user)]?.href;
  if (href && canAccessPath(user, href)) return href;
  return '/';
}

/**
 * Where to send a user straight after login.
 *
 * A same-origin `?next=` target wins when the user is allowed to open it, otherwise
 * we fall back to their landing workspace. Absolute or protocol-relative URLs
 * (`https://evil.example`, `//evil.example`) are ignored.
 */
export function resolvePostLoginPath(
  user: CurrentUser | null | undefined,
  next: string | null | undefined
): string {
  if (user && next && next.startsWith('/') && !next.startsWith('//')) {
    const candidate = next.split('?')[0].split('#')[0];
    if (candidate && candidate !== '/auth/login' && canAccessPath(user, candidate)) {
      return candidate;
    }
  }
  return landingPathFor(user);
}

/** Workspaces the user is entitled to, in priority order (de-duplicated). */
export function workspacesFor(user: CurrentUser | null | undefined): Workspace[] {
  if (!user) return [];
  const workspaces = WORKSPACE_ORDER.filter((role) => hasRole(user, role)).map((role) => WORKSPACE_BY_ROLE[role]);
  return workspaces.filter((workspace, index, list) => list.findIndex((w) => w.href === workspace.href) === index);
}

const STAFF: Role[] = [Roles.ADMIN, Roles.COORDINATOR];
const ADMIN_ONLY: Role[] = [Roles.ADMIN];

/** Navigation model for the operations console. */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'My Space',
    items: [
      { href: '/volunteer', label: 'Volunteer Hub', icon: 'heart-handshake', roles: [Roles.VOLUNTEER] },
      { href: '/member', label: 'My Membership', icon: 'user-check', roles: [Roles.MEMBER] },
      { href: '/donor', label: 'My Giving', icon: 'banknote', roles: [Roles.DONOR] },
    ],
  },
  {
    title: 'Core Ops',
    items: [
      { href: '/admin', label: 'Console Home', icon: 'grid', roles: STAFF, exact: true },
      { href: '/admin/dashboard', label: 'Operations Dashboard', icon: 'gauge', roles: STAFF },
      { href: '/admin/programs', label: 'Programs', icon: 'layers', roles: STAFF },
      { href: '/admin/beneficiaries', label: 'Beneficiaries', icon: 'users', roles: STAFF },
      { href: '/admin/volunteers', label: 'Volunteers', icon: 'heart-handshake', roles: STAFF },
      { href: '/admin/members', label: 'Members', icon: 'user-check', roles: STAFF },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { href: '/admin/donations', label: 'Donations & Grants', icon: 'banknote', roles: STAFF },
      { href: '/admin/events', label: 'Events & Field Trips', icon: 'calendar', roles: STAFF },
      { href: '/admin/news', label: 'News & Media', icon: 'newspaper', roles: STAFF },
      { href: '/file-uploads', label: 'File Vault', icon: 'folder-lock' },
      { href: '/notifications', label: 'Notifications', icon: 'bell' },
    ],
  },
  {
    title: 'System & Admin',
    items: [
      { href: '/admin/core', label: 'Foundation & Admin', icon: 'shield', roles: ADMIN_ONLY },
      { href: '/admin/references', label: 'Reference Tables', icon: 'table-2', roles: ADMIN_ONLY },
      { href: '/admin/settings', label: 'Settings', icon: 'settings', roles: ADMIN_ONLY },
      { href: '/admin/audit', label: 'Audit Activity Logs', icon: 'scroll-text', roles: ADMIN_ONLY },
    ],
  },
];

/** Filter the nav down to the sections/items the user may see. */
export function navigationFor(user: CurrentUser | null | undefined): NavSection[] {
  if (!user) return [];
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.roles && !hasRole(user, ...item.roles)) return false;
      if (item.capability && !can(user, item.capability)) return false;
      return true;
    }),
  })).filter((section) => section.items.length > 0);
}
