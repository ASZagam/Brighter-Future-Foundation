'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { Badge, Card, EmptyState, WorkspaceShell } from '@/app/components/workspace';

interface NewsItem {
  id: string;
  title: string;
  category: string;
  published_at: string | null;
}

interface EventItem {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  location: string;
  is_public: boolean;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DonorWorkspacePage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      apiGet<{ results: NewsItem[] }>('/core/news/?ordering=-published_at&page_size=5'),
      apiGet<{ results: EventItem[] }>('/core/events/?ordering=start_date&page_size=5'),
    ]).then(([newsResult, eventResult]) => {
      if (!mounted) return;
      if (newsResult.status === 'fulfilled') setNews(newsResult.value?.results ?? []);
      if (eventResult.status === 'fulfilled') setEvents(eventResult.value?.results ?? []);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <WorkspaceShell
      kicker="My Giving"
      title="Your giving space"
      subtitle="Foundation updates and upcoming public events."
    >
      <Card title="About your account">
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.7 }}>
          Your account is linked to the foundation as a donor. Giving records are maintained by the
          finance office and are not linked to a personal login, so your contributions are confirmed
          through official receipts. Reach the finance office for a statement of your giving.
        </p>
      </Card>

      <Card title="Latest foundation news">
        {news.length ? (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {news.map((item) => (
              <li key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                <strong style={{ fontSize: 13, display: 'block' }}>{item.title}</strong>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                  {item.category ? `${item.category} · ` : ''}{formatDate(item.published_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState message="No published updates are available right now." />
        )}
      </Card>

      <Card title="Upcoming public events">
        {events.length ? (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
            {events.map((item) => (
              <li key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                <div>
                  <strong style={{ fontSize: 13, display: 'block' }}>{item.title}</strong>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                    {formatDate(item.start_date)}{item.location ? ` · ${item.location}` : ''}
                  </span>
                </div>
                <Badge>{item.is_public ? 'PUBLIC' : 'INTERNAL'}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState message="No upcoming events are published yet." />
        )}
      </Card>
    </WorkspaceShell>
  );
}
