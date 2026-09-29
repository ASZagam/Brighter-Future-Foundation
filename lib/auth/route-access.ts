import type { CurrentUser, Role } from './roles';
import { Roles, hasRole, isPrivileged } from './roles';
import type { Capability } from './permissions';
import { can } from './permissions';

type AccessRule = {
  capability?: Capability;
  /** Any-of roles allowed, in addition to super admins. */
  roles?: Role[];
};

/**
 * Route gate table. The most specific (longest) matching prefix wins.
 * `null` means "any authenticated user".
 *
 * Legacy management paths (/members, /volunteers, /donations, …) are redirected
 * to /admin/* by next.config.js before this guard runs. Public marketing routes
 * are listed in PUBLIC_PREFIXES below and are never gated.
 */
const ROUTE_RULES: Record<string, AccessRule | null> = {
  '/admin/audit': { capability: 'view:audit' },
  '/admin/settings': { capability: 'manage:settings' },
  '/admin/core': { capability: 'manage:organizations' },
  '/admin/references': { capability: 'manage:references' },
  '/admin/beneficiaries': { capability: 'view:beneficiaries' },
  '/admin/programs': { capability: 'view:programs' },
  '/admin/volunteers': { capability: 'view:volunteers' },
  '/admin/members': { capability: 'view:members' },
  '/admin/donations': { capability: 'view:donations' },
  '/admin/events': { capability: 'view:events' },
  '/admin/news': { capability: 'view:news' },
  '/admin': { roles: [Roles.ADMIN, Roles.COORDINATOR] },

  '/file-uploads': null,
  '/notifications': null,
  '/profile': null,

  // Self-service workspaces: each is scoped to the role that owns it.
  '/volunteer': { roles: [Roles.VOLUNTEER] },
  '/member': { roles: [Roles.MEMBER] },
  '/donor': { roles: [Roles.DONOR] },
  '/dashboard': null,

  // Legacy aliases (redirected by next.config.js, but kept so the guard still
  // answers correctly if a redirect ever lands a user here first).
  '/settings': { capability: 'manage:settings' },
  '/core': { capability: 'manage:organizations' },
  '/references': { capability: 'manage:references' },
  '/beneficiaries': { capability: 'view:beneficiaries' },
  '/volunteers': { capability: 'view:volunteers' },
  '/members': { capability: 'view:members' },
  '/donations': { capability: 'view:donations' },
  '/events': { capability: 'view:events' },
};

/**
 * Public marketing routes. Listed explicitly so the middleware can never gate
 * them by accident — they are reachable without a session.
 *
 * Note: `/programs` and `/news` are public. The management equivalents live at
 * `/admin/programs` and `/admin/news`.
 */
export const PUBLIC_PREFIXES = [
  '/',
  '/about',
  '/impact',
  '/donate',
  '/transparency',
  '/programs',
  '/news',
];

/** Route prefixes that require an authenticated session. */
export const PROTECTED_PREFIXES = Object.keys(ROUTE_RULES);

/** Auth flow routes that an already-authenticated user should skip. */
export const AUTH_PREFIXES = [
  '/auth/login',
  '/auth/register',
  '/auth/request-password-reset',
  '/auth/reset-password',
  '/auth/verify-email',
];

export function isProtectedPath(pathname: string): boolean {
  const isPublic = PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (isPublic) return false;
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isAuthPath(pathname: string): boolean {
  return AUTH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function ruleForPath(pathname: string): AccessRule | null | undefined {
  const match = Object.keys(ROUTE_RULES)
    .filter((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    .sort((a, b) => b.length - a.length)[0];
  return match ? ROUTE_RULES[match] : undefined;
}

/** Whether the user may open the given path (client-side mirror of middleware). */
export function canAccessPath(user: CurrentUser | null | undefined, pathname: string): boolean {
  if (!user) return false;
  if (isPrivileged(user)) return true;
  const rule = ruleForPath(pathname);
  if (rule === undefined) return true;
  if (rule === null) return true;
  if (rule.capability) return can(user, rule.capability);
  if (rule.roles) {
    return hasRole(user, ...rule.roles);
  }
  return true;
}
