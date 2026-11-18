'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { Badge, Card, EmptyState, ErrorNote, WorkspaceShell } from '../components/workspace';

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
        const data = await apiGet<{ results: NotificationRecord[]; count: number }>('/core/notifications/');
        setNotifications(data.results ?? []);
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
      window.dispatchEvent(new Event('bff:notifications-updated'));
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
      window.dispatchEvent(new Event('bff:notifications-updated'));
    } catch (err: any) {
      setError(err.message || 'Unable to mark notification as read.');
    }
  }

  return (
    <WorkspaceShell
      kicker='Notifications'
      title='Notifications'
      subtitle='Messages and account updates sent to you.'
    >
      <Card
        title='Notification history'
        action={
          <button
            type='button'
            className='notification-mark-all'
            onClick={markAllRead}
            disabled={loading || markLoading || !notifications.some((item) => !item.read)}
          >
            {markLoading ? 'Updating…' : 'Mark all read'}
          </button>
        }
      >
        {error ? <ErrorNote message={error} /> : null}
        {loading ? <EmptyState message='Loading notifications…' /> : notifications.length === 0 ? (
          <EmptyState message='You are all caught up. New account updates will appear here.' />
        ) : (
          <div className='notification-list'>
            {notifications.map((notification) => (
              <article key={notification.id} className={`notification-item${notification.read ? '' : ' is-unread'}`}>
                <div className='notification-item-heading'>
                  <div>
                    <Badge>{notification.notification_type}</Badge>
                    <h2>{notification.title}</h2>
                  </div>
                  {!notification.read ? (
                    <button type='button' onClick={() => markRead(notification.id)} className='notification-mark-one'>
                      Mark read
                    </button>
                  ) : (
                    <span className='notification-read-label'>Read</span>
                  )}
                </div>
                <p className='notification-item-message'>{notification.message}</p>
                <p className='notification-item-meta'>{notification.category || 'General'} · {new Date(notification.sent_at).toLocaleString()}</p>
              </article>
            ))}
          </div>
        )}
      </Card>
    </WorkspaceShell>
  );
}
