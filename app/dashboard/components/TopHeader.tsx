'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TopHeader({ notificationCount }: { notificationCount: number }) {
  const [searchFocused, setSearchFocused] = useState(false);
  const pathname = usePathname();
  const isPrograms = pathname.startsWith('/programs');
  const isMembers = pathname.startsWith('/members');
  const isVolunteers = pathname.startsWith('/volunteers');
  const isBeneficiaries = pathname.startsWith('/beneficiaries');
  const isCore = pathname.startsWith('/core');
  const isAdmin = pathname.startsWith('/admin');
  const isSettings = pathname.startsWith('/settings');
  const isDonations = pathname.startsWith('/donations');
  const isEvents = pathname.startsWith('/events');
  const isNews = pathname.startsWith('/news');
  const isReferences = pathname.startsWith('/references');
  const isFileUploads = pathname.startsWith('/file-uploads');
  const breadcrumbLabel = isPrograms
    ? 'Programs Overview'
    : isMembers
      ? 'Members & Community Roster'
      : isVolunteers
        ? 'Volunteers & Deployment'
        : isBeneficiaries
          ? 'Beneficiaries Registry'
          : isCore
            ? 'Foundation & Administration'
            : isAdmin
              ? 'Audit Activity Logs'
              : isSettings
                ? 'Organization Settings'
                : isDonations
                  ? 'Donations & Grants'
                  : isEvents
                    ? 'Events & Field Trips'
                    : isNews
                      ? 'News & Media'
                      : isReferences
                        ? 'Reference Tables'
                        : isFileUploads
                          ? 'File Vault'
                          : 'Dashboard Overview';

  return (
    <header className="db-top-header">
      <div className="db-top-header-left">
        <nav className="db-breadcrumb">
          <span className="db-breadcrumb-item">Core Operations</span>
          <span className="db-breadcrumb-sep">/</span>
          <span className="db-breadcrumb-item active">{breadcrumbLabel}</span>
        </nav>
        <div className={`db-search${searchFocused ? ' focused' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            type="text"
            placeholder="Search programs, cases, records..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="db-search-kbd">&#8984;K</kbd>
        </div>
      </div>
      <div className="db-top-header-right">
        <span className="db-header-status">
          <span className="db-header-status-dot" />
          Django 5.2 &bull; All Systems Operational
        </span>
        <button type="button" className="db-header-icon-btn" aria-label="Help">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
        </button>
        <button type="button" className="db-header-icon-btn db-bell-btn" aria-label="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          {notificationCount > 0 && <span className="db-bell-badge">{notificationCount > 9 ? '9+' : notificationCount}</span>}
        </button>
        <Link href="/core" className="db-header-action-btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Action
        </Link>
        <div className="db-header-avatar">AB</div>
      </div>
    </header>
  );
}
