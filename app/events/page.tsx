'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  capacity: number;
  is_public: boolean;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch('/api/events');
        if (!response.ok) {
          setError('Please sign in to view events.');
          return;
        }
        const data = await response.json();
        setEvents(data.results || []);
      } catch (err) {
        setError('Failed to load events.');
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  return (
    <div className='page-shell'>
      <section style={{ marginTop: '2rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
          <div>
            <h1>Events</h1>
            <p style={{ color: '#475569' }}>Manage events and registrations.</p>
          </div>
          <Link href='/dashboard' style={{ color: '#2563eb' }}>Back to dashboard</Link>
        </div>

        {error && <p style={{ color: '#b91c1c', marginTop: 16 }}>{error}</p>}

        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <p style={{ color: '#64748b', marginTop: 16 }}>No events found.</p>
        ) : (
          <div style={{ marginTop: 24, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {events.map((event) => (
              <div key={event.id} style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>{event.title}</h3>
                <p style={{ margin: '8px 0', color: '#64748b', fontSize: '0.9rem' }}>📍 {event.location}</p>
                <p style={{ margin: '8px 0', color: '#64748b', fontSize: '0.9rem' }}>🗓️ {new Date(event.start_date).toLocaleDateString()}</p>
                <p style={{ margin: '8px 0', color: '#64748b', fontSize: '0.9rem' }}>👥 Capacity: {event.capacity}</p>
                {event.description && (
                  <p style={{ margin: '12px 0 0 0', color: '#475569', fontSize: '0.9rem' }}>{event.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
