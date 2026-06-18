'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet, apiPost } from '../../lib/api';

interface NotificationRecord {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  category: string;
  read: boolean;
  sent_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [markLoading, setMarkLoading] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const data = await apiGet<NotificationRecord[]>('/core/notifications/');
        setNotifications(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load notifications.');
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  async function markAllRead() {
    setMarkLoading(true);
    try {
      await apiPost('/core/notifications/mark_all_read/');
      setNotifications((items) => items.map((item) => ({ ...item, read: true })));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to mark notifications as read.');
    } finally {
      setMarkLoading(false);
    }
  }

  async function markRead(id: number) {
    try {
      await apiPost(`/core/notifications/${id}/mark_read/`);
      setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item));
    } catch (err: any) {
      setError(err.message || 'Unable to mark notification as read.');
    }
  }

  return (
    <div className='page-shell' style={{ padding: '3rem 0' }}>
      <div className='section-title'>
        <div>
          <p className='eyebrow'>Notification Center</p>
          <h1>Manage alerts and platform messages</h1>
        </div>
        <Link href='/core' className='button-link'>Return to Core</Link>
      </div>

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <p className='text-muted'>Review unread messages and keep your team informed with a single action.</p>
        <button type='button' className='button-link' onClick={markAllRead} disabled={loading || markLoading}>
          {markLoading ? 'Updating…' : 'Mark all read'}
        </button>
      </div>

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      {loading ? (
        <p>Loading notifications…</p>
      ) : notifications.length === 0 ? (
        <div className='card'>
          <p style={{ margin: 0, color: '#475569' }}>No notifications are available right now.</p>
        </div>
      ) : (
        <div className='card-grid'>
          {notifications.map((notification) => (
            <div key={notification.id} className='card' style={{ opacity: notification.read ? 0.72 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                <div>
                  <p className='eyebrow'>{notification.notification_type.toUpperCase()}</p>
                  <h2 style={{ margin: '0.75rem 0 0', fontSize: '1.05rem' }}>{notification.title}</h2>
                </div>
                {!notification.read ? (
                  <button type='button' onClick={() => markRead(notification.id)} className='action-button' style={{ minHeight: 'auto', padding: '10px 14px' }}>
                    Mark read
                  </button>
                ) : (
                  <span className='action-button' style={{ minHeight: 'auto', padding: '10px 14px' }}>Read</span>
                )}
              </div>
              <p style={{ color: '#475569', margin: '16px 0' }}>{notification.message}</p>
              <p style={{ margin: 0, color: '#64748b' }}>{notification.category || 'General'} · {new Date(notification.sent_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
