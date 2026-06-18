'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Member {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  membership_status: string;
  join_date: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMembers() {
      try {
        const response = await fetch('/api/members');
        if (!response.ok) {
          setError('Please sign in to view members.');
          return;
        }
        const data = await response.json();
        setMembers(data.results || []);
      } catch (err) {
        setError('Failed to load members.');
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, []);

  return (
    <div className='page-shell'>
      <section style={{ marginTop: '2rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
          <div>
            <h1>Members</h1>
            <p style={{ color: '#475569' }}>Manage member registrations and renewal status.</p>
          </div>
          <Link href='/dashboard' style={{ color: '#2563eb' }}>Back to dashboard</Link>
        </div>

        {error && <p style={{ color: '#b91c1c', marginTop: 16 }}>{error}</p>}

        {loading ? (
          <p>Loading members...</p>
        ) : members.length === 0 ? (
          <p style={{ color: '#64748b', marginTop: 16 }}>No members found.</p>
        ) : (
          <div style={{ marginTop: 24, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>Name</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Email</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Phone</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Join Date</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 12 }}>{member.full_name}</td>
                    <td style={{ padding: 12 }}>{member.email}</td>
                    <td style={{ padding: 12 }}>{member.phone}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 8,
                        background: member.membership_status === 'active' ? '#dcfce7' : '#fee2e2',
                        color: member.membership_status === 'active' ? '#166534' : '#991b1b'
                      }}>
                        {member.membership_status}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>{new Date(member.join_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
