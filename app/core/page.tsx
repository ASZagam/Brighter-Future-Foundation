'use client';

import { useEffect, useState } from 'react';
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

export default function CorePage() {
  const [stats, setStats] = useState<CoreStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await apiGet<CoreStats>('/core/dashboard-statistics/');
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load core dashboard statistics.');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className='page-shell' style={{ padding: '3rem 0' }}>
      <div className='section-title'>
        <div>
          <p className='eyebrow'>Core Foundation</p>
          <h1>Foundation status and administration</h1>
        </div>
        <Link href='/dashboard' className='button-link'>Back to dashboard</Link>
      </div>

      <div style={{ marginBottom: 32 }}>
        <p className='text-muted'>Review platform health across organization settings, uploads, notifications, and audit activity.</p>
      </div>

      <div className='card-grid' style={{ marginBottom: 32 }}>
        <Link href='/settings' className='card button-link' style={{ background: '#1d4ed8', color: '#fff' }}>
          <h2 style={{ margin: 0 }}>Organization Settings</h2>
          <p style={{ margin: '12px 0 0', color: '#dbeafe' }}>Manage global system configuration and operational defaults.</p>
        </Link>
        <Link href='/notifications' className='card action-button'>
          <h2 style={{ margin: 0 }}>Notification Center</h2>
          <p style={{ margin: '12px 0 0' }}>View alerts, messages, and mark notifications as read.</p>
        </Link>
        <Link href='/file-uploads' className='card action-button'>
          <h2 style={{ margin: 0 }}>File Uploads</h2>
          <p style={{ margin: '12px 0 0' }}>Upload and manage documents, images, and shared content.</p>
        </Link>
        <Link href='/references' className='card action-button'>
          <h2 style={{ margin: 0 }}>Reference Data</h2>
          <p style={{ margin: '12px 0 0' }}>Browse country and state reference tables for the system.</p>
        </Link>
      </div>

      <div className='card-grid'>
        <div className='stat-card'>
          <span className='eyebrow'>Organization</span>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>{loading ? '…' : stats?.organizations ?? 0}</p>
        </div>
        <div className='stat-card'>
          <span className='eyebrow'>Reference data</span>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>{loading ? '…' : `${stats?.countries ?? 0} countries`}</p>
          <p style={{ margin: '8px 0 0', color: '#475569' }}>{loading ? '' : `${stats?.states ?? 0} active states`}</p>
        </div>
        <div className='stat-card'>
          <span className='eyebrow'>Uploads</span>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>{loading ? '…' : stats?.active_uploads ?? 0}</p>
          <p style={{ margin: '8px 0 0', color: '#475569' }}>{loading ? '' : `Images: ${stats?.uploads_by_type.find((item) => item.upload_type === 'image')?.total ?? 0}, Docs: ${stats?.uploads_by_type.find((item) => item.upload_type === 'document')?.total ?? 0}`}</p>
        </div>
        <div className='stat-card'>
          <span className='eyebrow'>Notifications</span>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>{loading ? '…' : stats?.pending_notifications ?? 0}</p>
          <p style={{ margin: '8px 0 0', color: '#475569' }}>Unread notifications</p>
        </div>
        <div className='stat-card'>
          <span className='eyebrow'>Audit logs</span>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>{loading ? '…' : stats?.activity_logs ?? 0}</p>
          <p style={{ margin: '8px 0 0', color: '#475569' }}>Recorded actions</p>
        </div>
      </div>

      {error ? (
        <div className='card' style={{ borderColor: '#fca5a5', background: '#fef2f2' }}>
          <p style={{ margin: 0, color: '#b91c1c' }}>{error}</p>
        </div>
      ) : null}
    </div>
  );
}
