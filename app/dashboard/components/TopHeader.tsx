'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Roles, hasRole } from '@/lib/auth/roles';
import ThemeToggle from '@/app/components/ThemeToggle';

interface NotificationList {
  count: number;
}

export default function TopHeader({
  onToggleSidebar = () => {},
}: {
  notificationCount?: number;
  onToggleSidebar?: () => void;
}) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isMemberWorkspace = !loading
    && hasRole(user, Roles.MEMBER)
    && !hasRole(user, Roles.ADMIN, Roles.COORDINATOR, Roles.SUPER_ADMIN);

  useEffect(() => {
    let active = true;
    const loadNotifications = () => {
      apiGet<NotificationList>('/core/notifications/unread-count/')
        .then((data) => {
          if (!active) return;
          setUnreadCount(data.count);
          setNotificationError(false);
        })
        .catch(() => {
          if (!active) return;
          setUnreadCount(0);
          setNotificationError(true);
        });
    };
    const handleNotificationsUpdated = () => loadNotifications();
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60_000);
    window.addEventListener('bff:notifications-updated', handleNotificationsUpdated);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('bff:notifications-updated', handleNotificationsUpdated);
    };
  }, [pathname]);

  const LABELS: Record<string, string> = {
    admin: 'Dashboard',
    programs: 'Programs',
    members: 'Members & Community Roster',
    beneficiaries: 'Beneficiaries Registry',
    volunteers: 'Volunteers & Deployment',
    donations: 'Donations & Grants',
    events: 'Events & Field Trips',
    news: 'News & Media',
    'file-uploads': 'File Vault',
    broadcasts: 'Broadcasts',
    references: 'Reference Tables',
    settings: 'Organization Settings',
    core: 'Foundation & Administration',
    audit: 'Audit Activity Logs',
    volunteer: 'Volunteer Hub',
    member: 'Dashboard',
    profile: 'My Profile',
    'my-programs': 'My Programs',
    about: 'Organization Profile',
    donor: 'My Giving',
    notifications: 'Notifications',
    dashboard: 'Dashboard Overview',
  };

  const normalized = pathname.replace(/^\/admin(?=\/|$)/, '').replace(/^\/member\/profile(?=\/|$)/, '/profile') || '';
  const segment = normalized.split('/').filter(Boolean)[0] ?? (pathname.startsWith('/admin') ? 'admin' : 'dashboard');
  const breadcrumbLabel = LABELS[segment] ?? 'Operations';

  return (
    <header className="db-top-header">
      <div className="db-top-header-left">
        <button type="button" className="db-sidebar-toggle" onClick={onToggleSidebar} aria-label="Show or hide sidebar" title="Show or hide sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>
        </button>
        <nav className="db-breadcrumb" aria-label="Current page">
          <span className="db-breadcrumb-item active">{breadcrumbLabel}</span>
        </nav>
        {!isMemberWorkspace ? <div className={`db-search${searchFocused ? ' focused' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            type="text"
            placeholder="Search programs, cases, records..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="db-search-kbd">&#8984;K</kbd>
        </div> : null}
      </div>
      <div className="db-top-header-right">
        {!isMemberWorkspace ? <>
          <span className="db-header-status">
            <span className="db-header-status-dot" />
            Operations workspace
          </span>
          <button type="button" className="db-header-icon-btn" aria-label="Help">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
          </button>
        </> : null}
        <Link href="/notifications" className="db-header-icon-btn db-bell-btn" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          {unreadCount > 0 && <span className="db-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </Link>
        {notificationError ? <span className="db-notification-error" role="status">Notifications unavailable</span> : null}
        <ThemeToggle className="dashboard-theme-toggle" />
        {!isMemberWorkspace ? <>
          <Link href="/core" className="db-header-action-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Action
          </Link>
          <div className="db-header-avatar">AB</div>
        </> : null}
      </div>
    </header>
  );
}
