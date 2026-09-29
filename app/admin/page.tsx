'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import OpsShell from '@/app/components/OpsShell';
import { useAuth } from '@/lib/auth-context';
import { navigationFor } from '@/lib/auth/navigation';
import { roleLabel } from '@/lib/auth/roles';
import { apiGet } from '@/lib/api';

interface DashboardStats {
  organizations: number;
  countries: number;
  states: number;
  active_uploads: number;
  pending_notifications: number;
  activity_logs: number;
  settings_count: number;
}

const ICON_STROKE = { width: 18, height: 18, strokeWidth: 1.8, stroke: 'currentColor', fill: 'none' } as const;

function SectionIcon() {
  return <svg style={ICON_STROKE} viewBox="0 0 24 24"><path d="M4 5h16M4 12h16M4 19h10" /></svg>;
}

export default function AdminOverviewPage() {
  const { user, primaryRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const sections = navigationFor(user);

  useEffect(() => {
    let mounted = true;
    apiGet<DashboardStats>('/core/dashboard-statistics/')
      .then((data) => {
        if (mounted) setStats(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const kpis = [
    { label: 'Organizations', value: stats?.organizations, hint: 'Registered' },
    { label: 'Countries', value: stats?.countries, hint: 'Registry' },
    { label: 'States covered', value: stats?.states, hint: 'Coverage' },
    { label: 'Audit events', value: stats?.activity_logs, hint: 'Trail' },
  ];

  return (
    <OpsShell>
      <div className="db-content">
        <header style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--brand-text)', fontWeight: 700 }}>ADMIN CONSOLE</p>
          <h1 style={{ fontSize: 26, margin: '6px 0 4px' }}>
            Welcome{user?.full_name ? `, ${user.full_name}` : ''}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Signed in as <strong>{roleLabel(primaryRole)}</strong>. Management tools are grouped below and limited to your role.
          </p>
        </header>

        <div className="db-content-grid" style={{ marginBottom: 28 }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '18px 20px' }}>
              <p style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--text-faint)', marginBottom: 6 }}>{kpi.label.toUpperCase()}</p>
              <p style={{ fontSize: 26, fontWeight: 700 }}>{kpi.value ?? <span style={{ fontSize: 16, color: 'var(--text-inverse-muted)' }}>—</span>}</p>
              <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>{kpi.hint}</p>
            </div>
          ))}
        </div>

        {sections.map((section) => (
          <section key={section.title} style={{ marginBottom: 26 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ color: 'var(--brand-text)' }}><SectionIcon /></span>
              <h2 style={{ fontSize: 14, letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>{section.title.toUpperCase()}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{ display: 'block', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '16px 18px', textDecoration: 'none', color: 'var(--text-primary)' }}
                >
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>{item.href}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </OpsShell>
  );
}
