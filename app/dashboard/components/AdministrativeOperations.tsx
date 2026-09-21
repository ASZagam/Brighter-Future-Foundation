'use client';

import Link from 'next/link';
import type { DashboardStats, Notification } from '../hooks/useDashboard';

interface AdminOpsProps {
  stats: DashboardStats | null;
  notifications: Notification[];
}

export default function AdministrativeOperations({ stats, notifications }: AdminOpsProps) {
  const pendingNotifs = notifications.filter((n) => !n.read).length;
  const uploadSize = stats?.active_uploads ?? 0;
  const uploadTypes = stats?.uploads_by_type ?? [];

  const adminCards = [
    {
      title: 'Organization Settings',
      description: 'Staff roles, permissions, global NGO defaults, tax identifiers, and fiscal boundary flags.',
      linkText: 'Manage Settings',
      href: '/settings',
      icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></svg>,
      badge: stats?.settings_count ? `${stats.settings_count} configured` : undefined,
      badgeColor: 'green' as const,
    },
    {
      title: 'Notification Center',
      description: pendingNotifs > 0
        ? `${pendingNotifs} priority dispatch${pendingNotifs !== 1 ? 's' : ''} pending regional sign-off before field disbursement can occur.`
        : 'All notifications have been reviewed. No pending dispatches.',
      linkText: 'View Dispatch Queue',
      href: '/notifications',
      badge: pendingNotifs > 0 ? `${pendingNotifs} Pending` : 'All Clear',
      badgeColor: pendingNotifs > 0 ? 'red' as const : 'green' as const,
    },
    {
      title: 'File Vault & Media',
      description: uploadTypes.length > 0
        ? `${uploadTypes.map((t) => `${t.total} ${t.upload_type}${t.total !== 1 ? 's' : ''}`).join(', ')} stored in vault.`
        : `${uploadSize} active file${uploadSize !== 1 ? 's' : ''} in the secure vault.`,
      linkText: 'Open Secure Vault',
      href: '/file-uploads',
      storage: `${uploadSize} files`,
    },
    {
      title: 'Reference Tables',
      description: `${stats?.states ?? 0} Nigerian States, ${stats?.countries ?? 0} countries, operational clusters, exchange rates & local government council lookup tables.`,
      linkText: `Explore${stats?.settings_count ? ` ${stats.settings_count}` : ''} Tables`,
      href: '/references',
    },
  ];

  return (
    <div className="db-admin-ops">
      <div className="db-admin-ops-header">
        <div className="db-admin-ops-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#087F5B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          <h2>Administrative Operations</h2>
        </div>
        <span className="db-admin-ops-label">FAST ACCESS MODULES</span>
      </div>
      <div className="db-admin-ops-grid">
        {adminCards.map((card) => (
          <Link key={card.title} href={card.href} className="db-admin-ops-card">
            <div className="db-admin-ops-card-top">
              <div className="db-admin-ops-card-icon">{card.icon}</div>
              {'badge' in card && card.badge && (
                <span className={`db-admin-ops-badge db-admin-ops-badge-${card.badgeColor || 'green'}`}>{card.badge}</span>
              )}
              {'storage' in card && card.storage && (
                <span className="db-admin-ops-storage">{card.storage}</span>
              )}
            </div>
            <h3 className="db-admin-ops-card-title">{card.title}</h3>
            <p className="db-admin-ops-card-desc">{card.description}</p>
            <span className="db-admin-ops-card-link">{card.linkText} &rarr;</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
