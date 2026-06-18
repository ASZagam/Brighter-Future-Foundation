'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

interface DashboardUser {
  full_name: string;
  email: string;
  status: string;
  roles: string[];
}

interface DashboardStats {
  organizations: number;
  countries: number;
  states: number;
  active_uploads: number;
  pending_notifications: number;
  activity_logs: number;
  settings_count: number;
}

interface DashboardData {
  user?: DashboardUser;
  stats?: DashboardStats;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [userResponse, stats] = await Promise.all([
          fetch('/api/auth/me', { credentials: 'include' }),
          apiGet<DashboardStats>('/core/dashboard-statistics/'),
        ]);

        if (!userResponse.ok) {
          setError('Please sign in to access the dashboard.');
          return;
        }

        const user = await userResponse.json();
        setData({ user, stats });
      } catch (err) {
        console.error('Dashboard load failed:', err);
        setError('Unable to load dashboard data. Please refresh or sign in again.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (error) {
    return (
      <div style={{ maxWidth: 700, margin: '4rem auto', padding: 24, background: '#fff', borderRadius: 24 }}>
        <h1>Dashboard</h1>
        <p style={{ color: '#b91c1c' }}>{error}</p>
        <Link href='/auth/login' style={{ color: '#2563eb' }}>Sign in</Link>
      </div>
    );
  }

  const modules = [
    { label: 'Members', href: '/members', icon: '👥' },
    { label: 'Volunteers', href: '/volunteers', icon: '🙋' },
    { label: 'Donations', href: '/donations', icon: '💝' },
    { label: 'Events', href: '/events', icon: '📅' },
    { label: 'News', href: '/news', icon: '📰' },
    { label: 'Core', href: '/core', icon: '⚙️' },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '4rem auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: '#475569', margin: 0 }}>Manage the Brighter Future Foundation platform.</p>
        </div>
        <Link href='/auth/logout' style={{ padding: '10px 16px', borderRadius: 12, background: '#e0f2fe', color: '#0c4a6e', textDecoration: 'none', fontWeight: 600 }}>Logout</Link>
      </div>

      {data.user ? (
        <section style={{ marginBottom: 32, padding: 24, background: '#eff6ff', borderRadius: 20, border: '1px solid #bfdbfe' }}>
          <h2>Welcome back, {data.user.full_name}</h2>
          <p style={{ margin: '4px 0', color: '#334155' }}><strong>Email:</strong> {data.user.email}</p>
          <p style={{ margin: '4px 0', color: '#334155' }}><strong>Status:</strong> {data.user.status}</p>
          <p style={{ margin: '4px 0', color: '#334155' }}><strong>Roles:</strong> {data.user.roles.join(', ') || 'Member'}</p>
        </section>
      ) : null}

      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0 }}>Dashboard Statistics</h2>
            <p style={{ color: '#475569', margin: '8px 0 0' }}>Your live platform metrics from the core backend.</p>
          </div>
          {loading ? (
            <span style={{ color: '#64748b', fontSize: '0.95rem' }}>Loading statistics…</span>
          ) : null}
        </div>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div style={{ padding: 20, borderRadius: 18, background: '#fff', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' }}>Organizations</p>
            <p style={{ margin: '12px 0 0', fontSize: '2rem', color: '#1d4ed8' }}>{data.stats?.organizations ?? '—'}</p>
          </div>
          <div style={{ padding: 20, borderRadius: 18, background: '#fff', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' }}>Active Uploads</p>
            <p style={{ margin: '12px 0 0', fontSize: '2rem', color: '#0d9488' }}>{data.stats?.active_uploads ?? '—'}</p>
          </div>
          <div style={{ padding: 20, borderRadius: 18, background: '#fff', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' }}>Pending Notifications</p>
            <p style={{ margin: '12px 0 0', fontSize: '2rem', color: '#dc2626' }}>{data.stats?.pending_notifications ?? '—'}</p>
          </div>
          <div style={{ padding: 20, borderRadius: 18, background: '#fff', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' }}>Activity Logs</p>
            <p style={{ margin: '12px 0 0', fontSize: '2rem', color: '#9333ea' }}>{data.stats?.activity_logs ?? '—'}</p>
          </div>
          <div style={{ padding: 20, borderRadius: 18, background: '#fff', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' }}>Countries</p>
            <p style={{ margin: '12px 0 0', fontSize: '2rem', color: '#059669' }}>{data.stats?.countries ?? '—'}</p>
          </div>
          <div style={{ padding: 20, borderRadius: 18, background: '#fff', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' }}>States</p>
            <p style={{ margin: '12px 0 0', fontSize: '2rem', color: '#0f172a' }}>{data.stats?.states ?? '—'}</p>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 20 }}>Platform Modules</h2>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {modules.map((module) => (
            <Link key={module.href} href={module.href} style={{
              padding: 24,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              textDecoration: 'none',
              color: 'inherit',
              transition: 'all 0.2s ease',
            }} onMouseOver={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.borderColor = '#2563eb';
              target.style.boxShadow = '0 10px 30px rgba(37, 99, 235, 0.1)';
            }} onMouseOut={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.borderColor = '#e2e8f0';
              target.style.boxShadow = 'none';
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '2rem' }}>{module.icon}</p>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>{module.label}</h3>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ padding: 24, borderRadius: 20, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <h2 style={{ margin: 0 }}>Quick Links</h2>
          <Link href='/core' className='button-link' style={{ padding: '12px 18px' }}>Open Core</Link>
        </div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <Link href='/members' className='action-button'>Members</Link>
          <Link href='/volunteers' className='action-button'>Volunteers</Link>
          <Link href='/donations' className='action-button'>Donations</Link>
          <Link href='/events' className='action-button'>Events</Link>
          <Link href='/news' className='action-button'>News</Link>
          <Link href='/settings' className='action-button'>Settings</Link>
          <Link href='/notifications' className='action-button'>Notifications</Link>
          <Link href='/file-uploads' className='action-button'>Uploads</Link>
          <Link href='/references' className='action-button'>References</Link>
        </div>
      </section>
    </div>
  );
}


