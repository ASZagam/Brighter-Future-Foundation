'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import OpsShell from '@/app/components/OpsShell';
import { useAuth } from '@/lib/auth-context';
import { navigationFor } from '@/lib/auth/navigation';
import { roleLabel } from '@/lib/auth/roles';
import { apiGet } from '@/lib/api';
import './admin.css';

interface DashboardStats {
  organizations: number;
  countries: number;
  states: number;
  active_uploads: number;
  pending_notifications: number;
  activity_logs: number;
  settings_count: number;
}

interface MemberRegistrationStats {
  kpis: {
    self_registered?: number;
    admin_added?: number;
  };
}

const ICON_STROKE = { width: 18, height: 18, strokeWidth: 1.8, stroke: 'currentColor', fill: 'none' } as const;

function SectionIcon() {
  return <svg style={ICON_STROKE} viewBox="0 0 24 24"><path d="M4 5h16M4 12h16M4 19h10" /></svg>;
}

const LINK_DESCRIPTIONS: Record<string, string> = {
  '/admin/programs': 'Plan and manage foundation programs.',
  '/my-programs': 'See programs and assignments for your team.',
  '/admin/beneficiaries': 'Manage people reached by your programs.',
  '/admin/members': 'Review member profiles and registrations.',
  '/admin/volunteers': 'Coordinate volunteers and their activities.',
  '/admin/donations': 'Track donations, grants, and contributions.',
  '/admin/events': 'Organize events and field activities.',
  '/admin/news': 'Publish foundation news and updates.',
  '/admin/broadcasts': 'Send an announcement to your audience.',
  '/notifications': 'Review updates and system notifications.',
  '/file-uploads': 'Access shared foundation documents.',
  '/admin/core': 'Manage foundation information and access.',
  '/admin/references': 'Maintain shared reference data.',
  '/admin/settings': 'Configure platform preferences.',
  '/admin/audit': 'Review administrative activity history.',
  '/admin/docs': 'Step-by-step guides for every console tool.',
};

export default function AdminOverviewPage() {
  const { user, primaryRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [memberRegistrationStats, setMemberRegistrationStats] = useState<MemberRegistrationStats | null>(null);
  const sections = navigationFor(user)
    .map((section) => ({ ...section, items: section.items.filter((item) => item.href !== '/admin') }))
    .filter((section) => section.items.length > 0);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      apiGet<DashboardStats>('/core/dashboard-statistics/'),
      apiGet<MemberRegistrationStats>('/core/members/stats/'),
    ]).then(([dashboardResult, memberResult]) => {
      if (!mounted) return;
      if (dashboardResult.status === 'fulfilled') setStats(dashboardResult.value);
      if (memberResult.status === 'fulfilled') setMemberRegistrationStats(memberResult.value);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const kpis = [
    { label: 'Organizations', value: stats?.organizations, hint: 'Registered' },
    { label: 'Countries', value: stats?.countries, hint: 'In registry' },
    { label: 'States covered', value: stats?.states, hint: 'Geographic reach' },
    { label: 'Audit events', value: stats?.activity_logs, hint: 'Recorded activity' },
  ];

  return (
    <OpsShell>
      <div className="db-content">
        <header className="admin-overview-header">
          <div>
            <p className="admin-overview-kicker">FOUNDATION OPERATIONS</p>
            <h1>Welcome{user?.full_name ? `, ${user.full_name}` : ''}</h1>
            <p className="admin-overview-intro">
              Signed in as <strong>{roleLabel(primaryRole)}</strong>. Review key figures and jump to the tools you use most.
            </p>
          </div>
          <Link href="/admin/dashboard" className="admin-overview-analytics">
            <span>Operations analytics</span>
            <span aria-hidden="true">→</span>
          </Link>
        </header>

        <section className="admin-overview-metrics" aria-label="Foundation overview metrics">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="admin-overview-metric">
              <span className="admin-overview-metric-label">{kpi.label}</span>
              <strong className="admin-overview-metric-value">{kpi.value ?? '—'}</strong>
              <span className="admin-overview-metric-hint">{kpi.hint}</span>
            </div>
          ))}
        </section>

        <section className="admin-overview-registration">
          <div className="admin-overview-section-heading">
            <div>
              <h2>Member registrations</h2>
              <p>Track how member records entered the registry.</p>
            </div>
          </div>
          <div className="admin-overview-registration-grid">
            <Link href="/admin/members?registration_source=self_service" className="admin-overview-registration-card">
              <span className="admin-overview-registration-label">Self-registered</span>
              <strong>{memberRegistrationStats?.kpis.self_registered ?? '—'}</strong>
              <span className="admin-overview-card-action">Review member records <span aria-hidden="true">→</span></span>
            </Link>
            <Link href="/admin/members?registration_source=admin" className="admin-overview-registration-card">
              <span className="admin-overview-registration-label">Added by staff</span>
              <strong>{memberRegistrationStats?.kpis.admin_added ?? '—'}</strong>
              <span className="admin-overview-card-action">Review member records <span aria-hidden="true">→</span></span>
            </Link>
          </div>
        </section>

        {sections.map((section) => (
          <section key={section.title} className="admin-overview-link-section">
            <div className="admin-overview-section-heading">
              <span className="admin-overview-section-icon"><SectionIcon /></span>
              <h2>{section.title}</h2>
            </div>
            <div className="admin-overview-link-grid">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="admin-overview-link-card"
                >
                  <span className="admin-overview-link-card-top">
                    <span>{item.label}</span>
                    <span className="admin-overview-link-arrow" aria-hidden="true">↗</span>
                  </span>
                  <span className="admin-overview-link-description">
                    {LINK_DESCRIPTIONS[item.href] || `Open ${item.label.toLowerCase()} tools.`}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </OpsShell>
  );
}
