'use client';

import Link from 'next/link';
import type { DashboardUser } from '../hooks/useDashboard';

function getFirstName(fullName: string | undefined): string {
  if (!fullName) return '';
  return fullName.split(' ')[0];
}

export default function DashboardPageHeader({ user }: { user: DashboardUser | null }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;

  return (
    <div className="db-page-header">
      <div className="db-page-header-left">
        <div className="db-page-header-title-row">
          <h1 className="db-page-welcome">Welcome back, {getFirstName(user?.full_name) || 'User'}</h1>
          <span className="db-badge db-badge-green">{user?.is_super_admin ? 'SUPER ADMIN' : (user?.role_names?.[0]?.replace(/_/g, ' ').toUpperCase() || 'MEMBER')}</span>
          <span className="db-badge db-badge-outline">Abuja HQ &bull; Nigeria</span>
        </div>
        <p className="db-page-meta">
          {dateStr} &bull; {timeStr} WT
          <span className="db-page-meta-sep">&bull;</span>
          Fiscal Quarter {quarter}
          <span className="db-page-meta-sep">&bull;</span>
          Field Ops Cycle {Math.ceil(now.getDate() / 7)}
        </p>
      </div>
      <div className="db-page-header-actions">
        <button type="button" className="db-btn db-btn-outline">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
          Export Audit Report
        </button>
        <button type="button" className="db-btn db-btn-outline">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Log Volunteer Hours
        </button>
        <Link href="/core" className="db-btn db-btn-primary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Program
        </Link>
      </div>
    </div>
  );
}
