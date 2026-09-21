'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import logo from '../../../BFF_logo-removebg-preview.png';
import type { DashboardUser } from '../hooks/useDashboard';

const coreOps = [
  { href: '/dashboard', label: 'Dashboard', icon: 'grid' },
  { href: '/programs', label: 'Programs', icon: 'layers' },
  { href: '/beneficiaries', label: 'Beneficiaries', icon: 'users' },
  { href: '/volunteers', label: 'Volunteers', icon: 'heart-handshake' },
  { href: '/members', label: 'Members', icon: 'user-check' },
];

const engagement = [
  { href: '/donations', label: 'Donations & Grants', icon: 'banknote' },
  { href: '/events', label: 'Events & Field Trips', icon: 'calendar' },
  { href: '/news', label: 'News & Media', icon: 'newspaper' },
];

const systemAdmin = [
  { href: '/core', label: 'Foundation & Admin', icon: 'shield' },
  { href: '/file-uploads', label: 'File Vault', icon: 'folder-lock' },
  { href: '/references', label: 'Reference Tables', icon: 'table-2' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
  { href: '/admin', label: 'Audit Activity Logs', icon: 'scroll-text' },
];

function NavIcon({ name }: { name: string }) {
  const s = { width: 15, height: 15, strokeWidth: 1.8, stroke: 'currentColor', fill: 'none' } as const;
  const icons: Record<string, JSX.Element> = {
    grid: <svg style={s} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    layers: <svg style={s} viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>,
    users: <svg style={s} viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    'heart-handshake': <svg style={s} viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08 2.5 2.5 0 0 0 3.84 0L12 11"/><path d="M15 10 9.04 7.96a2.17 2.17 0 0 1 0-3.08 2.5 2.5 0 0 1 3.84 0L15 5"/></svg>,
    'user-check': <svg style={s} viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
    banknote: <svg style={s} viewBox="0 0 24 24"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    calendar: <svg style={s} viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
    newspaper: <svg style={s} viewBox="0 0 24 24"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>,
    'folder-lock': <svg style={s} viewBox="0 0 24 24"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><rect x="10" y="13" width="8" height="5" rx="1"/><circle cx="14" cy="12.5" r="1.5"/></svg>,
    shield: <svg style={s} viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z"/><path d="m9 12 2 2 4-4"/></svg>,
    'table-2': <svg style={s} viewBox="0 0 24 24"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>,
    settings: <svg style={s} viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
    'scroll-text': <svg style={s} viewBox="0 0 24 24"><path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M15 8h-5"/><path d="M15 12h-5"/></svg>,
  };
  return icons[name] || <svg style={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/></svg>;
}

function getInitials(name: string): string {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getRoleBadge(user: DashboardUser | null): string {
  if (!user) return 'MEMBER';
  if (user.is_super_admin) return 'SUPER ADMIN';
  const role = user.role_names?.[0];
  if (role) return role.replace(/_/g, ' ').toUpperCase();
  return 'MEMBER';
}

export default function Sidebar({ user }: { user: DashboardUser | null }) {
  const pathname = usePathname();
  const displayName = user?.full_name || user?.username || 'Guest';
  const office = 'Abuja Office';
  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));

  return (
    <aside className="db-sidebar">
      <div className="db-sidebar-brand">
        <div className="db-sidebar-logo">
          <Image src={logo} alt="Brighter Future Foundation logo" width={28} height={28} style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
        </div>
        <div>
          <span className="db-sidebar-brand-name">BFF Ops</span>
          <span className="db-sidebar-brand-sub">OPERATIONS</span>
        </div>
      </div>
      <p className="db-sidebar-org">Brighter Future Foundation</p>

      <nav className="db-sidebar-nav">
        <div className="db-sidebar-section">
          <span className="db-sidebar-section-title">CORE OPS</span>
          {coreOps.map((item) => (
            <Link key={item.label} href={item.href} className={`db-sidebar-item${isActive(item.href) ? ' active' : ''}`}>
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="db-sidebar-section">
          <span className="db-sidebar-section-title">ENGAGEMENT</span>
          {engagement.map((item) => (
            <Link key={item.label} href={item.href} className={`db-sidebar-item${isActive(item.href) ? ' active' : ''}`}>
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="db-sidebar-section">
          <span className="db-sidebar-section-title">SYSTEM & ADMIN</span>
          {systemAdmin.map((item) => (
            <Link key={item.label} href={item.href} className={`db-sidebar-item${isActive(item.href) ? ' active' : ''}`}>
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="db-sidebar-footer">
        <div className="db-sidebar-user">
          <div className="db-sidebar-avatar">{getInitials(displayName)}</div>
          <div className="db-sidebar-user-info">
            <span className="db-sidebar-user-name">{displayName}</span>
            <span className="db-sidebar-user-office">{office}</span>
          </div>
        </div>
        <div className="db-sidebar-user-role">
          <span className="db-sidebar-role-badge">{getRoleBadge(user)}</span>
          <Link href="/auth/logout" className="db-sidebar-logout" aria-label="Log out">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </Link>
        </div>
        <span className="db-sidebar-version">v5.2 - ops</span>
      </div>
    </aside>
  );
}
