'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { Card, EmptyState, WorkspaceShell } from '@/app/components/workspace';
import { useAuth } from '@/lib/auth-context';
import './member-dashboard.css';

interface PublicEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
}

interface OrganizationContact {
  email?: string;
  phone?: string;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function eventDateParts(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { month: 'TBA', day: '--' };
  return {
    month: new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(parsed).toUpperCase(),
    day: new Intl.DateTimeFormat('en-GB', { day: '2-digit' }).format(parsed),
  };
}

export default function MemberWorkspacePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [support, setSupport] = useState<OrganizationContact | null>(null);
  const [assignedProgramCount, setAssignedProgramCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      apiGet<PublicEvent[]>('/v2/public/events/'),
      apiGet<OrganizationContact>('/v2/public/organization/'),
      apiGet<unknown[]>('/core/programs/assigned-to-me/'),
    ]).then(([eventResult, supportResult, assignmentResult]) => {
      if (!mounted) return;

      if (eventResult.status === 'fulfilled') setEvents(eventResult.value ?? []);
      if (supportResult.status === 'fulfilled') setSupport(supportResult.value);
      if (assignmentResult.status === 'fulfilled') setAssignedProgramCount(assignmentResult.value.length);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const upcomingEvents = events
    .filter((event) => new Date(event.end_date).getTime() >= Date.now())
    .slice(0, 3);

  return (
    <WorkspaceShell
      kicker="Dashboard"
      title={`Welcome${user?.full_name || user?.username ? `, ${user.full_name || user.username}` : ''}`}
      subtitle="Stay connected with foundation updates, events, and programs you are part of."
    >
      <div className="member-dashboard">
        <section className="member-dashboard__metrics" aria-label="Membership at a glance">
          <article className="member-dashboard__metric">
            <span>My programs</span>
            <strong>{loading ? '...' : assignedProgramCount}</strong>
            <small><Link href="/my-programs">View assigned programs</Link></small>
          </article>
          <article className="member-dashboard__metric">
            <span>Upcoming events</span>
            <strong>{loading ? '...' : upcomingEvents.length}</strong>
            <small>Public foundation events</small>
          </article>
        </section>

        <div className="member-dashboard__columns member-dashboard__columns--single">
          <Card title="Upcoming public events" action={<Link href="/news" className="member-dashboard__panel-link">Newsroom and calendar</Link>}>
            {loading ? (
              <EmptyState message="Loading events..." />
            ) : upcomingEvents.length ? (
              <ul className="member-dashboard__event-list">
                {upcomingEvents.map((event) => {
                  const date = eventDateParts(event.start_date);
                  return (
                    <li className="member-dashboard__event" key={event.id}>
                      <time className="member-dashboard__event-date" dateTime={event.start_date}>
                        <span>{date.month}</span>
                        <strong>{date.day}</strong>
                      </time>
                      <div className="member-dashboard__event-copy">
                        <h3>{event.title}</h3>
                        <p>{event.location || 'Location to be announced'} · {formatDate(event.start_date)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState message="There are no upcoming public events right now. Check the newsroom for new dates." />
            )}
          </Card>
        </div>

        <div className="member-dashboard__columns member-dashboard__bottom">
          <Card title="Explore the foundation">
            <div className="member-dashboard__explore-links">
              <Link href="/programs"><strong>Programs</strong><span>Explore current foundation work</span></Link>
              <Link href="/news"><strong>News and field reports</strong><span>Read updates and event details</span></Link>
            </div>
            {support?.phone ? <p className="member-dashboard__support">Foundation office: <a href={`tel:${support.phone}`}>{support.phone}</a></p> : null}
          </Card>
        </div>
      </div>
    </WorkspaceShell>
  );
}
