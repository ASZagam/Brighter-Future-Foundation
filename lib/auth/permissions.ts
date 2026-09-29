import type { CurrentUser, Role } from './roles';
import { Roles, hasRole, isAdmin, isAdminOrCoordinator, isPrivileged } from './roles';

/**
 * Capability model mirroring the hardened Django permission classes.
 *
 * Every capability lists the roles allowed to perform it. Backend enforcement
 * remains authoritative; this table exists so the UI never offers an action
 * the API will reject.
 */
export const CAPABILITIES = {
  // Organisation management (admin/super admin only)
  'manage:settings': [Roles.ADMIN],
  'manage:organizations': [Roles.ADMIN],
  'manage:references': [Roles.ADMIN],
  'manage:files': [Roles.ADMIN, Roles.COORDINATOR],
  'view:audit': [Roles.ADMIN],
  'view:system': [Roles.ADMIN],
  'view:dashboard-stats': [Roles.ADMIN, Roles.COORDINATOR],

  // Program management (admin/coordinator write, everyone reads)
  'manage:programs': [Roles.ADMIN, Roles.COORDINATOR],
  'view:programs': [Roles.ADMIN, Roles.COORDINATOR, Roles.VOLUNTEER, Roles.MEMBER, Roles.DONOR],
  'view:beneficiaries': [Roles.ADMIN, Roles.COORDINATOR],
  'manage:beneficiaries': [Roles.ADMIN, Roles.COORDINATOR],
  'manage:program-reports': [Roles.ADMIN, Roles.COORDINATOR],
  'manage:program-documents': [Roles.ADMIN, Roles.COORDINATOR],

  // People
  'view:members': [Roles.ADMIN, Roles.COORDINATOR],
  'manage:members': [Roles.ADMIN, Roles.COORDINATOR],
  'view:volunteers': [Roles.ADMIN, Roles.COORDINATOR],
  'manage:volunteers': [Roles.ADMIN, Roles.COORDINATOR],

  // Engagement
  'view:donations': [Roles.ADMIN, Roles.COORDINATOR],
  'manage:donations': [Roles.ADMIN, Roles.COORDINATOR],
  'view:events': [Roles.ADMIN, Roles.COORDINATOR, Roles.VOLUNTEER, Roles.MEMBER, Roles.DONOR],
  'manage:events': [Roles.ADMIN, Roles.COORDINATOR],
  'view:news': [Roles.ADMIN, Roles.COORDINATOR, Roles.VOLUNTEER, Roles.MEMBER, Roles.DONOR],
  'manage:news': [Roles.ADMIN, Roles.COORDINATOR],

  // Self-service (any authenticated account)
  'self:profile': [
    Roles.ADMIN,
    Roles.COORDINATOR,
    Roles.VOLUNTEER,
    Roles.MEMBER,
    Roles.DONOR,
  ],
  'self:assignments': [Roles.VOLUNTEER, Roles.COORDINATOR, Roles.ADMIN],
  'self:hours': [Roles.VOLUNTEER, Roles.COORDINATOR, Roles.ADMIN],
} as const satisfies Record<string, readonly Role[]>;

export type Capability = keyof typeof CAPABILITIES;

export function can(user: CurrentUser | null | undefined, capability: Capability): boolean {
  if (!user) return false;
  if (isPrivileged(user)) return true;
  return hasRole(user, ...CAPABILITIES[capability]);
}

export function canAny(user: CurrentUser | null | undefined, capabilities: Capability[]): boolean {
  return capabilities.some((capability) => can(user, capability));
}

export { isAdmin, isAdminOrCoordinator, isPrivileged };
