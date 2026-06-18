'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Volunteer {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  bio: string;
  joined_at: string;
  skills_list: string[];
}

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadVolunteers() {
      try {
        const response = await fetch('/api/volunteers');
        if (!response.ok) {
          setError('Please sign in to view volunteers.');
          return;
        }
        const data = await response.json();
        setVolunteers(data.results || []);
      } catch (err) {
        setError('Failed to load volunteers.');
      } finally {
        setLoading(false);
      }
    }

    loadVolunteers();
  }, []);

  return (
    <div className='page-shell'>
      <section style={{ marginTop: '2rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
          <div>
            <h1>Volunteers</h1>
            <p style={{ color: '#475569' }}>Manage volunteer profiles and activities.</p>
          </div>
          <Link href='/dashboard' style={{ color: '#2563eb' }}>Back to dashboard</Link>
        </div>

        {error && <p style={{ color: '#b91c1c', marginTop: 16 }}>{error}</p>}

        {loading ? (
          <p>Loading volunteers...</p>
        ) : volunteers.length === 0 ? (
          <p style={{ color: '#64748b', marginTop: 16 }}>No volunteers found.</p>
        ) : (
          <div style={{ marginTop: 24, display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {volunteers.map((volunteer) => (
              <div key={volunteer.id} style={{ padding: 20, border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>{volunteer.full_name}</h3>
                <p style={{ margin: '4px 0', color: '#64748b', fontSize: '0.9rem' }}>{volunteer.email}</p>
                <p style={{ margin: '4px 0', color: '#64748b', fontSize: '0.9rem' }}>{volunteer.phone}</p>
                <p style={{ margin: '12px 0 4px 0', color: '#475569', fontSize: '0.85rem' }}>Joined: {new Date(volunteer.joined_at).toLocaleDateString()}</p>
                {volunteer.skills_list && volunteer.skills_list.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {volunteer.skills_list.map((skill) => (
                      <span key={skill} style={{padding: '4px 10px', borderRadius: 6, background: '#eff6ff', color: '#0c4a6e', fontSize: '0.85rem'}}>
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
