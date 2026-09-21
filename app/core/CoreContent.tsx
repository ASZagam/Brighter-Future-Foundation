'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '../../lib/api';

interface CoreStats {
  organizations: number;
  countries: number;
  states: number;
  active_uploads: number;
  pending_notifications: number;
  activity_logs: number;
  settings_count: number;
  uploads_by_type: Array<{ upload_type: string; total: number }>;
}

const actions = [
  { href: '/settings', title: 'Organization settings', copy: 'Manage platform defaults and support details.', icon: '⚙', featured: true },
  { href: '/notifications', title: 'Notification center', copy: 'Review alerts and platform messages.', icon: 'bell' },
  { href: '/file-uploads', title: 'File uploads', copy: 'Manage documents, images, and shared content.', icon: '↥' },
  { href: '/references', title: 'Reference data', copy: 'Browse countries and states.', icon: '◎' },
];

export default function CoreContent() {
  const [stats, setStats] = useState<CoreStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await apiGet<CoreStats>('/core/dashboard-statistics/');
      setStats(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to load core dashboard statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats(false);
  }, [loadStats]);

  const totalUploads = (stats?.uploads_by_type ?? []).reduce((sum, item) => sum + item.total, 0);

  return (
    <main className="core-content">
      <div className="core-kicker" style={{ fontSize: 12 }}>
        <span>FOUNDATION &amp; ADMINISTRATION</span>
        <i>|</i>
        <span style={{ color: '#6b7584', fontWeight: 600 }}>Core backend health, uploads, notifications &amp; audit</span>
      </div>

      <div className="core-heading">
        <div>
          <h1>Foundation &amp; Administration</h1>
          <p>Review platform health across organization settings, uploads, notifications, and audit activity.</p>
        </div>
        <div className="core-heading-actions">
          <button type="button" onClick={() => { setRefreshing(true); loadStats(true); }} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : '↻ Refresh'}
          </button>
          <Link href="/admin">Audit Activity Logs</Link>
          <Link href="/settings" className="primary">Organization Settings</Link>
        </div>
      </div>

      {error ? <div className="core-live-notice warn">API issue — {error}</div> : !error && !loading && stats ? (
        <div className="core-live-notice">Live system operational · N orgs · {stats.countries} countries · {settingsCountText(stats.settings_count)}</div>
      ) : null}

      <div className="core-kpis">
        <div className="core-kpi">
          <span className="core-kpi-label">Organization</span>
          <strong className="core-kpi-value">{loading ? '…' : stats?.organizations ?? 0}</strong>
          <span className="core-kpi-foot">registered workspace</span>
        </div>
        <div className="core-kpi">
          <span className="core-kpi-label">Reference data</span>
          <strong className="core-kpi-value">{loading ? '…' : stats?.countries ?? 0}</strong>
          <span className="core-kpi-foot">{loading ? '' : `${stats?.states ?? 0} active states`}</span>
        </div>
        <div className="core-kpi">
          <span className="core-kpi-label">Active uploads</span>
          <strong className="core-kpi-value">{loading ? '…' : stats?.active_uploads ?? 0}</strong>
          <span className="core-kpi-foot">{totalUploads > 0 ? `${totalUploads} by type` : 'no files yet'}</span>
        </div>
        <div className="core-kpi">
          <span className="core-kpi-label">Unread notifications</span>
          <strong className="core-kpi-value">{loading ? '…' : stats?.pending_notifications ?? 0}</strong>
          <span className="core-kpi-foot">pending review</span>
        </div>
        <div className="core-kpi">
          <span className="core-kpi-label">Audit logs</span>
          <strong className="core-kpi-value">{loading ? '…' : stats?.activity_logs ?? 0}</strong>
          <span className="core-kpi-foot">recorded activity</span>
        </div>
      </div>

      <div className="core-actions">
        {actions.map((action) => (
          <Link key={action.title} href={action.href} className={`core-action${action.featured ? ' core-action-featured' : ''}`}>
            <span className="core-action-icon" aria-hidden="true">{action.icon}</span>
            <span className="core-action-copy"><strong>{action.title}</strong><small>{action.copy}</small></span>
            <span className="core-action-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>

      {stats && stats.uploads_by_type.length > 0 ? (
        <section className="core-panel">
          <div className="core-panel-toolbar">
            <strong>Uploads by type</strong>
            <span>{totalUploads} total · refreshed from Django</span>
          </div>
          {stats.uploads_by_type.map((item) => {
            const pct = totalUploads > 0 ? Math.max(4, Math.round((item.total / totalUploads) * 100)) : 0;
            return (
              <div className="core-upload-row" key={item.upload_type}>
                <strong>{item.upload_type.replace(/_/g, ' ')}</strong>
                <div className="core-upload-bar"><i style={{ width: `${pct}%` }} /></div>
                <span>{item.total}</span>
              </div>
            );
          })}
        </section>
      ) : null}

      <div className="core-api-status">
        <span className="go">● System Good</span>
        <span>Django 5.2.15 · DRF 3.17.1 · PostgreSQL <b>bff_db</b></span>
        <span className="nl">Live via REST</span>
        <span>Etc/UTC</span>
      </div>
    </main>
  );
}

function settingsCountText(count: number): string {
  return count === 1 ? '1 setting group' : `${count} setting groups`;
}